export interface EcoLiderAluno {
  id: number;
  nome: string;
  email: string;
}

export interface EcoLiderAndamento {
  pdi: {
    total: number;
    concluidas: number;
    percentual: number | null;
    statusTexto: string;
  };
  jornadaCompliance: {
    total: number;
    concluidas: number;
    percentual: number | null;
    statusTexto: string;
  };
}

export interface EcoLiderPerfil {
  aluno: EcoLiderAluno;
  disc: null | {
    scoreD: number | string;
    scoreI: number | string;
    scoreS: number | string;
    scoreC: number | string;
    perfilPredominante: string;
    perfilSecundario: string;
    ciclo: number;
    completedAt: string;
  };
  autoavaliacoes: Array<{
    competenciaId: number;
    competenciaNome: string;
    competenciaOrdem?: number;
    nota: number | string;
    createdAt?: string;
  }>;
  grupos: Record<'1'|'2'|'3'|'4'|'5', string[]>;
  pdi: EcoLiderAndamento['pdi'];
  jornadaCompliance: EcoLiderAndamento['jornadaCompliance'];
}

export interface EcoLiderPerfilResponse {
  ok: boolean;
  match: {
    status: 'automatico_seguro' | 'manual' | 'ambiguo' | 'nao_encontrado';
    aluno: EcoLiderAluno | null;
    score: number;
    motivo: string;
  };
  alunos: EcoLiderAluno[];
  perfil: EcoLiderPerfil | null;
}

export async function buscarPerfilEcoLider(
  nome: string,
  alunoId?: number | null,
): Promise<EcoLiderPerfilResponse> {
  const params = new URLSearchParams();
  params.set('nome', nome || '');
  if (alunoId) params.set('alunoId', String(alunoId));

  const response = await fetch(`/api/programa-integracao/eco-lider/perfil?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // mantém status HTTP
    }
    throw new Error(`Não foi possível consultar o ECO Líderes (${response.status})${detail}`);
  }
  return response.json();
}


export async function buscarStatusEcoLider(
  alunoIds: number[],
): Promise<Record<string, EcoLiderAndamento>> {
  const ids = [...new Set(alunoIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (!ids.length) return {};
  const params = new URLSearchParams({ alunoIds: ids.join(',') });
  const response = await fetch(`/api/programa-integracao/eco-lider/status?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // mantém o status HTTP
    }
    throw new Error(`Não foi possível consultar o andamento do ECO Líderes (${response.status})${detail}`);
  }
  const body = await response.json();
  return body?.status || {};
}
