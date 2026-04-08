import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import { eq, and, sql, inArray } from "drizzle-orm";
import { events, eventParticipation, alunos, programs, turmas, scheduledWebinars } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL!;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

interface EventRow {
  idUsuario: string;
  nomeAluno: string;
  idTurma: string;
  turmaGrupo: string;
  cicloTrilha: string;
  idTrilha: string;
  trilha: string;
  tipoEvento: string;
  tituloEvento: string;
  dataEvento: string;
  statusPresenca: string;
}

function parseCSVFile(filePath: string): EventRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  
  // Find header line (contains "Nome do aluno")
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Nome do aluno")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error("Header not found in " + filePath);
  
  const rows: EventRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (!vals[0] || vals[0].startsWith("RELAT")) continue;
    if (vals.length < 11) continue;
    
    rows.push({
      idUsuario: vals[0]?.trim() || "",
      nomeAluno: vals[1]?.trim() || "",
      idTurma: vals[2]?.trim() || "",
      turmaGrupo: vals[3]?.trim() || "",
      cicloTrilha: vals[4]?.trim() || "",
      idTrilha: vals[5]?.trim() || "",
      trilha: vals[6]?.trim() || "",
      tipoEvento: vals[7]?.trim() || "",
      tituloEvento: vals[8]?.trim() || "",
      dataEvento: vals[9]?.trim() || "",
      statusPresenca: vals[10]?.trim() || "",
    });
  }
  return rows;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // Format: DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

function detectProgram(turmaGrupo: string): string {
  const lower = turmaGrupo.toLowerCase();
  if (lower.includes("sebrae tocantins") || lower.includes("sebrae to")) return "SEBRAE TO";
  if (lower.includes("sebrae acre")) return "SEBRAE ACRE";
  if (lower.includes("embrapii")) return "EMBRAPII";
  if (lower.includes("banrisul")) return "BANRISUL";
  return "UNKNOWN";
}

