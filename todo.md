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
- [x] Corrigir erro NotFoundError na página Visão Geral ao clicar nos cards de empresas (erro de Portal/removeChild)
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


### Correção de Bugs Críticos e Alinhamento com Guia CKM (12/02/2026)
- [x] BUG 1: Corrigir percentuais absurdos no Dashboard Aluno (multiplicação dupla x100)
- [x] BUG 2: Corrigir Engajamento >100% na Visão Geral (limitar a 100%)
- [x] BUG 3: Corrigir fórmula do Engajamento para (Nota/5)*100 conforme confirmado pelo usuário
- [x] BUG 4: Corrigir fórmula da Performance para média de notas (nota/10)*100
- [x] BUG 5: Corrigir "Meu Dashboard" reescrito com dados reais do aluno logado
- [x] Testes atualizados para refletir novas fórmulas (41 passando)

### Dados BANRISUL (12/02/2026)
- [x] Inserir sessões de mentoria neutras para 26 alunos do BANRISUL (130 sessões inseridas)
- [x] Engajamento nota 3 (neutro), presença 100%, atividades 100% entregues
- [x] Verificar que Visão Geral mostra 125 alunos em 4 empresas
- [x] BUG: Competências 0% corrigido - plano_individual agora alimenta todos os dashboards
- [x] BUG: SEBRAE PARA corrigido - empresa agora vem da tabela programs (não do nomeTurma da planilha)

## Bug Reportado (12/02/2026) - NotFoundError nas Visões por Empresa
- [x] Corrigir erro NotFoundError: removeChild ao navegar para visões por empresa
- [x] Melhorar ErrorBoundary para resetar automaticamente na mudança de rota
- [x] Adicionar isAnimationActive={false} nos gráficos Recharts para evitar conflitos de DOM
- [x] Usar key prop nos containers de gráficos para forçar remontagem limpa

## Sistema de Login Universal Email+CPF e Perfis de Acesso (12/02/2026)

### Backend
- [x] Adicionar campo CPF na tabela de acesso (users ou nova tabela unificada)
- [x] Criar endpoint de login por Email+CPF (sem senha)
- [x] Associar usuário a programId (empresa) para gestores e alunos
- [x] Criar endpoints de cadastro de usuários pelo admin (nome, email, CPF, perfil, empresa)
- [x] Validação de CPF único no cadastro
- [x] Detecção automática de perfil no login (admin/gestor/aluno)

### Frontend - Login
- [x] Tela de login unificada: Email + CPF
- [x] Redirecionamento automático por perfil após login
- [x] Mensagem de erro clara para credenciais inválidas

### Frontend - Cadastro pelo Admin
- [x] Página de cadastro de usuários (Gestores e Alunos) na área admin
- [x] Formulário: nome, email, CPF, perfil (admin/gestor/aluno), empresa vinculada
- [x] Lista de usuários cadastrados com status ativo/inativo
- [x] Edição e desativação de usuários

### Frontend - Dashboard do Gestor
- [x] Dashboard filtrado por empresa do gestor (KPIs, gráficos, alunos)
- [x] Filtro por turma no dashboard do Gestor
- [x] Filtro por aluno no dashboard do Gestor
- [x] Navegação simplificada (sem acesso a admin, upload, cadastros)
- [ ] Visão de mentores da empresa

### Frontend - Dashboard do Aluno
- [ ] Dashboard individual do aluno (nota, classificação, plano individual)
- [ ] Navegação mínima (apenas dados próprios)

### Navegação e Perfis
- [x] Sidebar filtrado por perfil (admin vê tudo, gestor vê empresa, aluno vê próprio)
- [x] Redirecionamento automático para dashboard correto após login
- [ ] Testar fluxo completo dos 3 perfis

## Dashboard Completo do Aluno Logado via Email+CPF (12/02/2026)
- [ ] Endpoint backend completo: assessment, trilha, eventos, mentorias, performance
- [ ] Seção 1: Assessment original (notas por competência que originaram o plano)
- [ ] Seção 2: Trilha de Desenvolvimento (competências obrigatórias e progresso)
- [ ] Seção 3: Performance e Crescimento (nota final, classificação, indicadores)
- [ ] Seção 4: Participação em Webinars/Eventos (presença e histórico)
- [ ] Seção 5: Mentorias (sessões, presença, atividades, engajamento)
- [ ] Seção 6: Nota Final e Classificação (posição no ranking da empresa)
- [ ] Ajustar rota e redirecionamento automático para aluno logado
- [ ] Testar fluxo completo do aluno logado

