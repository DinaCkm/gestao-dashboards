# Análise getConsultors() - quais mudar para getActiveConsultors()

## NÃO mudar (precisam de todos, incluindo inativos):
- L942: Upload planilha - precisa mapear consultorId de dados importados (pode referenciar inativos)
- L3099: getSubmissionDetail - busca validador por ID (pode ser inativo)
- L3464: dashboardGeral - JÁ filtra internamente por role=mentor e isActive=1
- L3516: submissions admin - lista com consultorMap para exibir nomes (histórico)
- L3561: submissionDetail admin - busca consultor e validador por ID (histórico)
- L6428: enviarAlertas - precisa mapear consultorId para CC no email (pode ser inativo)

## MUDAR para getActiveConsultors():
- L1892: DashboardMentor - busca consultor logado para identificação
- L2966: sessionsByAluno - busca consultor logado
- L3059: validateTask - busca consultor logado
- L3132: addTaskComment - busca consultor logado
- L3154: taskSubmissions - busca consultor logado
- L5136: createMeta - busca consultor logado
- L5176: upsertMetaAcompanhamento - busca consultor logado

Nota: Os 7 que buscam consultor logado podem usar getActiveConsultors() 
porque um consultor inativo não deveria estar logado e fazendo ações.
Porém, se o consultor está logado mas foi inativado, ele não se encontraria.
Melhor abordagem: manter getConsultors() para buscas de consultor logado (autenticação),
e usar getActiveConsultors() apenas para dropdowns de SELEÇÃO.

## Onde estão os DROPDOWNS de seleção?
Preciso verificar no frontend quais endpoints alimentam dropdowns.
