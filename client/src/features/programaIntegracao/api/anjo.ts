export type AnjoStatusResponse = {
  ok: boolean;
  hasActiveAssignments: boolean;
  activeAssignments: number;
  pureAngel: boolean;
  angelOnlyWithoutActiveAssignment: boolean;
};

export type AnjoFormulario = {
  processoId: number;
  legacyId: string;
  colaborador: string;
  cargo: string;
  unidade: string;
  ciclo: number;
  itemId: string;
  nome: string;
  status: "aguardando_liberacao" | "pendente" | "respondido";
  alinhamentoRealizado: boolean;
  bloqueioMotivo: string | null;
  respondidoEm: string | null;
  rotaPublica: string;
};

export type AnjoFormulariosResponse = {
  ok: boolean;
  indicadores: { aguardando: number; pendentes: number; respondidos: number };
  formularios: AnjoFormulario[];
};

async function lerJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as any)?.error || "Não foi possível concluir a operação.");
  return data as T;
}

export async function carregarStatusAnjo(): Promise<AnjoStatusResponse> {
  return lerJson(await fetch("/api/programa-integracao/anjo/status", {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  }));
}

export async function carregarFormulariosAnjo(): Promise<AnjoFormulariosResponse> {
  return lerJson(await fetch("/api/programa-integracao/anjo/formularios", {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  }));
}
