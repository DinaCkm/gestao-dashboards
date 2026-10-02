export type HistoricoCobrancaResumoInput = {
  id?: string;
  processoId?: string;
  processoDbId?: number | null;
  formKey?: string;
  ciclo?: number;
  papel?: string;
  cobradoEm?: string;
};

export type RespostaCobrancaResumoInput = {
  form?: string;
  ciclo?: number;
  papel?: string;
  submittedAt?: string;
};

export type PendenciaCobrancaResumoInput = {
  formKey?: string;
  ciclo?: number;
  papel?: string;
};

export type ColaboradorCobrancaResumoInput = {
  id?: string;
  processoDbId?: number | null;
  respostas?: RespostaCobrancaResumoInput[];
  formulariosPendentes?: PendenciaCobrancaResumoInput[];
};

export type ResumoCobrancasFormularios = {
  formulariosCobrados: number;
  respondidosPosCobranca: number;
  pendentesPosCobranca: number;
  semConfirmacao: number;
};

function texto(value: unknown) {
  return String(value ?? '').trim();
}

function papelNormalizado(value: unknown) {
  return texto(value).toLowerCase();
}

function numeroCiclo(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function timestamp(value: unknown) {
  const raw = texto(value);
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function chaveProcessoHistorico(item: HistoricoCobrancaResumoInput) {
  const dbId = Number(item.processoDbId || 0);
  if (Number.isInteger(dbId) && dbId > 0) return `db:${dbId}`;

  const legacyId = texto(item.processoId);
  if (legacyId) return `legacy:${legacyId}`;

  const fallback = texto(item.id);
  return fallback ? `registro:${fallback}` : '';
}

function chaveProcessoColaborador(item: ColaboradorCobrancaResumoInput) {
  const chaves: string[] = [];
  const dbId = Number(item.processoDbId || 0);
  if (Number.isInteger(dbId) && dbId > 0) chaves.push(`db:${dbId}`);

  const legacyId = texto(item.id);
  if (legacyId) chaves.push(`legacy:${legacyId}`);
  return chaves;
}

function formCompativel(
  formKey: string,
  ciclo: number,
  papel: string,
  item: { form?: string; formKey?: string; ciclo?: number; papel?: string },
) {
  const formItem = texto(item.form ?? item.formKey).toLowerCase();
  if (!formItem || formItem !== formKey) return false;
  if (numeroCiclo(item.ciclo) !== ciclo) return false;

  // Pesquisa é historicamente salva sem papel em parte da base.
  // Bem Acolhido também é único por ciclo/processo.
  if (formKey === 'pesquisa' || formKey === 'bem') return true;

  return papelNormalizado(item.papel) === papel;
}

export function calcularResumoCobrancasFormularios(
  historico: HistoricoCobrancaResumoInput[] = [],
  colaboradores: ColaboradorCobrancaResumoInput[] = [],
): ResumoCobrancasFormularios {
  const colaboradoresPorProcesso = new Map<string, ColaboradorCobrancaResumoInput>();
  colaboradores.forEach((colaborador) => {
    chaveProcessoColaborador(colaborador).forEach((chave) => {
      if (!colaboradoresPorProcesso.has(chave)) {
        colaboradoresPorProcesso.set(chave, colaborador);
      }
    });
  });

  const formularios = new Map<string, {
    processoKey: string;
    formKey: string;
    ciclo: number;
    papel: string;
    ultimaCobrancaTs: number;
  }>();

  historico.forEach((registro) => {
    const processoKey = chaveProcessoHistorico(registro);
    const formKey = texto(registro.formKey).toLowerCase();
    const ciclo = numeroCiclo(registro.ciclo);
    const papel = papelNormalizado(registro.papel);

    if (!processoKey || !formKey) return;

    const chave = [processoKey, formKey, ciclo, papel].join('|');
    const atual = formularios.get(chave) || {
      processoKey,
      formKey,
      ciclo,
      papel,
      ultimaCobrancaTs: 0,
    };
    atual.ultimaCobrancaTs = Math.max(atual.ultimaCobrancaTs, timestamp(registro.cobradoEm));
    formularios.set(chave, atual);
  });

  let respondidosPosCobranca = 0;
  let pendentesPosCobranca = 0;
  let semConfirmacao = 0;

  formularios.forEach((formulario) => {
    const colaborador = colaboradoresPorProcesso.get(formulario.processoKey);
    if (!colaborador) {
      semConfirmacao += 1;
      return;
    }

    const respostas = Array.isArray(colaborador.respostas) ? colaborador.respostas : [];
    const respostasCompativeis = respostas
      .filter((resposta) =>
        formCompativel(
          formulario.formKey,
          formulario.ciclo,
          formulario.papel,
          resposta,
        ),
      )
      .map((resposta) => timestamp(resposta.submittedAt))
      .filter((ts) => ts > 0);

    const respostaMaisRecenteTs = respostasCompativeis.length
      ? Math.max(...respostasCompativeis)
      : 0;

    if (
      formulario.ultimaCobrancaTs > 0 &&
      respostaMaisRecenteTs > formulario.ultimaCobrancaTs
    ) {
      respondidosPosCobranca += 1;
      return;
    }

    const pendencias = Array.isArray(colaborador.formulariosPendentes)
      ? colaborador.formulariosPendentes
      : [];
    const aindaPendente = pendencias.some((pendencia) =>
      formCompativel(
        formulario.formKey,
        formulario.ciclo,
        formulario.papel,
        pendencia,
      ),
    );

    if (aindaPendente) {
      pendentesPosCobranca += 1;
      return;
    }

    // Não inferimos resposta quando não há timestamp posterior à cobrança.
    // Isso evita classificar como respondido um item que tenha saído da lista
    // por outro motivo operacional.
    semConfirmacao += 1;
  });

  return {
    formulariosCobrados: formularios.size,
    respondidosPosCobranca,
    pendentesPosCobranca,
    semConfirmacao,
  };
}
