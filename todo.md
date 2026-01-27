# Sistema de Gestão de Mentorias - TODO

## Autenticação e Usuários
- [x] Sistema de autenticação com três níveis de acesso (admin, gerente, usuário)
- [x] Painel de controle para gerenciar usuários e permissões
- [x] Atribuição de departamentos/equipes aos usuários

## Upload e Processamento de Planilhas
- [x] Interface de upload para planilhas Excel semanalmente
- [x] Processamento automático de planilhas Excel (.xlsx, .xls)
- [x] Extração e validação de dados das planilhas
- [x] Sistema de armazenamento de histórico com versionamento semanal
- [x] Notificação automática ao admin quando planilhas forem carregadas

## Dashboards
- [x] Dashboard administrativo com visão consolidada
- [x] Métricas agregadas e gráficos interativos (admin)
- [x] Dashboard gerencial com filtros por departamento/equipe
- [x] Comparativos de desempenho (gerencial)
- [x] Dashboard individual com métricas pessoais
- [x] Histórico de evolução individual
- [x] Gráficos responsivos (linhas, barras, pizza, radar) com Recharts

## Relatórios
- [x] Geração de relatórios exportáveis em PDF
- [x] Geração de relatórios exportáveis em Excel
- [x] Relatórios específicos para cada nível de acesso
- [x] Templates rápidos para relatórios comuns
- [x] Histórico de relatórios gerados

## Design e Interface
- [x] Estilo cinematográfico com gradiente azul-petróleo e laranja queimado
- [x] Tipografia sans-serif branca em negrito
- [x] Acentos geométricos em ciano e laranja
- [x] Layout responsivo e moderno

## Configurações
- [x] Painel de configurações de cálculo
- [x] Gerenciamento de fórmulas de cálculo

## Sistema de Performance (Baseado no Guia de Cálculo)
- [x] 5 Indicadores de Performance implementados:
  - Participação nas Mentorias (presença)
  - Atividades Práticas (tarefas entregues)
  - Engajamento (nota 0-10)
  - Performance de Competências
  - Participação em Eventos
- [x] Estágios de desenvolvimento (Excelência, Avançado, Intermediário, Básico, Inicial)
- [x] Visualização por programa (SEBRAE Acre, SEBRAE TO, EMBRAPII)

## Bugs Reportados
- [x] Erro: dashboard.latestBatch retornando undefined - Query data cannot be undefined (corrigido: retornando null em vez de undefined)
- [x] Alterar design para gradiente claro com tons suaves de azul e creme
- [x] Aplicar identidade visual B.E.M. (azul marinho e laranja)
- [x] Renomear sistema para ECOSSISTEMA DO BEM
- [x] Adicionar logo B.E.M. na sidebar e interface
- [x] Configurar 3 empresas: SEBRAE TO, SEBRAE ACRE, EMBRAPII
- [x] Implementar 3 níveis de visão: Geral, Por Empresa, Por Aluno
- [x] Atualizar dashboards com filtros por empresa
- [x] Configurar upload para aceitar os 7 arquivos: SEBRAEACRE-Mentorias, SEBRAEACRE-Eventos, EMBRAPII-Mentorias, EMBRAPII-Eventos, BS2SEBRAETO-Mentorias, BS2SEBRAETO-Eventos, relatorio-de-performance
- [ ] Usar Id Usuário como chave principal para cruzar planilhas
- [ ] Implementar hierarquia: Empresa → Turma → Aluno → Trilha/Competências
- [ ] Adicionar visão por Turma nos dashboards
- [ ] Implementar regra de aprovação (nota ≥7 = aprovado)
- [ ] Corrigir nome do sistema para ECOSSISTEMA DO BEM em todos os lugares (sidebar, título, etc.)
- [ ] Corrigir nome cortado na sidebar - mostrar ECOSSISTEMA DO BEM completo
- [ ] Corrigir logo que não aparece na tela de login
- [ ] Mudar texto para "BEM VINDO AO ECOSSISTEMA DO BEM"

## Próximos Passos - Processamento de Dados
- [x] Implementar parser para SEBRAEACRE-Mentorias.xlsx (33 alunos, 493 registros)
- [ ] Implementar parser para SEBRAEACRE-Eventos.xlsx (791 registros) - formato diferente
- [x] Implementar parser para BS2SEBRAETO-Tutorias.xlsx (50 alunos, 403 registros)
- [ ] Implementar parser para BS2SEBRAETO-Eventos.xlsx (861 registros) - formato diferente
- [x] Implementar parser para EMBRAPII-Mentorias.xlsx (16 alunos, 130 registros)
- [ ] Implementar parser para EMBRAPII-Eventos.xlsx (269 registros) - formato diferente
- [ ] Implementar parser para relatorio-de-performance.xlsx (34 colunas)
- [x] Cruzar dados usando Id Usuário como chave principal

## Cálculo dos 5 Indicadores (20% cada)
- [x] Indicador 1: Participação Mentorias (coluna "Mentoria" - Presente/Ausente)
- [x] Indicador 2: Atividades Práticas (coluna "Atividade proposta" - Entregue/Não entregue)
- [x] Indicador 3: Engajamento (coluna "Evolução/Engajamento" - nota 1-5)
- [x] Indicador 4: Performance Competências (relatorio-de-performance - notas ≥7)
- [x] Indicador 5: Participação Eventos (coluna "Status Presença" - Presente/Ausente)
- [x] Calcular nota final (média ponderada dos 5 indicadores)
- [x] Classificar em estágios (Excelência 9-10, Avançado 7-8, Intermediário 5-6, Básico 3-4, Inicial 0-2)

