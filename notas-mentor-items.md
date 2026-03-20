# Itens do Mentor - Análise

## 2.1 - Incluir nível e meta ao cadastrar trilha do aluno
- Schema: `assessmentCompetencias` JÁ TEM campos `nivelAtual`, `metaFinal`, `metaCiclo1`, `metaCiclo2`, `justificativa`
- NovoAssessment.tsx: NÃO tem esses campos no formulário (Step 2 - tabela de competências)
- Backend: assessment.criar NÃO envia esses campos
- AÇÃO: Adicionar colunas na tabela do Step 2 para nivelAtual, metaFinal, e salvar no submit

## 2.2 - Remover campo qtd mentorias do formulário do PDI
- PlanoIndividual.tsx: NÃO tem campo de "quantidade de mentorias" (grep retornou vazio)
- PlanoIndividual.tsx TEM campos de contrato (contratoInicio, contratoFim, contratoSessoes)
- AÇÃO: Verificar se o campo já foi removido. Se sim, marcar como RESOLVIDO.

## 2.3 - Exibir tempo de duração do contrato no assessment
- NovoAssessment.tsx: NÃO exibe informações do contrato
- Schema: contratosAluno tem periodoInicio, periodoTermino, totalSessoesContratadas
- AÇÃO: Adicionar card informativo no topo do NovoAssessment mostrando dados do contrato