async function main() {
  const pool = createPool(DATABASE_URL);
  const db = drizzle(pool);
  
  // Load all 3 CSV files
  const files = [
    { path: "/home/ubuntu/Downloads/embrapii-eventos.csv", label: "SEBRAE TO" },
    { path: "/home/ubuntu/Downloads/eventos2.csv", label: "EMBRAPII" },
    { path: "/home/ubuntu/Downloads/eventos3.csv", label: "SEBRAE ACRE" },
  ];
  
  let allRows: EventRow[] = [];
  for (const f of files) {
    const rows = parseCSVFile(f.path);
    console.log(`${f.label}: ${rows.length} registros`);
    allRows = allRows.concat(rows);
  }
  console.log(`Total de registros: ${allRows.length}`);
  
  // Get alunos from DB
  const dbAlunos = await db.select().from(alunos);
  const alunoByExternalId = new Map<string, number>();
  const alunoByName = new Map<string, number>();
  for (const a of dbAlunos) {
    if (a.externalId) alunoByExternalId.set(a.externalId, a.id);
    if (a.name) alunoByName.set(a.name.toLowerCase().trim(), a.id);
  }
  
  // Get programs from DB
  const dbPrograms = await db.select().from(programs);
  const programByName = new Map<string, number>();
  for (const p of dbPrograms) {
    programByName.set(p.name.toUpperCase(), p.id);
  }
  
  // Get turmas from DB
  const dbTurmas = await db.select().from(turmas);
  const turmaByName = new Map<string, number>();
  for (const t of dbTurmas) {
    if (t.name) turmaByName.set(t.name.toLowerCase().trim(), t.id);
  }
  
  // Step 1: Delete old events (except BANRISUL)
  // Find BANRISUL program ID
  const banrisulId = programByName.get("BANRISUL");
  console.log(`\nBANRISUL program ID: ${banrisulId}`);
  
  // Get event IDs that belong to BANRISUL
  let banrisulEventIds: number[] = [];
  if (banrisulId) {
    const banrisulEvents = await db.select({ id: events.id }).from(events).where(eq(events.programId, banrisulId));
    banrisulEventIds = banrisulEvents.map(e => e.id);
    console.log(`Eventos BANRISUL a preservar: ${banrisulEventIds.length}`);
  }
  
  // Delete non-BANRISUL event participation
  if (banrisulEventIds.length > 0) {
    const delPart = await db.execute(sql`DELETE FROM event_participation WHERE eventId NOT IN (${sql.join(banrisulEventIds.map(id => sql`${id}`), sql`, `)})`);
    console.log(`Participações não-BANRISUL removidas`);
    const delEvents = await db.execute(sql`DELETE FROM events WHERE id NOT IN (${sql.join(banrisulEventIds.map(id => sql`${id}`), sql`, `)})`);
    console.log(`Eventos não-BANRISUL removidos`);
  } else {
    await db.execute(sql`DELETE FROM event_participation`);
    await db.execute(sql`DELETE FROM events`);
    console.log(`Todos os eventos e participações removidos (sem BANRISUL para preservar)`);
  }
  
  // Step 2: Create unique events and insert participation
  const eventMap = new Map<string, { title: string; type: string; date: string | null; programName: string; programId: number | null }>();
  
  for (const row of allRows) {
    const key = row.tituloEvento;
    if (!key) continue;
    if (!eventMap.has(key)) {
      const progName = detectProgram(row.turmaGrupo);
      const progId = programByName.get(progName) || null;
      eventMap.set(key, {
        title: row.tituloEvento,
        type: row.tipoEvento.toLowerCase().includes("webinar") ? "webinar" : "curso_online",
        date: parseDate(row.dataEvento),
        programName: progName,
        programId: progId,
      });
    }
  }
  
  console.log(`\nEventos únicos a criar: ${eventMap.size}`);
  
  // Insert events and get IDs
  const eventIdMap = new Map<string, number>();
  for (const [key, ev] of eventMap) {
    const result = await db.insert(events).values({
      title: ev.title,
      eventType: ev.type as any,
      eventDate: ev.date,
      programId: null, // Events are shared across programs
    });
    eventIdMap.set(key, result[0].insertId);
  }
  console.log(`Eventos inseridos: ${eventIdMap.size}`);
  
  // Step 3: Also populate scheduled_webinars for admin management
  // Clear existing scheduled_webinars (fresh start)
  await db.execute(sql`DELETE FROM scheduled_webinars`);
  
  for (const [key, ev] of eventMap) {
    const eventDate = ev.date ? new Date(ev.date + "T10:00:00Z") : new Date();
    const isPast = eventDate < new Date();
    await db.insert(scheduledWebinars).values({
      title: ev.title,
      theme: ev.type === "webinar" ? "Webinar" : "Curso Online",
      eventDate: eventDate,
      duration: 60,
      status: isPast ? "completed" : "published",
      createdBy: 1, // admin
    });
  }
  console.log(`Scheduled webinars inseridos: ${eventMap.size}`);
  
  // Step 4: Insert participation records
  let inserted = 0;
  let skipped = 0;
  let alunoNotFound = new Set<string>();
  
  for (const row of allRows) {
    if (!row.tituloEvento || !row.nomeAluno) { skipped++; continue; }
    
    const eventId = eventIdMap.get(row.tituloEvento);
    if (!eventId) { skipped++; continue; }
    
    // Find aluno
    let alunoId = alunoByExternalId.get(row.idUsuario);
    if (!alunoId) {
      alunoId = alunoByName.get(row.nomeAluno.toLowerCase().trim());
    }
    if (!alunoId) {
      alunoNotFound.add(`${row.nomeAluno} (${row.idUsuario})`);
      skipped++;
      continue;
    }
    
    const status = row.statusPresenca.toLowerCase().includes("presente") ? "presente" : "ausente";
    
    await db.insert(eventParticipation).values({
      eventId,
      alunoId,
      status: status as any,
    });
    inserted++;
  }
  
  console.log(`\n=== RESULTADO ===`);
  console.log(`Participações inseridas: ${inserted}`);
  console.log(`Ignoradas: ${skipped}`);
  console.log(`Alunos não encontrados (${alunoNotFound.size}):`);
  for (const a of alunoNotFound) console.log(`  - ${a}`);
  
  // Verify
  const totalEvents = await db.select({ count: sql`COUNT(*)` }).from(events);
  const totalPart = await db.select({ count: sql`COUNT(*)` }).from(eventParticipation);
  const totalWebinars = await db.select({ count: sql`COUNT(*)` }).from(scheduledWebinars);
  console.log(`\n=== VERIFICAÇÃO ===`);
  console.log(`Total eventos no banco: ${(totalEvents[0] as any).count}`);
  console.log(`Total participações no banco: ${(totalPart[0] as any).count}`);
  console.log(`Total scheduled webinars: ${(totalWebinars[0] as any).count}`);
  
  await pool.end();
}

main().catch(console.error);
