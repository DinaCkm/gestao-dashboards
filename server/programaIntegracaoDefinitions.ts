export const PROGRAMA_INTEGRACAO_SLUGS = {
  "controle-integracao": "controle",
  "bem-acolhido": "bem",
  "pesquisa-integracao": "pesquisa",
  "avaliacao-programa": "aval",
  "acompanhamento-pdi": "pdi",
} as const;

export type ProgramaIntegracaoFormKey = (typeof PROGRAMA_INTEGRACAO_SLUGS)[keyof typeof PROGRAMA_INTEGRACAO_SLUGS];

export const PROGRAMA_INTEGRACAO_LINKS: Record<ProgramaIntegracaoFormKey, string> = {
  controle: "/formularios/controle-integracao",
  bem: "/formularios/bem-acolhido",
  pesquisa: "/formularios/pesquisa-integracao",
  aval: "/formularios/avaliacao-programa",
  pdi: "/formularios/acompanhamento-pdi",
};

export const PROGRAMA_INTEGRACAO_ITENS = {
  controle: { 0: "pre-02" },
  bem: { 0: "pre-04b" },
  pesquisa: { 1: "pos1-08", 2: "pos2-08", 3: "pos3-09", 4: "pos4-07" },
  aval: {
    Gestor: { 1: "pos1-09", 2: "pos2-09", 3: "pos3-10", 4: "pos4-08" },
    Anjo: { 1: "pos1-10", 2: "pos2-10", 3: "pos3-11", 4: "pos4-09" },
  },
  pdi: { 2: "pos2-02", 4: "pos4-02" },
} as const;

export const PROGRAMA_INTEGRACAO_QUESTION_INDEX: Record<ProgramaIntegracaoFormKey, Record<string, number>> = {
  controle: {
    controle_nome: 5, controle_cpf: 6, controle_nascimento: 7, controle_email_pessoal: 8,
    controle_telefone: 9, controle_data_inicio: 10, controle_denominacao: 11, controle_funcao: 12,
    controle_unidade: 13, controle_gestor: 14, controle_descricao_funcao: 15,
  },
  bem: {
    bem_gestor: 5, bem_unidade: 6, bem_colaborador: 7, bem_data_inicio: 8, bem_funcao: 9,
    bem_anjo: 10, bem_caracteristicas: 11, bem_conhecimentos_tecnicos: 12,
    bem_documentos_treinamentos: 13, bem_treinamentos_uc: 14, bem_primeiros_15_dias: 15, bem_primeiros_60_dias: 16,
  },
  pesquisa: {
    pesquisa_unidade: 6, pesquisa_programa: 7, pesquisa_periodo: 8,
    pesquisa_cultura_valores: 9, pesquisa_pertencimento: 10, pesquisa_dia_a_dia: 11,
    pesquisa_orgulho: 12, pesquisa_importancia_atividades: 13, pesquisa_anjo_ajuda: 14,
    pesquisa_conforto_colegas: 15, pesquisa_confianca_colegas: 16, pesquisa_ajuda_colegas: 17,
    pesquisa_lacos_amizade: 18, pesquisa_gestor_clareza: 19, pesquisa_comunicacao_transparente: 20,
    pesquisa_gestor_incentivo: 21, pesquisa_satisfacao_funcoes: 22, pesquisa_sobrecarga: 23,
    pesquisa_conhecimento_tecnico: 24, pesquisa_busca_apoio: 25, pesquisa_propoe_melhorias: 26,
    pesquisa_cooperacao_equipe: 27, pesquisa_progresso_pdi: 28,
  },
  aval: {
    aval_nome_avaliador: 3, aval_avaliado: 4, aval_feedback: 5,
    aval_compromissos: 6, aval_parceria: 7, aval_compartilha_informacoes: 8, aval_persistencia: 9,
    aval_interesse_entusiasmo: 10, aval_expressao: 11, aval_padroes_eticos: 12, aval_transparencia: 13,
    aval_respeito: 14, aval_sigilo: 15, aval_consistencia_informacoes: 16, aval_analise_decisao: 17,
    aval_conhecimento_tecnico: 18, aval_conhecimento_pratica: 19, aval_atividades_previstas: 20,
    aval_apoio_tecnico: 21, aval_interpretacao: 22, aval_melhorias: 23, aval_participa_discussoes: 24,
    aval_cooperacao: 25, aval_clareza_ideias: 26, aval_aceita_pontos_vista: 27, aval_articulacao: 28,
    aval_postura_equipe: 29, aval_foco_resultados: 30, aval_cumpre_prazos: 31, aval_cumpre_metas: 32,
    aval_prioridades: 33, aval_parcerias: 34, aval_qualidade: 35, aval_postura_critica: 36,
    aval_tempo_resposta: 37, aval_desenvolvimento_conceito: 38, aval_produtividade_conceito: 39,
    aval_conceito_geral: 40, aval_potencialidades: 41, aval_menos_favoraveis: 42,
    aval_orientacoes_desenvolvimento: 43, aval_reacao_feedback: 44,
  },
  pdi: {
    pdi_avaliador: 5, pdi_colaborador: 6, pdi_programa: 7, pdi_unidade: 8, pdi_data_avaliacao: 9,
    pdi_periodo: 10, pdi_concluiu_no_prazo: 11, pdi_relatou_dificuldade: 12,
    pdi_qual_acao_motivo: 13, pdi_percentual_execucao: 14, pdi_houve_readequacao: 15,
    pdi_qual_alteracao: 16, pdi_percentual_jornada_compliance: 17,
    pdi_realinhamento_postura: 18, pdi_qual_realinhamento: 19,
  },
};

export const PROGRAMA_INTEGRACAO_ESCALAS: Partial<Record<ProgramaIntegracaoFormKey, { de: number; ate: number; inverso?: number[] }>> = {
  pesquisa: { de: 9, ate: 28, inverso: [23] },
  aval: { de: 6, ate: 37 },
};

export function formKeyDoSlug(slug: string): ProgramaIntegracaoFormKey | null {
  return (PROGRAMA_INTEGRACAO_SLUGS as Record<string, ProgramaIntegracaoFormKey>)[slug] || null;
}

export function itemIdDoFormulario(formKey: ProgramaIntegracaoFormKey, ciclo: number, papel?: string): string | null {
  if (formKey === "controle" || formKey === "bem") {
    return (PROGRAMA_INTEGRACAO_ITENS[formKey] as Record<number, string>)[0] || null;
  }
  if (formKey === "aval") {
    if (papel !== "Gestor" && papel !== "Anjo") return null;
    return (PROGRAMA_INTEGRACAO_ITENS.aval[papel] as Record<number, string>)[ciclo] || null;
  }
  return (PROGRAMA_INTEGRACAO_ITENS[formKey] as Record<number, string>)[ciclo] || null;
}