## Clarificação dos Indicadores (12/02/2026) - Informações do Usuário

### Indicador 1 — Participação nas Mentorias
- [x] Fórmula: (Mentorias com presença / Total de mentorias) × 100
- [x] Já implementado corretamente

### Indicador 2 — Atividades Práticas
- [x] Fórmula: (Atividades entregues / Total de atividades previstas) × 100
- [x] Já implementado corretamente

### Indicador 3 — Evolução / Engajamento
- [x] É um CONJUNTO de 3 informações combinadas:
  - Presença nas mentorias (Indicador 1)
  - Entrega de atividades (Indicador 2)
  - Nota da Mentora (0 a 5, convertida para % pela tabela de faixas: 0=0%, 1=20%, 2=40%, 3=60%, 4=80%, 5=100%)
- [x] Ajustar cálculo para combinar as 3 informações (média dos 3 componentes)

### Indicador 4 — Performance das Competências (Planilha de Performance)
- [x] Mede o número de competências concluídas (aulas concluídas / total de aulas por competência)
- [x] Regra crítica: só considerar competências dentro do PERÍODO DE LIBERAÇÃO
- [x] Competências fora do período de liberação são IGNORADAS no cálculo
- [x] Competências dentro do período mas com nota 0 CONTAM no cálculo (puxa média para baixo)
- [x] CRIAR TABELA DE EXECUÇÃO DA TRILHA no banco de dados:
  - Vinculada ao plano individual do aluno
  - Define data_inicio e data_fim de liberação de cada competência
  - Preenchida pela mentora durante o Assessment
  - Usada para filtrar quais competências entram no cálculo do Indicador 4
- [x] Criar interface para mentora definir períodos de liberação das competências
- [x] Ajustar cálculo do Indicador 4 para respeitar períodos de liberação

### Indicador 5 — Performance de Aprendizado (Notas das Provas)
- [x] Média das notas das provas por competência (ciclos finalizados)

### Indicador 6 — Participação em Eventos
- [x] Fórmula: (Eventos com presença / Total de eventos) × 100


### Visualização Complementar — Caminho de Realização das Competências
- [ ] Criar visualização do progresso na trilha (quantas competências concluídas / quantas faltam)
- [ ] Exibir como caminho/jornada visual em TODOS os dashboards (Admin, Gestor, Aluno)
- [ ] Sistema de cores por status de prazo:
  - Verde: dentro do prazo de execução
  - Vermelho: atrasado (passou do prazo sem concluir)
  - Azul: adiantado / excelência (concluiu antes do prazo)
- [ ] Depende da Tabela de Execução da Trilha (períodos de liberação)

### Regra da 1ª Mentoria (Assessment)
- [x] A 1ª sessão de mentoria (Assessment) NUNCA tem entrega de trabalho prático
- [x] Excluir a 1ª mentoria do cálculo do Indicador 2 (Atividades Práticas)
- [x] A 1ª mentoria não entra no total de atividades previstas


## Sistema de Ciclos de Competências (12/02/2026)

### Regras de Ciclos
- [ ] Mentora define ciclos para cada aluno durante o Assessment
- [ ] Cada ciclo = grupo de competências + data_inicio + data_fim
- [ ] Aluno pode ter múltiplos ciclos rodando em paralelo
- [ ] Ciclo com data_fim < hoje = FINALIZADO → entra na Performance Geral (Ind. 4 e 5)
- [ ] Ciclo com data_inicio <= hoje <= data_fim = EM ANDAMENTO → aparece separado, NÃO entra na Performance Geral
- [ ] Ciclo com data_inicio > hoje = FUTURO → invisível no cálculo e visualização
- [ ] Se aluno não terminou ciclo no prazo, nota baixa fica registrada até ele completar
- [ ] Aluno pode voltar e completar ciclo atrasado, melhorando a Performance Geral

