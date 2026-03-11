import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Testa que scheduled_webinars (published/completed) são incluídos
 * na unificação de eventos via getEventsByProgramOrGlobal.
 *
 * Cenários testados:
 * 1. Scheduled webinar sem correspondente em events → deve ser incluído como evento sintético
 * 2. Scheduled webinar COM correspondente em events → NÃO deve duplicar
 * 3. Scheduled webinar com título levemente diferente (espaço ao redor de traço) → NÃO deve duplicar
 * 4. Scheduled webinar draft/cancelled → NÃO deve ser incluído
 * 5. Scheduled webinar de outro programa → NÃO deve ser incluído
 * 6. Scheduled webinar global (programId null) → deve ser incluído para qualquer programa
 */

// Extrair a lógica de normalização e deduplicação para testar isoladamente
function normTitle(t: string | null): string {
  if (!t) return '';
  return t.toLowerCase().trim()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}

function coreTitle(n: string): string {
  return n.replace(/^(\d{4}\/\d+\s*-\s*)?(aula\s*\d+\s*-\s*)?/i, '').trim();
}

interface MockEvent {
  id: number;
  externalId: string | null;
  title: string;
  eventType: string;
  eventDate: Date | null;
  videoLink: string | null;
  programId: number | null;
  trilhaId: number | null;
  createdAt: Date;
}

interface MockScheduledWebinar {
  id: number;
  title: string;
  eventDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  youtubeLink: string | null;
  programId: number | null;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  createdAt: Date;
}

/**
 * Simula a lógica de getEventsByProgramOrGlobal com inclusão de scheduled_webinars
 */
function simulateGetEventsByProgramOrGlobal(
  programId: number,
  allEvts: MockEvent[],
  allScheduledWebinars: MockScheduledWebinar[]
): MockEvent[] {
  // Filtrar scheduled_webinars por status
  const validSWs = allScheduledWebinars.filter(
    sw => sw.status === 'published' || sw.status === 'completed'
  );

  // Criar set de core keys dos eventos existentes
  const existingCoreKeys = new Set<string>();
  for (const evt of allEvts) {
    const core = coreTitle(normTitle(evt.title));
    const dateStr = evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : 'nodate';
    existingCoreKeys.add(`${core}|${dateStr}`);
  }

  // Adicionar scheduled_webinars como eventos sintéticos
  const syntheticEvents: MockEvent[] = [];
  for (const sw of validSWs) {
    // Filtrar por programa
    if (sw.programId && sw.programId !== programId) continue;
    // Verificar se já existe
    const swCore = coreTitle(normTitle(sw.title));
    const swDateStr = sw.eventDate ? new Date(sw.eventDate).toISOString().split('T')[0] : 'nodate';
    const swKey = `${swCore}|${swDateStr}`;
    if (existingCoreKeys.has(swKey)) continue;
    // Criar evento sintético
    syntheticEvents.push({
      id: sw.id + 900000,
      externalId: `sw-${sw.id}`,
      title: sw.title,
      eventType: 'webinar',
      eventDate: sw.eventDate ? new Date(sw.eventDate) : null,
      videoLink: sw.youtubeLink || null,
      programId: sw.programId,
      trilhaId: null,
      createdAt: sw.createdAt,
    });
    existingCoreKeys.add(swKey);
  }

  const combined = [...allEvts, ...syntheticEvents];

  // Deduplicar
  const seen = new Map<string, MockEvent>();
  const deduped: MockEvent[] = [];
  for (const evt of combined) {
    const core = coreTitle(normTitle(evt.title));
    const dateStr = evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : 'nodate';
    const dedupKey = `${core}|${dateStr}`;
    if (!seen.has(dedupKey)) {
      seen.set(dedupKey, evt);
      deduped.push(evt);
    }
  }
  return deduped;
}

