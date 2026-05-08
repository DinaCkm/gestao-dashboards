# Definições: Contratos, Níveis e Reset de Ciclo

## Contrato (`contratos_aluno`)
- Representa o **tempo total que o aluno fica na plataforma**
- É a base para controle de acesso, financeiro e pagamentos
- Quando o contrato vence, o aluno perde acesso à plataforma
- **Duração:** campo livre (admin informa em meses) — ex: 12 meses, 24 meses
- **Regra padrão:** cada nível dura 180 dias (6 meses)
- O número de níveis é calculado automaticamente: `duração total / 180 dias`
  - 12 meses → 2 níveis (I e II)
  - 24 meses → 4 níveis (I, II, III e IV)

## Nível (`contrato_niveis`)
- Representa uma **fase dentro do contrato** (Nível I, II, III, IV)
- Cada nível dura **180 dias por padrão** (campo livre para exceções)
- As datas são calculadas automaticamente a partir do início do contrato:
  - Nível I: `contratoInicio` → `contratoInicio + 180 dias`
  - Nível II: `contratoInicio + 181 dias` → `contratoInicio + 360 dias`
  - etc.
- Ao final de cada nível, o admin faz o **reset manual** para iniciar o próximo nível

## Reset de Ciclo
- É a **transição entre níveis** — feita manualmente pelo admin
- Antes de aplicar o reset, o sistema deve **avisar o admin** sobre:
  - Data de encerramento do nível atual
  - Se o aluno está dentro ou fora do prazo previsto
- O reset:
  1. Congela todos os PDIs ativos do aluno
  2. Salva snapshot de performance na página Evolução
  3. Marca o nível atual como `encerrado` em `contrato_niveis`
  4. Cria o registro do próximo nível em `contrato_niveis`
  5. Cria novo registro em `onboarding_jornada` com `ciclo = N+1`
  6. Vincula o novo ciclo ao novo nível

## PDI / Assessment (`assessment_pdi`)
- É o **Plano de Desenvolvimento Individual** criado pela mentora no Assessment
- Composto por múltiplos registros (um por trilha) dentro do mesmo nível
- Todas as trilhas de um nível devem ter datas dentro do período do nível
- Ao criar o PDI, a mentora deve ver as datas do nível vigente como referência
- **Pendência:** hoje o formulário não mostra o nível — precisa ser implementado

## Formulário de Cadastro do Aluno — Campos Novos
- `duracaoContrato` (int, em meses) — campo livre, obrigatório
- `dataInicioContrato` (date) — já existe como `contratoInicio`
- A partir desses dois campos, o sistema calcula e cria automaticamente:
  - `contratos_aluno.periodoTermino` = início + duração
  - Registros em `contrato_niveis` para cada nível (I, II, III, IV conforme duração)

## Dados dos Alunos Existentes
- **SEBRAE ACRE:** contrato de **2 anos** (4 níveis), início conforme planilha
- **SEBRAE TOCANTINS:** contrato de **1 ano** (2 níveis), início conforme planilha
- **EMBRAPII:** contrato de **1 ano** (2 níveis), início conforme planilha
- **CKM Talents (Julia — teste):** início `01/01/2026`, duração a definir

## Alunos com Duas Datas na Planilha
Vários alunos do SEBRAE TO aparecem com duas datas — a segunda é o início do Nível II,
indicando que já passaram pelo reset. Precisam ter:
- Nível I: `encerrado`
- Nível II: `em_andamento`