## Dashboards por Nível
- [x] Dashboard Visão Geral (consolidado 3 empresas)
- [x] Dashboard por Empresa (SEBRAE ACRE, SEBRAE TO, EMBRAPII)
- [ ] Dashboard por Turma (dentro de cada empresa)
- [ ] Dashboard por Aluno (performance individual com histórico)

## Interface
- [x] Logo temporariamente removido (aguardando novo logo do usuário)

## Importação de Dados
- [x] Importar dados das 7 planilhas para o banco de dados (99 alunos, 1014 sessões de mentoria)
- [x] Verificar dashboards com dados reais

## Visão do Mentor
- [x] Criar dashboard do mentor com estatísticas de mentorias
- [x] Mostrar quantidade de mentorias por empresa
- [x] Exibir datas das mentorias realizadas
- [x] Listar alunos avaliados pelo mentor
- [x] Importar 13 mentores das planilhas
- [x] Associar 1.014 sessões aos mentores corretos

## Reorganização Hierárquica do Sistema
- [x] Atualizar página inicial do Administrador com dados reais (198 alunos, 1014 sessões, 13 mentores, 3 empresas)
- [x] Reorganizar menu seguindo hierarquia: Admin → Mentor → Gerente Empresa → Aluno
- [ ] Implementar visão do Gerente de Empresa (por empresa específica)
- [ ] Ajustar visão do Aluno Individual
- [x] Corrigir contadores da Home (agora mostra dados reais)

## Sistema de Login Personalizado
- [x] Atualizar schema do banco para suportar login por Id + Email
- [x] Criar tela de login com campos Id Usuário e Email
- [ ] Implementar autenticação para Alunos (Id Usuário + Email das planilhas)
- [ ] Implementar autenticação para Mentores (Email + Id criado pelo admin)
- [ ] Implementar autenticação para Gerentes (Email + Id criado pelo admin)
- [x] Criar interface admin para cadastrar mentores com Id e Email
- [x] Criar interface admin para cadastrar gerentes com Id e Email
- [ ] Importar emails dos alunos do relatório de performance
- [ ] Testar login para cada tipo de usuário

## Páginas de Administração (Cadastros)
- [x] Criar página de cadastro de Empresas (Programas)
- [x] Alunos vêm das planilhas (não precisam de cadastro manual)
- [x] Criar página de cadastro de Gerentes com Id e Email
- [x] Criar página de cadastro de Mentores com Id e Email
- [x] Adicionar rotas de API para CRUD de cada entidade
- [x] 13 mentores importados das planilhas com botão "Ativar Acesso" entidade
- [x] 13 mentores importados das planilhas com botão "Ativar Acesso"

## Bug Reportado - SEBRAE PARA
- [x] Investigar origem do "SEBRAE PARA" no dropdown de empresas (erro no banco de dados)
- [x] Corrigir processo de identificação de empresas (UPDATE no banco)
- [x] Garantir que apenas SEBRAE ACRE, SEBRAE TO e EMBRAPII apareçam

## Refatoração da Importação de Dados
- [x] Usar planilha de Performance como BASE PRINCIPAL (fonte da verdade)
- [x] Importar primeiro: Id Usuário, Nome, Email, Turma, Competências da Performance
- [x] Cruzar dados com planilhas de Mentorias
- [ ] Cruzar dados com planilhas de Eventos
- [x] Gerar ALERTAS para inconsistências:
  - Aluno na Mentoria mas NÃO na Performance (0 casos - todos estão OK!)
  - Aluno nos Eventos mas NÃO na Performance
  - Aluno na Performance mas NÃO na Mentoria
  - Aluno na Performance mas NÃO nos Eventos
- [ ] Exibir relatório de inconsistências no sistema

## Dados Importados (Atualizado)
- [x] 4 Empresas: SEBRAE ACRE, SEBRAE TO, EMBRAPII, BANRISUL
- [x] 125 Alunos (da planilha de Performance)
- [x] 13 Turmas
- [x] 26 Consultores/Mentores
- [x] 1.014 Sessões de Mentoria

## Bugs Reportados (27/01/2026)
- [x] Corrigir "SEBRAE PARA" para "SEBRAE TO" no banco de dados (corrigido via UPDATE no banco)
- [x] Corrigir erro NotFoundError: Falha ao executar 'removeChild' na página Por Empresa (criada página PorEmpresa.tsx dedicada)
- [x] Corrigir programId null nos alunos (associados via turmaId)
- [ ] Corrigir erro NotFoundError na página Visão Geral ao clicar nos cards de empresas (erro de Portal/removeChild)
- [x] Adicionar popup/tooltip de ajuda explicando origem dos dados e cálculo das notas nos dashboards
- [x] Substituir card 'Alunos Excelência' por 'Melhor Nota' (maior nota atual) e adicionar 'Meta' (expectativa 9.0) ao lado