describe("Inclusão de scheduled_webinars na unificação de eventos", () => {
  const programId = 16;

  it("deve incluir scheduled_webinar sem correspondente em events como evento sintético", () => {
    const events: MockEvent[] = [
      { id: 1, externalId: null, title: "Webinar 1", eventType: "webinar", eventDate: new Date("2025-03-01"), videoLink: null, programId: null, trilhaId: null, createdAt: new Date() },
    ];
    const scheduledWebinars: MockScheduledWebinar[] = [
      { id: 100, title: "Webinar Novo", eventDate: new Date("2025-04-01"), startDate: null, endDate: null, youtubeLink: "https://youtube.com/123", programId: null, status: "published", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    expect(result).toHaveLength(2);
    // O evento sintético deve ter id = 100 + 900000
    const synthetic = result.find(e => e.id === 900100);
    expect(synthetic).toBeDefined();
    expect(synthetic!.title).toBe("Webinar Novo");
    expect(synthetic!.externalId).toBe("sw-100");
    expect(synthetic!.videoLink).toBe("https://youtube.com/123");
  });

  it("NÃO deve duplicar quando scheduled_webinar tem correspondente exato em events", () => {
    const events: MockEvent[] = [
      { id: 30001, externalId: null, title: "2025/06 - Liderança Tóxica com Emerson Dias", eventType: "webinar", eventDate: new Date("2025-04-02"), videoLink: null, programId: null, trilhaId: null, createdAt: new Date() },
    ];
    const scheduledWebinars: MockScheduledWebinar[] = [
      { id: 1, title: "2025/06 - Liderança Tóxica com Emerson Dias", eventDate: new Date("2025-04-02T18:00:00Z"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "completed", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(30001); // Deve manter o evento real, não o sintético
  });

  it("NÃO deve duplicar quando scheduled_webinar tem título com diferença de espaço ao redor de traço", () => {
    // Caso real: SW#24 "–Estrutura" vs EVT#30014 "– Estrutura"
    const events: MockEvent[] = [
      { id: 30014, externalId: null, title: "2025/19 - Aula 01 – Estrutura e Conceitos de Projetos de Inovação com Emerson Dias", eventType: "webinar", eventDate: new Date("2025-10-15"), videoLink: null, programId: null, trilhaId: null, createdAt: new Date() },
    ];
    const scheduledWebinars: MockScheduledWebinar[] = [
      { id: 24, title: "2025/19 - Aula 01 –Estrutura e Conceitos de Projetos de Inovação com Emerson Dias", eventDate: new Date("2025-10-15T18:00:00Z"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "completed", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(30014); // Deve manter o evento real
  });

  it("NÃO deve incluir scheduled_webinar com status draft", () => {
    const events: MockEvent[] = [];
    const scheduledWebinars: MockScheduledWebinar[] = [
      { id: 200, title: "Webinar Rascunho", eventDate: new Date("2025-05-01"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "draft", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    expect(result).toHaveLength(0);
  });

  it("NÃO deve incluir scheduled_webinar com status cancelled", () => {
    const events: MockEvent[] = [];
    const scheduledWebinars: MockScheduledWebinar[] = [
      { id: 201, title: "Webinar Cancelado", eventDate: new Date("2025-05-01"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "cancelled", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    expect(result).toHaveLength(0);
  });

  it("NÃO deve incluir scheduled_webinar de outro programa", () => {
    const events: MockEvent[] = [];
    const scheduledWebinars: MockScheduledWebinar[] = [
      { id: 300, title: "Webinar Outro Programa", eventDate: new Date("2025-06-01"), startDate: null, endDate: null, youtubeLink: null, programId: 999, status: "published", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    expect(result).toHaveLength(0);
  });

  it("deve incluir scheduled_webinar global (programId null) para qualquer programa", () => {
    const events: MockEvent[] = [];
    const scheduledWebinars: MockScheduledWebinar[] = [
      { id: 400, title: "Webinar Global", eventDate: new Date("2025-07-01"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "published", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(900400);
    expect(result[0].title).toBe("Webinar Global");
  });

  it("deve manter contagem correta com mix de eventos reais e sintéticos", () => {
    const events: MockEvent[] = [
      { id: 1, externalId: null, title: "Webinar 1", eventType: "webinar", eventDate: new Date("2025-01-15"), videoLink: null, programId: null, trilhaId: null, createdAt: new Date() },
      { id: 2, externalId: null, title: "Webinar 2", eventType: "webinar", eventDate: new Date("2025-02-15"), videoLink: null, programId: null, trilhaId: null, createdAt: new Date() },
    ];
    const scheduledWebinars: MockScheduledWebinar[] = [
      // Este já existe em events
      { id: 10, title: "Webinar 1", eventDate: new Date("2025-01-15T18:00:00Z"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "completed", createdAt: new Date() },
      // Este é novo
      { id: 11, title: "Webinar 3", eventDate: new Date("2025-03-15T18:00:00Z"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "published", createdAt: new Date() },
      // Este é draft, não deve ser incluído
      { id: 12, title: "Webinar 4", eventDate: new Date("2025-04-15T18:00:00Z"), startDate: null, endDate: null, youtubeLink: null, programId: null, status: "draft", createdAt: new Date() },
    ];

    const result = simulateGetEventsByProgramOrGlobal(programId, events, scheduledWebinars);

    // 2 eventos reais + 1 sintético (Webinar 3) = 3 total
    expect(result).toHaveLength(3);
    expect(result.map(e => e.title).sort()).toEqual(["Webinar 1", "Webinar 2", "Webinar 3"]);
  });
});

describe("Normalização de títulos para deduplicação", () => {
  it("deve normalizar em-dash e en-dash para hífen", () => {
    expect(normTitle("Aula 01 – Estrutura")).toBe("aula 01 - estrutura");
    expect(normTitle("Aula 01 — Estrutura")).toBe("aula 01 - estrutura");
    expect(normTitle("Aula 01 - Estrutura")).toBe("aula 01 - estrutura");
  });

  it("deve normalizar espaços ao redor de hífens", () => {
    expect(normTitle("Aula 01 –Estrutura")).toBe("aula 01 - estrutura");
    expect(normTitle("Aula 01–Estrutura")).toBe("aula 01 - estrutura");
    expect(normTitle("Aula 01 – Estrutura")).toBe("aula 01 - estrutura");
  });

  it("deve extrair core title removendo prefixo de número e aula", () => {
    expect(coreTitle(normTitle("2025/19 - Aula 01 – Estrutura e Conceitos"))).toBe("estrutura e conceitos");
    expect(coreTitle(normTitle("2025/06 - Liderança Tóxica com Emerson Dias"))).toBe("liderança tóxica com emerson dias");
  });

  it("deve considerar títulos iguais após normalização como duplicatas", () => {
    const a = "2025/19 - Aula 01 –Estrutura e Conceitos de Projetos de Inovação com Emerson Dias";
    const b = "2025/19 - Aula 01 – Estrutura e Conceitos de Projetos de Inovação com Emerson Dias";
    expect(coreTitle(normTitle(a))).toBe(coreTitle(normTitle(b)));
  });
});
