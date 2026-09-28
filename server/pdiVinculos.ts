import { getRawConnection } from "./db";
import { ensureCourseMetadataTable } from "./courseMetadataRoutes";

// Vínculo estável entre a competência de origem de uma ação do PDI (código COMP:... ou
// TEC:..., vindo do catálogo do PDI) e uma competência do EcoLíder. Os cursos oferecidos
// ao PDI saem só destes vínculos; nomes nunca são comparados.

let tabelaPronta = false;

export async function ensurePdiVinculosTable() {
  if (tabelaPronta) return;
  const connection = await getRawConnection();
  if (!connection) {
    console.warn("[PdiVinculos] Banco indisponível; tabela de vínculos não verificada.");
    return;
  }
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS pdi_competencia_vinculo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigoPdi VARCHAR(160) NOT NULL,
      tipo VARCHAR(20) NOT NULL,
      rotuloPdi VARCHAR(255) NOT NULL,
      competenciaId INT NOT NULL,
      criadoPor INT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_pdi_competencia_vinculo (codigoPdi, competenciaId),
      KEY idx_pdi_competencia_vinculo_competencia (competenciaId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  tabelaPronta = true;
}

export const CODIGO_PDI_REGEX = /^(COMP:[A-Z0-9_]+:(BASICA|ESSENCIAL|MASTER|JORNADA):[A-Z0-9_]+|TEC:[A-Z0-9_.-]+)$/;

export type VinculoPdi = {
  id: number;
  codigoPdi: string;
  tipo: string;
  rotuloPdi: string;
  competenciaId: number;
  competenciaNome: string | null;
  trilhaNome: string | null;
};

export async function listarVinculos(): Promise<VinculoPdi[]> {
  await ensurePdiVinculosTable();
  const connection = await getRawConnection();
  if (!connection) return [];
  const [rows] = (await connection.execute(
    `SELECT v.id, v.codigoPdi, v.tipo, v.rotuloPdi, v.competenciaId,
            comp.nome AS competenciaNome, t.name AS trilhaNome
       FROM pdi_competencia_vinculo v
       LEFT JOIN competencias comp ON comp.id = v.competenciaId
       LEFT JOIN trilhas t ON t.id = comp.trilhaId
      ORDER BY v.rotuloPdi, comp.nome`
  )) as any;
  return Array.isArray(rows) ? rows : [];
}

export async function criarVinculo(dados: { codigoPdi: string; tipo: string; rotuloPdi: string; competenciaId: number; criadoPor: number | null }) {
  await ensurePdiVinculosTable();
  const connection = await getRawConnection();
  if (!connection) throw new Error("Banco indisponível");
  await connection.execute(
    `INSERT INTO pdi_competencia_vinculo (codigoPdi, tipo, rotuloPdi, competenciaId, criadoPor)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rotuloPdi = VALUES(rotuloPdi)`,
    [dados.codigoPdi, dados.tipo, dados.rotuloPdi, dados.competenciaId, dados.criadoPor]
  );
}

export async function removerVinculo(id: number) {
  await ensurePdiVinculosTable();
  const connection = await getRawConnection();
  if (!connection) throw new Error("Banco indisponível");
  await connection.execute(`DELETE FROM pdi_competencia_vinculo WHERE id = ?`, [id]);
}

export type LinhaCursoVinculado = {
  codigoPdi: string;
  competenciaId: number;
  competenciaNome: string;
  trilhaNome: string | null;
  cursoId: number;
  titulo: string;
  resumo: string | null;
  ordem: number;
  totalAvaliacoesCurso: number;
  totalAvaliacoesAtividades: number;
};

// Cursos ativos das competências ativas vinculadas aos códigos pedidos.
export async function buscarCursosPorCodigos(codigos: string[]): Promise<LinhaCursoVinculado[] | null> {
  if (codigos.length === 0) return [];
  await ensurePdiVinculosTable();
  await ensureCourseMetadataTable();
  const connection = await getRawConnection();
  if (!connection) return null;
  const marcadores = codigos.map(() => "?").join(", ");
  const [rows] = (await connection.execute(
    `SELECT v.codigoPdi, comp.id AS competenciaId, comp.nome AS competenciaNome, t.name AS trilhaNome,
            c.id AS cursoId, c.titulo, m.resumo, c.ordem,
            (SELECT COUNT(*) FROM avaliacoes_atividade a
              WHERE a.cursoId = c.id AND a.tipo = 'diagnostico_inicial' AND a.isActive = 1) AS totalAvaliacoesCurso,
            (SELECT COUNT(*) FROM avaliacoes_atividade a
               JOIN atividades_curso ac ON ac.id = a.atividadeId AND ac.isActive = 1
              WHERE ac.cursoId = c.id AND a.tipo = 'atividade' AND a.isActive = 1) AS totalAvaliacoesAtividades
       FROM pdi_competencia_vinculo v
       JOIN competencias comp ON comp.id = v.competenciaId AND comp.isActive = 1
       LEFT JOIN trilhas t ON t.id = comp.trilhaId
       JOIN cursos_competencias c ON c.competenciaId = comp.id AND c.isActive = 1
       LEFT JOIN curso_metadados m ON m.cursoId = c.id
      WHERE v.codigoPdi IN (${marcadores})
      ORDER BY v.codigoPdi, comp.nome, c.ordem, c.id`,
    codigos
  )) as any;
  return Array.isArray(rows) ? rows : [];
}

// Um curso pode estar em mais de um código pedido; cada código recebe a sua lista.
export function agruparCursosPorCodigo(linhas: LinhaCursoVinculado[]) {
  const porCodigo = new Map<string, { codigoPdi: string; cursos: any[] }>();
  for (const linha of linhas) {
    const grupo = porCodigo.get(linha.codigoPdi) ?? { codigoPdi: linha.codigoPdi, cursos: [] };
    if (!grupo.cursos.some((curso) => curso.id === Number(linha.cursoId))) {
      grupo.cursos.push({
        id: Number(linha.cursoId),
        titulo: linha.titulo,
        resumo: linha.resumo ?? null,
        ordem: Number(linha.ordem ?? 0),
        competencia: { id: Number(linha.competenciaId), nome: linha.competenciaNome, trilha: linha.trilhaNome ?? null },
        avaliacao: {
          provaDoCurso: Number(linha.totalAvaliacoesCurso ?? 0) > 0,
          avaliacoesDasAtividades: Number(linha.totalAvaliacoesAtividades ?? 0) > 0,
        },
      });
    }
    porCodigo.set(linha.codigoPdi, grupo);
  }
  return Array.from(porCodigo.values());
}
