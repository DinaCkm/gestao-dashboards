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

## Sistema de Upload de Planilhas (27/01/2026)
- [x] Criar templates/modelos de planilha para download (Performance, Mentorias, Eventos)
- [x] Implementar validação de formato com popup de erro detalhado
- [x] Implementar substituição de planilha mantendo histórico com data
- [x] Limitar histórico a 3 versões anteriores (excluir mais antigas automaticamente)
- [x] Botão "Ver Histórico de Uploads" com diálogo mostrando arquivos anteriores
- [x] Tooltips de ajuda explicando o formato esperado de cada modelo

## Bug Reportado (27/01/2026) - Baixar Modelo
- [x] Corrigir erro NotFoundError: Falha ao executar 'insertBefore' ao clicar em Baixar Modelo (corrigido: removida manipulação direta do DOM)
- [x] URGENTE: Erro NotFoundError persiste na versão publicada ao clicar em Baixar Modelo - corrigido removendo Tooltips e usando title nativo

## Melhorias Upload de Planilhas (27/01/2026)
- [x] Mostrar lista visível com os 7 nomes exatos de arquivos aceitos
- [x] Validar nome do arquivo antes de aceitar upload (mostrar erro se nome incorreto)
- [ ] Guardar as 3 últimas versões de cada tipo de planilha com data do upload
- [ ] Remover seção redundante de "Arquivos Esperados por Empresa" e simplificar interface
- [x] Implementar histórico de uploads visível com nome da planilha, data e horário do upload (tabela com colunas: Nome, Tipo, Data, Horário, Status)

## Validação de Upload (27/01/2026)
- [x] Implementar validação para rejeitar automaticamente uploads de planilhas com nomes incorretos
- [x] Mostrar popup de erro claro quando nome não corresponder aos 7 aceitos
- [x] Lista visível dos 7 nomes de arquivos aceitos com numeração (01-07)
- [x] Dica para copiar o nome exato ao renomear arquivos

## Bug Crítico - Enviar Arquivos (27/01/2026)
- [x] Corrigir erro NotFoundError ao clicar em Enviar Arquivos na página de Upload (erro de Portal/DOM) - CORRIGIDO: removido Select que usava Portal

## Seção de Histórico de Uploads (27/01/2026)
- [x] Criar seção de histórico visível na página de Upload (não apenas em diálogo)
- [x] Mostrar últimos arquivos enviados com nome, tipo, data, horário e status
- [x] Permitir visualização rápida sem precisar abrir diálogo

- [x] Melhorar exibição da data de upload no histórico - destacar data de cada planilha com ícone de calendário

## Limpeza de Menu (27/01/2026)
- [x] Remover página Departamentos do menu lateral (não há dados no banco)
- [x] Criar página de Turmas mostrando todas as turmas e suas respectivas empresas

## Correção Extração de Empresa (27/01/2026)
- [x] Extrair nome da empresa da coluna "Turma (agrupador 1)" da planilha Performance

## Login Tradicional para Administradores (27/01/2026)
- [x] Adicionar campo de senha na tabela de usuários
- [x] Criar endpoint de login com usuário e senha
- [x] Configurar adm1 com senha 0001
- [x] Configurar adm2 com senha 0002
- [ ] Rastrear qual admin fez cada upload (pendente)

## Bug Login Administrativo (28/01/2026)
- [x] Corrigir botão Login Administrativo que redireciona para Manus OAuth em vez de mostrar tela de usuário/senha
- [x] Desabilitar redirecionamento automático para OAuth no main.tsx


## FASE 1 - Especificação Funcional (30/01/2026)

### BLOCO 1 - Catálogo de Trilhas e Competências
- [x] Criar tabela `trilhas` no schema.ts
- [x] Criar tabela `competencias` no schema.ts
- [x] Executar migração do banco de dados
- [x] Criar endpoints tRPC para CRUD de trilhas
- [x] Criar endpoints tRPC para CRUD de competências
- [x] Criar script seed com as 36 competências oficiais (4 trilhas + 36 competências)
- [x] Criar tela de administração de Trilhas e Competências
- [x] Adicionar menu "Trilhas e Competências" no Admin

### BLOCO 8 - Nota da Mentora (Evolução)
- [x] Adicionar campo `nota_evolucao` (0-10) na tabela mentoring_sessions
- [ ] Atualizar formulário de registro de sessão de mentoria
- [ ] Atualizar cálculo do indicador "Evolução/Engajamento"
- [ ] Atualizar dashboards para mostrar média da nota de evolução

### BLOCO 2 - Plano Individual do Aluno
- [x] Criar tabela `plano_individual` para vincular competências obrigatórias a cada aluno
- [x] Criar endpoints tRPC para gerenciar plano individual
- [x] Criar tela de administração para definir competências obrigatórias por aluno
- [x] Permitir seleção de competências por trilha
- [ ] Exibir plano individual no perfil do aluno

### BLOCO 3 - Performance Filtrada
- [x] Atualizar cálculo de performance para considerar apenas competências obrigatórias
- [x] Criar indicador de progresso do plano individual
- [x] Atualizar dashboards com nova lógica de cálculo
- [x] Criar endpoint performanceFiltrada no tRPC
- [x] Exibir indicadores filtrados na página Plano Individual


### Parsers de Dados Pendentes (31/01/2026)
- [x] Implementar parser para SEBRAEACRE-Eventos.xlsx
- [x] Implementar parser para BS2SEBRAETO-Eventos.xlsx
- [x] Implementar parser para EMBRAPII-Eventos.xlsx
- [x] Implementar parser para relatorio-de-performance.xlsx
- [x] Importar dados de eventos para o banco (4.027 participações)
- [x] Importar dados de performance para o banco (506 registros com notas)
- [x] Verificar indicadores com dados completos


### Dashboard por Aluno (31/01/2026)
- [x] Criar página DashboardAluno.tsx com performance filtrada
- [x] Exibir histórico de mentorias do aluno
- [x] Exibir participação em eventos do aluno
- [x] Mostrar plano individual com competências obrigatórias
- [ ] Adicionar gráficos de evolução (pendente - requer dados históricos)
- [x] Adicionar rota e menu para acessar dashboard do aluno

### BLOCO 8 - Nota de Evolução do Mentor (31/01/2026)
- [x] Criar interface para mentor registrar nota de evolução (0-10)
- [x] Criar página RegistroMentoria.tsx
- [x] Criar endpoint updateSession no tRPC
- [x] Adicionar menu "Registro de Mentoria" no sidebar
- [ ] Atualizar cálculo do indicador de Engajamento (usar nota de evolução)
- [ ] Exibir média da nota de evolução nos dashboards

### Atribuição de Competências em Lote (31/01/2026)
- [x] Criar funcionalidade para atribuir competências a uma turma inteira
- [x] Criar endpoint addToTurma no tRPC
- [x] Adicionar botão "Atribuir em Lote" na página Plano Individual
- [x] Criar dialog para selecionar turma e competências
- [ ] Permitir seleção múltipla de competências
- [ ] Aplicar competências a todos os alunos da turma selecionada