### Implementação
- [x] Criar tabela `execucao_trilha` no schema (ciclos com datas)
- [x] Criar endpoints CRUD para gerenciar ciclos
- [x] Criar interface para mentora definir ciclos (competências + datas)
- [x] Refatorar indicatorsCalculator para 7 indicadores (6 individuais + Performance Geral)
- [x] Indicador 3: combinar presença + atividades + nota mentora (média dos 3)
- [x] Indicador 4: % aulas concluídas (só ciclos finalizados)
- [x] Indicador 5: notas das provas (só ciclos finalizados)
- [x] Indicador 7: Performance Geral = média dos 6 indicadores
- [x] Excluir 1ª mentoria (Assessment) do cálculo do Indicador 2
- [x] Atualizar todos os dashboards (Admin, Gestor, Aluno) com 7 indicadores
- [x] Adicionar visualização de ciclos em andamento separada
- [ ] Adicionar visualização do caminho de competências (verde/vermelho/azul) — pendente


### Transparência nos Dashboards
- [x] Cada card de indicador deve ter explicação abaixo mostrando:
  - Fórmula usada no cálculo
  - Números reais que compõem o resultado (ex: "8 presenças de 10 sessões")
  - Regras aplicadas (ex: "1ª mentoria excluída por ser Assessment")
  - Para Indicadores 4 e 5: quais ciclos entraram e quais estão em andamento


### Correção Menu Admin (12/02/2026)
- [x] Remover "Meu Dashboard" e "Dashboard Aluno" do menu do administrador (são páginas do perfil do aluno, não do admin)


## UI para Mentora Definir Ciclos de Competências (12/02/2026)
- [x] Criar seção de gestão de ciclos na página Plano Individual
- [x] Formulário para criar novo ciclo (nome, data início, data fim)
- [x] Seleção de competências do plano individual para vincular ao ciclo
- [x] Lista de ciclos existentes com status (futuro/em andamento/finalizado)
- [x] Edição e exclusão de ciclos
- [x] Indicação visual de cores (verde/vermelho/azul) por status do ciclo


## Ajustes Visuais (12/02/2026)
- [x] Remover gráfico "Distribuição por Classificação" (pizza) da Visão Geral
- [x] Remover gráfico radar da Visão Geral

## Importar Alunos para Gestão de Acesso (12/02/2026)
- [ ] Importar 125 alunos da planilha de Performance para a tabela de acesso (access_users)
- [ ] Alunos devem aparecer na lista de Gestão de Acesso com nome, email, empresa e perfil "Aluno"
- [ ] Alunos importados devem poder fazer login com Email + CPF

## Correção Formulário Cadastro (12/02/2026)
- [ ] Adicionar campo "Empresa" no formulário de novo usuário quando perfil for "Gestor de Empresa"

## Correções (13/02/2026)
- [x] Corrigir explicação do Indicador 3 nos cards: nota mentora 0-5 convertida para base 100 (todos indicadores são base 100)
- [x] Ajustar login admin para aceitar email em vez de openId

## Correção Explicação Indicador 4 (13/02/2026)
- [x] Atualizar explicação do Indicador 4 em todos os dashboards: aulas incluem filmes, livros, podcasts e vídeos

## Correção Explicação Indicador 5 (13/02/2026)
- [x] Atualizar explicação do Indicador 5 em todos os dashboards: notas de avaliação de cada aula (filmes, vídeos, livros, podcasts, EAD), ciclos em andamento visualizados em separado

## Bug Botão "i" Indicadores 5, 6 e 7 (13/02/2026)
- [x] Corrigir botão "i" do Indicador 7 na Visão Geral: convertido para IndicadorCard com toggle

## Informações Detalhadas nos Dashboards (13/02/2026)
- [x] Mostrar competências que cada aluno está fazendo
- [x] Mostrar webinários/eventos que participaram com datas
- [x] Mostrar notas obtidas em cada competência
- [x] Mostrar nome da turma do aluno
- [x] Mostrar trilha do aluno (Básica, Essencial, Master, Jornada do Futuro)
- [x] Mostrar ciclo atual do aluno
- [x] Implementar no Dashboard do Aluno (DashboardAluno.tsx)
- [x] Implementar no Dashboard Meu Perfil (DashboardMeuPerfil.tsx)
- [x] Implementar no Dashboard por Empresa (DashboardEmpresa.tsx)
- [x] Implementar no Dashboard Visão Geral (DashboardVisaoGeral.tsx)
