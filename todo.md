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

## Bug Seletor de Mentor e Área Própria do Mentor (13/02/2026)
- [x] Corrigir dropdown de seleção de mentor na página Visão do Mentor (nada acontece ao clicar)
- [x] Criar dashboard próprio do mentor logado ("Meu Dashboard" do mentor)
- [x] Mentor logado vê automaticamente seus próprios dados (alunos, mentorias, empresas)
- [x] Garantir redirecionamento correto por perfil após login (admin/gestor/mentor/aluno)

## Bugs Reportados (13/02/2026) - Turmas e Trilhas
- [x] Corrigir turmas duplicadas na listagem (13 turmas duplicadas removidas do banco, de 26 para 13)
- [x] Verificar nome da trilha "Bosas" → No banco está correto "Básicas" (pode ter sido editado manualmente)
- [x] Verificar nome da trilha "Mestre" → No banco está correto "Master" (pode ter sido editado manualmente)
- [x] Verificar empresa "SEBRAE PARA" → No banco está correto "SEBRAE TO" (turmas duplicadas causavam confusão)

## Correção Formulário de Cadastro e Uniformização (13/02/2026)
- [x] Adicionar perfil "Mentor" na lista de perfis de acesso do formulário de cadastro
- [x] Adicionar campo "Empresa" no formulário quando perfil for Gestor de Empresa ou Mentor
- [x] Vincular mentor ao consultor correspondente no cadastro (cria registro na tabela consultors)
- [x] Corrigir turmas duplicadas no banco (13 removidas - já feito via SQL)
- [x] Uniformizar nomenclatura: Consultor → Mentor em todo o sistema (frontend visível)

## Validação de CPF Duplicado (13/02/2026)
- [ ] Validar CPF duplicado no backend (endpoint createAccessUser) antes de criar o registro
- [ ] Exibir mensagem de erro clara no frontend quando CPF já está cadastrado
- [ ] Validar CPF duplicado também na edição de usuário (updateAccessUser)

## Correção SEBRAE PARA → SEBRAE TO (13/02/2026)
- [x] Corrigir nome da empresa "SEBRAE PARA" para "SEBRAE TO" no banco de dados (tabela programs)

## Campo CPF no Formulário de Novo Mentor (13/02/2026)
- [x] Adicionar campo CPF no formulário "Cadastrar Novo Mentor" (tab Mentores)
- [x] Ao cadastrar mentor, criar também o registro de acesso (users) com Email+CPF para login
- [x] Validar CPF duplicado no cadastro de mentor

## Login Unificado Email + CPF ou ID (13/02/2026)
- [x] Alterar frontend: tela de login - label "CPF ou ID" no campo de senha
- [x] Formulário de cadastro de aluno: label "ID" (salva no campo cpf do banco)
- [x] Formulário de cadastro de mentor/gestor: label "CPF" (mantém como está)
- [x] Backend não precisa mudar (mesmo campo cpf aceita ambos)
- [x] Coluna CPF adicionada na tabela de mentores (schema + migração)
- [x] Tabela de listagem de mentores mostra coluna CPF

## Atualização de Dados de Performance (13/02/2026)
- [x] Analisar diferenças entre dados atuais e nova planilha (100 alunos, 11 turmas, 36 competências)
- [x] Limpar dados antigos de performance (exceto BANRISUL) do banco
- [x] Importar novos dados da planilha atualizada (1.464 registros)
- [x] Atualizar/criar alunos conforme nova planilha
- [x] Atualizar/criar turmas conforme nova planilha (11 turmas)
- [x] Importar notas e progresso das competências para plano_individual
- [x] Manter dados do BANRISUL intactos
- [x] Verificar dashboards com dados atualizados
- [x] Atualizar registro de "Último Upload" para data de hoje (13/02/2026) após importação da nova planilha

## Atualização de Eventos - EMBRAPII, SEBRAE Acre, SEBRAE TO (13/02/2026)
- [x] Analisar planilha EMBRAPII-Eventos.xlsx (299 registros, 16 alunos, 23 eventos)
- [x] Analisar planilha SEBRAEACRE-Eventos.xlsx (822 registros, 33 alunos, 25 eventos)
- [x] Analisar planilha BS2SEBRAETO-Eventos.xlsx (909 registros, 50 alunos, 20 eventos)
- [x] Limpar eventos antigos (exceto BANRISUL) e importar novos das 3 planilhas
- [x] 68 eventos + 2.030 participações importadas (BANRISUL preservado com 4.027 participações)
- [x] Verificar dados nos dashboards - 77 testes passando

## Atualização de Mentorias - EMBRAPII, SEBRAE Acre, SEBRAE TO (13/02/2026)
- [x] Analisar planilha SEBRAEACRE-Mentorias.xlsx (524 sessões, 33 alunos)
- [x] Analisar planilha BS2SEBRAETO-Tutorias(respostas).xlsx (406 sessões, 50 alunos)
- [x] Analisar planilha EMBRAPII-Mentorias.xlsx (146 sessões, 16 alunos)
- [x] Importar mentorias: 1.076 sessões (BANRISUL preservado com 1.144 sessões)
- [x] Verificar dados nos dashboards
- [x] Registrar lotes de upload no Histórico para os eventos importados (3 planilhas de eventos)
- [x] Registrar lotes de upload no Histórico para as mentorias importadas (3 planilhas de mentorias)
- [x] Unificar páginas "Upload de Planilhas" e "Histórico de Uploads" em uma única página (agora "Gestão de Planilhas" com tabs Upload/Histórico)

## Importação de Alunos para Gestão de Acesso (13/02/2026)
- [x] Analisar dados dos 100 alunos (Email + ID) da planilha de performance
- [x] Verificar quais alunos já existem na tabela users (1 encontrado: Bruno)
- [x] Importar 99 alunos para users com perfil "user", loginMethod "email_cpf" e vinculação à empresa
- [x] Atualizar registro do Bruno (alunoId corrigido de 274 para 30080)
- [x] 100 alunos com alunoId vinculado (34 SEBRAE Acre + 50 SEBRAE TO + 16 EMBRAPII)
- [x] 77 testes passando

## Limpeza de Duplicatas na Tabela Consultores (13/02/2026)
- [x] Analisar duplicatas e dependências (mentoring_sessions) na tabela consultors
- [x] Unificar "Marcia Rocha" e "Marcia Rocha Fernandes" → "Marcia Rocha Fernandes" (128 sessões)
- [x] Unificar "Adriana Deus" e "Adriana Deus - Coordenação" → "Adriana Deus" (46 sessões)
- [x] Unificar "Dina Makiyama" e "Maria Dinamar" → "Dina Makiyama" (22 sessões)
- [x] Remover 16 registros duplicados (de 27 para 11 consultores)
- [x] Atualizar 125 referências (consultorId) nas mentoring_sessions
- [x] Verificar integridade: 2.220 sessões, 0 órfãs
- [x] Gerar documento de-para para correção dos nomes nas planilhas originais

## Estrutura de PDI / Assessment (13/02/2026)
- [x] Criar tabela assessment_pdi no schema (alunoId, trilhaId, turmaId, consultorId, macroInicio, macroTermino, status ativo/congelado)
- [x] Criar tabela assessment_competencias (assessmentPdiId, competenciaId, peso obrigatoria/opcional, notaCorte, microInicio, microTermino)
- [x] Rodar db:push - migração aplicada com sucesso
- [x] Importar dados da planilha CompetênciasObrigatórias-SEBRAETocantins (50 alunos, 511 registros)
- [x] BS1: 11 alunos, 158 comps (132 obrig + 26 opc) | BS2: 32 alunos, 297 comps (179 obrig + 118 opc) | BS3: 7 alunos, 56 comps (45 obrig + 11 opc)
- [x] 0 violações de micro ciclo > macro ciclo
- [x] Criar endpoints tRPC para CRUD do PDI (listar por aluno/programa/consultor, criar, editar competência, congelar trilha)
- [x] Criar tela de Assessment na área da mentora (formulário de input do PDI)
- [x] Tela com tabs: Assessments Existentes + Novo Assessment
- [x] Formulário: selecionar aluno, trilha, competências (obrigatórias/opcionais), notas de corte, macro/micro ciclos
- [x] Botão de congelar trilha encerrada
- [x] Visualização das competências com nota atual vs nota de corte (verde/vermelho)
- [x] Validação frontend: micro ciclos não podem ultrapassar macro ciclo
- [x] 88 testes passando (11 novos de assessment)
- [x] Regra de negócio: micro ciclos NUNCA podem ultrapassar as datas do macro ciclo (validação backend + frontend)

## Bugs Reportados pelo Usuário (13/02/2026)
- [x] BUG: Página de cadastro de usuários não está salvando (verificado: endpoints createAccessUser e updateAccessUser funcionando)
- [x] BUG: Ao acessar a empresa SEBRAE Acre, a página dá erro (verificado: mutations de empresa passadas como props)
- [x] BUG: Área de cadastro de empresa não tem botão para EDITAR a empresa (mutations updateEmpresa conectadas ao frontend)
- [x] BUG: Área de cadastro de empresa não tem botão para INATIVAR a empresa (mutations toggleEmpresaStatus conectadas ao frontend)
- [x] BUG: Cadastro de novos gerentes não está salvando (campo CPF adicionado ao formulário, criação de registro users junto com consultor)
- [x] BUG: Não há botão para editar o gerente (botão Editar + dialog de edição + endpoint editGerente criado)
- [x] BUG: Escala de notas inconsistente no Assessment/PDI (notas de corte convertidas de 0-100 para 0-10 no banco, default atualizado no schema)

## Melhorias Implementadas (13/02/2026)
- [x] Tab PDI/Assessment adicionada no dashboard do aluno (mostra assessments da mentora com competências, notas de corte e status)
- [x] 96 testes passando (8 novos de bugfixes)
- [x] Filtro por status (ativo/congelado/todos) na aba PDI/Assessment do dashboard do aluno

## Bugs Reportados pelo Usuário (13/02/2026 - Sessão 2)
- [x] BUG: Erro "Invalid email address" ao criar novo mentor - email e CPF agora obrigatórios com validação no frontend e backend
- [x] Limpar 19 registros de teste (gestores) do banco de dados de produção - 20 registros removidos
- [x] Limpar registros de teste (alunos) do banco de dados de produção - 19 registros removidos
- [x] Ajustar testes vitest para fazer cleanup (afterAll) dos dados criados durante os testes
- [x] BUG: Botão Editar não aparece na aba Mentores - botão Editar + dialog de edição + endpoint editMentor adicionados
- [x] Limpar registros de teste "Primeiro usuário" (alunos) do banco - registros removidos
- [x] BUG: Alunos na Gestão de Acesso não mostram nome real nem empresa associada - programName via LEFT JOIN
- [x] Ajustar testes vitest para fazer cleanup dos dados criados - afterAll com cleanup implementado

## Refatoração Aba Gestão de Acesso → Alunos (13/02/2026)
- [x] Filtrar aba "Gestão de Acesso" para mostrar apenas alunos (role='user')
- [x] Renomear aba para "Alunos" com ícone GraduationCap 
- [x] Remover contadores de Administradores/Mentores/Gestores - agora mostra total de alunos + contagem por empresa
- [x] Ocultar CPF da listagem (LGPD) - mostra apenas ID do aluno, nome, email, empresa, status
- [x] Limpar registros de teste restantes do banco - 4 registros removidos
- [x] Botão "Novo usuário" → "Novo Aluno" - formulário simplificado para alunos
- [x] Remover campo "Empresa" do formulário de criação e edição de mentores (mentores são da administração, não pertencem a empresa)
- [x] Adicionar campo de especialidade no cadastro de mentores (schema, backend, frontend) para facilitar busca por habilidades
- [x] Ordenar listas de alunos, mentores e gerentes: ativos primeiro, inativos no final
- [x] Limpar registros de teste restantes ("Primeiro usuário 177...") do banco - 6 registros removidos
- [x] BUG: Login da mentora Adriana não funciona - authenticateByEmailCpf agora busca também na tabela consultors e cria registro em users automaticamente

## Correção Números Dashboard do Mentor (13/02/2026)
- [x] Investigar sessões órfãs inflando números do dashboard do mentor (1.014 sessões referenciando 99 alunos inexistentes)
- [x] Limpar sessões de mentoria órfãs (alunos que não existem mais na tabela alunos - importação antiga substituída) - 1.014 sessões removidas
- [x] Corrigir números do painel da Adriana Deus: 46 mentorias → 26 válidas, 30 alunos → 16 válidos
- [x] BUG: Filtro de empresa não seleciona na página Registro de Mentoria do mentor - agora mostra apenas empresas do mentor
- [x] BUG: Filtro de alunos mostra todos os alunos do sistema - agora filtra por mentor logado (endpoints byConsultor e programsByConsultor)
- [x] AUDITORIA: Verificar se Adriana realmente tem 16 mentorados - 11 eram sessões de apresentação (removidas), ficou com 5 alunos EMBRAPII
- [x] BUG: Filtro de empresa na tela da mentora - código corrigido, precisa publicar
- [x] Remover 11 sessões de apresentação do sistema da Adriana com alunos SEBRAE TO (não são mentorias reais, manter apenas EMBRAPII) - Adriana agora: 5 alunos, 15 sessões, EMBRAPII
- [x] BUG: Filtros de Empresa e Aluno nas páginas Registro de Mentoria e Assessment/PDI - código corrigido, precisa publicar para a Adriana ver
- [x] BUG RECORRENTE: Dropdown de empresa não abre para mentora Adriana - resolvido removendo filtro de empresa da área do mentor
- [x] Remover filtro de empresa da área do mentor (Registro de Mentoria e Assessment/PDI) - mentor vê apenas lista de alunos
- [x] BUG: Ao selecionar aluno no filtro, nada acontece - corrigido: Select usava value="" em vez de undefined (RegistroMentoria + DashboardAluno)
- [x] BUG CRÍTICO: Ao selecionar aluno como mentor, a tela não muda - corrigido: substituído Radix Select por select nativo HTML
- [x] SOLUÇÃO RADICAL: Substituir Select Radix por select nativo HTML para alunos no RegistroMentoria, Assessment e DashboardAluno
- [x] Investigar por que a nota de evolução da mentora não aparece nas sessões (campo nota_evolucao vazio no banco, mas dado existe na planilha de mentorias)
- [x] Copiar engagementScore para notaEvolucao no banco (1.195 sessões atualizadas)
- [x] Corrigir escala de engajamento de /5 para /10 em RegistroMentoria, DashboardAluno e IndividualDashboard
- [x] Corrigir script import-mentorias.mjs para incluir notaEvolucao no INSERT
- [x] Corrigir excelProcessor.ts para mapear coluna Nota de Evolução separadamente
- [x] Incorporar classificação por estágios de evolução (Excelência 9-10, Avançado 7-8, Intermediário 5-6, Básico 3-4, Inicial 0-2) na exibição das notas
- [x] Exibir estágio com cor e label nas páginas RegistroMentoria, DashboardAluno e IndividualDashboard
- [x] Adicionar feedback resumido na visualização de sessões no RegistroMentoria

## Correção Crítica - Fórmula do Indicador 3 (13/02/2026)
- [x] CRÍTICO: Corrigir fórmula do componente "Nota da Mentora" no Indicador 3 de (Nota/5)*100 para (Nota/10)*100
- [x] Notas das mentoras são de 0 a 10 (não 0 a 5 como estava sendo calculado)
- [x] Atualizar explicações nos dashboards para refletir escala 0-10 (5 arquivos corrigidos)
- [x] Atualizar testes vitest para nova fórmula base 10 - 109 testes passando
- [x] Verificar impacto na Performance Geral de todos os alunos

## Melhorias na Exibição de Sessões de Mentoria (13/02/2026)
- [x] Adicionar botão "Visualizar" ao lado do botão "Editar" em cada sessão
- [x] Mostrar pontuação de presença abaixo de cada sessão (Presente=100pts, Ausente=0pts)
- [x] Mostrar pontuação de tarefa abaixo de cada sessão (Entregue=100pts, Não Entregue=0pts)
- [x] Corrigir escala de Engajamento para /10

## Correção Fórmula Indicador 3 - Engajamento como Média de 3 Componentes (13/02/2026)
- [x] CRÍTICO: Indicador 3 deve ser a média de 3 componentes na base 100: Presença (100/0) + Tarefa (100/0) + Evolução (nota/10*100) / 3
- [x] Verificado: indicatorsCalculator.ts já usa a fórmula correta (Ind.1 + Ind.2 + notaMentora%) / 3 com nota/10*100
- [x] Atualizar explicações nos 5 dashboards para refletir a nova fórmula (VisaoGeral, Aluno, Empresa, MeuPerfil, PlanoIndividual)
- [x] Atualizar testes vitest para a nova fórmula - 109 testes passando

- [x] Remover subtítulo "Clique em Editar para registrar a nota de evolução" da seção Sessões de Mentoria no RegistroMentoria

## Correção Indicador 2 - Incluir Sessão 1 no cálculo de tarefas (13/02/2026)
- [x] Esclarecido: Sessão 1 é onde o mentor atribui a tarefa, entrega só a partir da 2ª sessão - exclusão da Sessão 1 está CORRETA
- [x] Revertido indicatorsCalculator.ts para manter exclusão da 1ª sessão no cálculo de tarefas
- [x] Corrigida exibição da Sessão 1 no RegistroMentoria: mostra 'Sem tarefa (1ª sessão)' e 'N/A' na pontuação
- [x] Rodar testes vitest e salvar checkpoint - 109 testes passando

## Progresso de Sessões por Ciclo Macro e Notificações (13/02/2026)
- [x] Usar Assessment PDI (macroInicio/macroTermino) como fonte do total de sessões do ciclo macro
- [x] Não precisa de campo novo - diferença em meses entre macroInicio e macroTermino = total sessões
- [x] Criar procedimento backend para calcular progresso de sessões por aluno (sessões realizadas vs total do macro ciclo)
- [x] Exibir progresso de sessões (realizadas/total) no RegistroMentoria para mentorado e mentor
- [x] Exibir progresso de sessões nos dashboards (DashboardAluno, IndividualDashboard)
- [x] Implementar notificação quando faltar 1 sessão para fechar o ciclo macro:
  - Alerta visual no RegistroMentoria (badge animado para mentor)
  - Alerta visual no DashboardAluno (card de progresso)
  - Alerta visual no IndividualDashboard (card de progresso para aluno logado)
  - Card de alerta no DashboardVisaoGeral (lista de alunos a 1 sessão para admin/gerente)
  - Card de ciclos completos no DashboardVisaoGeral
  - Botão "Enviar Notificação" no DashboardVisaoGeral (via notifyOwner)
- [ ] Atualizar testes vitest

- [x] Ordenar lista de alunos em ordem alfabética nos filtros de seleção (RegistroMentoria, DashboardAluno, Assessment)

- [x] BUG: Card do aluno mostra '0 sessões registradas' - investigado: era versão anterior do sistema

## Investigação (13/02/2026) - Referência a SEBRAE PARA
- [x] Investigado: NÃO existe "SEBRAE PARA" no banco de dados nem no código fonte
- [x] Era apenas um erro de texto no todo.md (nota do desenvolvedor)
- [x] Programas corretos confirmados: SEBRAE TO, SEBRAE ACRE, EMBRAPII, BANRISUL
- [x] Remover programa "teste" (id=30001) do banco - sem turmas ou alunos vinculados

## Melhoria UX (13/02/2026) - Unificar exibição de engajamento e evolução
- [x] Unificar "⭐ 6/10 Engajamento" e "📈 6/10 Intermediário" em um único elemento
- [x] Formato: "6/10 Nível de Engajamento — Intermediário" (com cor do estágio)
- [x] Aplicar em RegistroMentoria (listagem de sessões e visualização)
- [x] Remover frase "Registre a nota de evolução" do subtítulo
- [x] Aplicar em DashboardAluno (tabela de sessões - unificado em 1 coluna)
- [x] Aplicar em IndividualDashboard (listagem de sessões do aluno logado)

## Correção de Texto (13/02/2026) - Progresso do Macro-Ciclo
- [x] Corrigir texto "Faltam X sessões" para "Faltam X sessões para o término do Macro-Ciclo"
- [x] Aplicado em: DashboardAluno, IndividualDashboard, RegistroMentoria

## Regra de Negócio (13/02/2026) - Desconsiderar notas da 1ª sessão
- [x] Investigar como a 1ª sessão é tratada no cálculo de indicadores (server-side)
- [x] Desconsiderar nota de engajamento/evolução da 1ª sessão no cálculo do Indicador 3 (indicatorsCalculator.ts)
- [x] Não exibir nota de engajamento na 1ª sessão na listagem (RegistroMentoria, DashboardAluno, IndividualDashboard)
- [x] Atualizar testes para refletir a nova regra (110 testes passando)

## Melhoria UX (13/02/2026) - Datas do Macro-Ciclo na tela de Sessões
- [x] Exibir data de início e término do Macro-Ciclo na seção "Sessões de Mentoria" do RegistroMentoria

## Portal do Aluno - Redesign Completo (UI-First) - 13/02/2026

### Estrutura de Navegação
- [ ] Criar navegação por abas/seções no Portal do Aluno
- [ ] Substituir IndividualDashboard por portal completo com múltiplas seções

### 1. Meu Perfil / Cadastro
- [ ] Dados pessoais (nome, e-mail, telefone)
- [ ] Currículo profissional (formação, experiência, habilidades)
- [ ] Foto do aluno
- [ ] Botão "Editar Perfil" (funcionalidade futura)

### 2. Assessment
- [ ] Link externo para realização do teste (configurável)
- [ ] Status: pendente, em andamento, concluído
- [ ] Botão para acessar o teste (link externo)

### 3. Relatório de Perfil
- [ ] Resultado do assessment (upload feito pela mentora - futuro)
- [ ] Parecer da mentora (futuro)
- [ ] Placeholder com mensagem "Aguardando relatório"

### 4. Minha Mentora
- [ ] Perfil da mentora com foto, bio, especialidades
- [ ] Escolher mentora (funcionalidade futura)
- [ ] Visualização do perfil da mentora atribuída

### 5. Agenda / Agendamento
- [ ] Área de agendamento de sessões com a mentora (interno)
- [ ] Próximas sessões agendadas
- [ ] Histórico de sessões

### 6. Plataforma de Cursos
- [ ] Link externo para plataforma de cursos (configurável)
- [ ] Botão de acesso à plataforma

### 7. Webinars
- [ ] Próximos webinars (data, tema)
- [ ] Webinars passados com link YouTube para rever gravação
- [ ] Botão para registrar presença

### 8. Tarefas / Ações da Mentora
- [ ] Atividades definidas pela mentora (da biblioteca de tarefas)
- [ ] Campo de relato do aluno (como executou a tarefa)
- [ ] Upload de documentos comprobatórios (futuro)
- [ ] Aviso: enviar arquivos por e-mail para relacionamento@ckmtalents.net
- [ ] Status de cada tarefa (pendente, entregue, avaliada)
- [ ] Nota de performance nas tarefas práticas

### 9. Minha Performance
- [ ] Performance nos cursos
- [ ] Performance nos webinars
- [ ] Performance nas mentorias
- [ ] Performance nas tarefas práticas
- [ ] Performance Geral (consolidada com 5 indicadores)

### 10. Minha Trilha
- [ ] Competências definidas pela mentora após assessment
- [ ] Cursos vinculados a cada competência
- [ ] Visualização como caminho/jornada
- [ ] Ciclos/períodos com datas de início e conclusão
- [ ] Performance por ciclo
- [ ] Status por ciclo: pendente, em andamento, concluído
- [ ] Progresso geral na trilha

## Portal do Aluno — Jornada Completa (UI-first com dados fake para apresentação)

### Fase 1 — Onboarding (Stepper guiado)
- [x] Stepper visual horizontal com 5 etapas e bloqueio sequencial
- [x] Etapa 1: Cadastro/Perfil — formulário com dados pessoais e profissionais, foto placeholder
- [x] Etapa 2: Assessment — link externo, status (Pendente/Em andamento/Concluído), mentora marca conclusão
- [x] Etapa 3: Escolha da Mentora — galeria com cards (foto, mini-CV), clique para CV completo, botão "Escolher", mensagem "sem disponibilidade" se sem slots em 10 dias
- [x] Etapa 4: Agendamento 1º Encontro — slots de data/hora cadastrados pela mentora + link Google Meet
- [x] Etapa 5: 1º Encontro — participação via link, mentora registra presença/nota/1ª tarefa

### Fase 2 — Pós-Encontro Inicial
- [x] Resultado do Assessment disponibilizado pela mentora
- [x] Trilha de competências definida pela mentora
- [x] Transição automática do stepper para portal completo

### Fase 3 — Programa de Desenvolvimento (Portal com abas)
- [x] Aba Cursos/Módulos — link externo para plataforma de cursos
- [x] Aba Webinars — próximos, gravações YouTube, registro de presença
- [x] Aba Mentorias Mensais — agendamento com mentora escolhida, slots, link Meet
- [x] Aba Tarefas/Ações — tarefas da biblioteca, relato texto, aviso email para arquivos
- [x] Aba Performance — 5 indicadores, nota geral, radar, evolução
- [x] Aba Minha Trilha — competências por ciclo, progresso, notas, timeline visual

### Dados Fake para Apresentação
- [x] Dados fake realistas em todas as seções para demonstração
- [x] Fotos placeholder profissionais para mentoras
- [x] Slots de agenda fake com datas e links Google Meet
- [x] Webinars fake com títulos e datas realistas
- [x] Tarefas fake da biblioteca com prazos e status variados

## Ajustes Portal do Aluno (26/02/2026)
- [x] Redirecionar aluno (role user) para /portal-aluno após login
- [x] Menu lateral do aluno: Portal do Aluno, Meu Painel, Tutoriais
- [x] Mensagem "Bem-vindo" com nome do aluno no Portal
- [x] Criar página de Tutoriais com vídeos explicativos da plataforma (cards com links, sem gerar vídeos)
- [x] Registrar rota /tutoriais no App.tsx

## Dados Reais do Aluno no Portal (26/02/2026)
- [x] Formulário de cadastro do Portal do Aluno deve puxar dados reais do aluno logado (nome, email, telefone, empresa, cargo)
- [x] Mensagem Bem-vindo deve usar o nome real do aluno logado

## Layout Exclusivo do Aluno - Navegação Horizontal (26/02/2026)
- [x] Criar componente AlunoLayout com header + navegação horizontal no topo (sem sidebar)
- [x] Atualizar PortalAluno para usar AlunoLayout em vez de DashboardLayout
- [x] Atualizar DashboardMeuPerfil para usar AlunoLayout quando role=user
- [x] Atualizar Tutoriais para usar AlunoLayout quando role=user
- [x] Layout responsivo para mobile

## Campos do Cadastro em Branco (26/02/2026)
- [x] Deixar campos sem dados do banco em branco (telefone, empresa, cargo, área, experiência) sem placeholder

## Mentora Real no Portal do Aluno (26/02/2026)
- [x] Exibir nome da mentora real do aluno apenas no Meu Painel (já existia como badge)

## Correção Mentor no Meu Painel (26/02/2026)
- [ ] Buscar mentor pelas sessões de mentoria quando consultorId do aluno for NULL

## Importação Planilha SEBRAE TO (26/02/2026)
- [ ] Analisar todas as abas da planilha (Respostas, Codigo_nome, ID TURMAS, ID TRILHA, Extrutura)
- [ ] Extrair relação mentor-aluno da planilha
- [ ] Atualizar consultorId dos alunos no banco com base na planilha
- [ ] Atualizar demais dados relevantes (turmas, trilhas, estrutura)

## Mentor Atual + Histórico por Sessão (26/02/2026)
- [x] Mapear 8 mentores da planilha com consultores no banco (Dina Makyiama = Dina Makiyama, grafia diferente)
- [x] Atualizar consultorId dos 50 alunos com o mentor mais recente
- [ ] Meu Painel: mostrar mentor atual (sessão mais recente) — já funciona via consultorId
- [ ] Histórico de mentorias: cada sessão mostra o mentor que acompanhou

## Importação Planilha SEBRAE ACRE (26/02/2026)
- [x] Baixar e analisar planilha SEBRAE ACRE (864 registros, 33 alunos, 2 mentores)
- [x] Mapear mentores: Equipe CKM Talents + Ana Carolina = Ana Carolina Cardoso Viana Rocha (ID 28)
- [x] Atualizar consultorId dos 33 alunos SEBRAE ACRE -> Ana Carolina (33/33 atualizados)

## Importação Planilha EMBRAPII (26/02/2026)
- [x] Baixar e analisar planilha EMBRAPII (156 registros de sessões, 16 alunos, 8 mentores)
- [x] Mapear 8 consultores da planilha com consultores no banco (todos já existiam)
- [x] Identificar mentor mais recente de cada aluno baseado na data da sessão
- [x] Atualizar consultorId dos 16 alunos EMBRAPII (16/16 atualizados com sucesso)
- [x] Distribuição: Ana Carolina (11 alunos), Andressa Santos (2), Adriana Deus (2), Luciana Pereira (1)

## Estrutura de Jornadas (26/02/2026)
- [x] Criar 5ª trilha "Jornada do Futuro I.A" (ID 30001, código JORNADA_FUTURO_IA, ordem 5) — "Visão de Futuro" mantida inalterada
- [ ] Definir competências da nova trilha (aguardar orientação do usuário)

## Importação Relatório de Performance (26/02/2026)
- [x] Analisar estrutura do CSV de performance (34 colunas, 1464 registros, 100 alunos, 11 turmas, 36 competências)
- [x] Mapear colunas do CSV com tabelas do banco
- [x] Substituir dados de performance no banco de dados (1464 registros importados)
- [x] Verificar resultados da importação (0 erros, 0 alunos não vinculados)

## Upload Relatório de Performance - Admin (26/02/2026)
- [x] Criar tabela student_performance no schema
- [x] Criar tabela performance_uploads para histórico de uploads
- [x] Migrar schema para o banco
- [x] Criar endpoint tRPC para upload e processamento do CSV
- [x] Criar página de upload na área admin (menu "Relatório de Performance")
- [x] Processar CSV: mapear alunos, competências e turmas (100% match)
- [x] Exibir histórico de uploads e resumo dos dados
- [x] Testar fluxo completo de upload (1464 registros, 13 testes vitest passando)

## Módulo de Gestão de Webinars - Admin (26/02/2026)
- [x] Criar tabela scheduled_webinars no schema (título, tema, data, horário, link, descrição, imagem do cartão, status)
- [x] Criar tabela announcements/avisos no schema (título, conteúdo, tipo, imagem, data publicação, ativo)
- [x] Migrar schema para o banco
- [x] Criar endpoints tRPC para CRUD de webinars (listar, criar, editar, excluir)
- [x] Criar endpoints tRPC para CRUD de avisos/divulgações
- [x] Criar endpoint para envio de notificação/lembrete sobre webinars
- [x] Criar página de gestão de webinars na área admin (cadastro, edição, upload de cartão)
- [ ] Criar página de gestão de avisos/divulgações na área admin
- [x] Botão de envio de notificação/lembrete por webinar
- [x] Criar tela de abertura/mural do aluno com divulgações (webinars, cursos, atividades extras, avisos)
- [x] Adicionar menu Webinars no sidebar admin

## Atualização de Eventos - 3 Planilhas (26/02/2026)
- [x] Importar eventos SEBRAE TO (1009 registros, 50 alunos, 22 eventos)
- [x] Importar eventos EMBRAPII (331 registros, 16 alunos, 25 eventos)
- [x] Importar eventos SEBRAE ACRE (888 registros, 33 alunos, 27 eventos)
- [x] Limpar eventos antigos e substituir pelos novos (2228 participações, 32 eventos, 0 erros)
- [x] Verificar dados nos dashboards (32 eventos + 32 scheduled_webinars criados)

## Gestão de Webinars - Admin (26/02/2026)
- [x] Criar formulário para admin cadastrar novos webinars (título, tema, data, palestrante, link, cartão)
- [x] Permitir editar webinars existentes (incluir link de gravação nos antigos)
- [x] Listar webinars com filtros (por status e busca textual)
- [x] Upload de cartão de divulgação por webinar (S3)
- [x] Botão de envio de notificação/lembrete por webinar
- [x] Webinars antigos importados das planilhas aparecem na lista para edição

## Tela de Abertura / Mural do Aluno (26/02/2026)
- [x] Criar página MuralAluno com layout atrativo
- [x] Seção de próximos webinars (com cartão de divulgação, data, tema)
- [x] Seção de avisos/comunicados do programa
- [x] Seção de cursos e atividades extras disponíveis
- [x] Seção de webinars gravados (com link YouTube)
- [x] Integrar com endpoints existentes (webinars.upcoming, webinars.past, announcements.active)
- [x] Adicionar menu "Mural" no sidebar do aluno como primeira opção
- [x] Design responsivo e visualmente atrativo (hero banner, quick stats, tabs)

## Presença e Reflexão em Webinars - Aluno (26/02/2026)
- [ ] Criar tabela webinar_attendance (presença + reflexão do aluno por webinar)
- [ ] Migrar tabela no banco de dados
- [ ] Criar endpoints tRPC para marcar presença e enviar reflexão
- [ ] Criar endpoint para listar presenças do aluno
- [ ] Criar interface no Mural do Aluno para marcar presença e escrever reflexão
- [ ] Integrar presença via reflexão com cálculo da nota de participação em eventos
- [ ] Admin pode visualizar reflexões e presenças dos alunos
- [ ] Testes vitest para os novos endpoints

## Presença e Reflexão em Webinars - Simplificado (26/02/2026)
- [x] Adicionar coluna `reflexao` (text) e `selfReportedAt` (timestamp) na tabela event_participation
- [x] Criar endpoint tRPC para aluno marcar presença com reflexão
- [x] Criar endpoint tRPC para listar webinars pendentes de presença do aluno
- [x] Criar banner de aviso no Mural do Aluno ("Não deixe de marcar sua presença!")
- [x] Criar modal/painel para marcar presença e escrever reflexão
- [x] Badges nos cards: "Presença confirmada" (verde) / "Pendente" (laranja)
- [x] Presença registrada na mesma tabela event_participation (integra com Indicador 6)
- [x] Admin pode visualizar reflexões dos alunos (endpoint attendance.reflections)
- [x] Testes vitest (9 testes passando, 154 total)
- [ ] Incluir alerta educativo: "Registre presença somente após deixar sua percepção e insights. A participação é para seu desenvolvimento, não para marcar ponto."
- [x] Incluir alerta educativo aprovado no modal de presença

## Controle de Presença por Data/Hora do Evento (27/02/2026)
- [x] Adicionar campos startDate e endDate na tabela scheduled_webinars
- [x] Atualizar formulário admin de webinars com data/hora início e fim (endpoints create/update)
- [x] Condicionar marcação de presença: só liberar após endDate do evento (validação backend + frontend)
- [x] Aba Gravações: botão "Assistir" (YouTube) + botão "Marcar Presença" (se já terminou e não confirmou)
- [x] Banner de presença pendente: só exibir eventos que já terminaram (filtro por endDate no db.ts)
- [x] Eventos futuros: apenas botão "Participar" (link reunião), sem opção de presença
- [x] Badge "Presença confirmada" para eventos já confirmados
- [x] Testes vitest atualizados (163 testes passando, 14 arquivos)

## Bug: Mural do Aluno mostra 0 webinars (27/02/2026)
- [x] Investigar por que webinars não aparecem (causa: todos eram passados, aba Todos só mostrava upcoming)
- [x] Corrigir: adicionado card "Gravações Disponíveis" (20), aba Todos agora inclui webinars passados, cards clicáveis

## Página de Gestão de Avisos - Admin (27/02/2026)
- [x] Criar página AvisosAdmin.tsx com CRUD completo
- [x] Formulário para criar avisos (título, conteúdo, tipo: curso/atividade/aviso/novidade, imagem)
- [x] Listar avisos com filtros por tipo e status (ativo/inativo)
- [x] Editar e excluir avisos existentes
- [x] Toggle ativo/inativo para controlar visibilidade no mural do aluno
- [x] Upload de imagem de capa do aviso para S3
- [x] Adicionar menu "Avisos e Comunicados" no sidebar admin
- [x] Testes vitest (mural-ux.test.ts criado com 23 testes)

## Reorganização do Mural do Aluno (27/02/2026)
- [x] Tela inicial limpa: só cards numéricos + banner de presença pendente
- [x] Ao clicar no card: abre lista de itens daquele tipo
- [x] Cada webinar/gravação: botão claro "Assistir" (YouTube) e "Marcar Presença" (reflexão)
- [x] Remover abas/tabs da tela inicial (só aparecem ao clicar no card)
- [x] Simplificar fluxo: menos confusão visual
- [x] Botão "Voltar" para retornar à tela de cards
- [x] Seção "Pendentes de Presença" com preview rápido na home
- [x] Testes vitest para nova UX (mural-ux.test.ts - 23 testes passando)
- [ ] NOTA: Botões "Assistir Gravação" e "Marcar Presença" só aparecem quando youtubeLink/meetingLink estão preenchidos no banco. Atualmente os webinars não têm esses links cadastrados.

## Fix: Botões sempre visíveis nas gravações (27/02/2026)
- [x] Mostrar botões "Assistir" e "Marcar Presença" sempre em cada webinar da lista de gravações

## Fix: Presença já confirmada nas gravações (27/02/2026)
- [x] Se aluno já tem presença confirmada: esconder "Marcar Presença", mostrar badge verde "Presença confirmada"
- [x] Botão "Assistir" continua disponível independente do status de presença

## Bug: Mapeamento events->scheduled_webinars no Mural (27/02/2026)
- [x] myAttendance retorna eventId da tabela events, mas frontend compara com scheduled_webinars.id
- [x] myAttendance filtra selfReportedAt != null, excluindo presenças importadas via planilha
- [x] Corrigir: cruzar events com scheduled_webinars pelo título e retornar scheduledWebinarId
- [x] Incluir presenças importadas (selfReportedAt = null) no status de presença

## Bug: Aluno com status "presente" no banco ainda vê botão Marcar Presença (27/02/2026)
- [x] Se status="presente" na event_participation, tratar como "confirmed" no frontend
- [x] Esconder botão "Marcar Presença" e mostrar badge verde
- [x] myAttendance agora filtra apenas status="presente" e mapeia para scheduledWebinarId
- [x] Confirmado: Valci tem 8 webinars mapeados corretamente (sw IDs: 2,3,4,5,7,9,10,18)

## Bug: Badge verde não aparece para Joseane com 20 presenças (27/02/2026)
- [x] Investigar por que myAttendance não retorna dados para Joseane logada
- [x] Causa: events tinham programId=NULL, filtro por programa retornava 0 resultados
- [x] Corrigir: buscar events pelos IDs das participacoes do aluno (sem filtrar por programa)
- [x] Validado via script: 20 presentes, 20 mapeados para scheduled_webinars

## Tarefas Práticas da Mentoria (27/02/2026)
- [x] Seletor de tarefa da biblioteca já existe no registro de sessão de mentoria
- [x] Criar endpoint myTasks para retornar tarefas atribuídas ao aluno
- [x] Criar seção "Minhas Tarefas Práticas" no Mural do aluno (card + drill-down com detalhes)

## Fix: Título do card Tarefas Práticas aparecendo errado (27/02/2026)
- [x] Título já estava correto no código ("Tarefas Práticas") - era cache do navegador

## Bug: Cards indicadores ilegíveis no Meu Painel (27/02/2026)
- [x] Corrigir cores dos cards de indicadores (fundo branco + texto escuro + borda cinza)

## Identidade Visual B.E.M. (27/02/2026)
- [ ] Extrair cores exatas da marca (azul marinho + laranja âmbar)
- [ ] Atualizar CSS global (index.css) com paleta B.E.M.
- [ ] Aplicar cores nos componentes: sidebar admin, navbar aluno, cards, botões

## Logo e Identidade Visual (27/02/2026)
- [x] Incluir logo B.E.M. no header do AlunoLayout (todas as páginas do aluno)
- [x] Incluir logo B.E.M. na página inicial do Mural do Aluno
- [x] Incluir logo B.E.M. no DashboardLayout sidebar (admin/mentor)
- [x] Aplicar cores da marca (#0A1E3E navy, #F5991F orange) consistentemente

## Bug Reportado (27/02/2026) - Aba "0s" no Portal do Aluno
- [x] Corrigir aba que mostra "0s" em vez de "Tarefas Práticas" no Portal do Aluno
- [x] Verificar "SEBRAE PARA" que aparece na imagem - corrigido: removido texto hardcoded "SEBRAE TO", agora busca programa real do banco via meuDashboard

## Reorganização Mural vs Portal do Aluno (27/02/2026)
- [x] Remover card "0s ss" (Tarefas Práticas) do Mural - já consta no Portal do Aluno
- [x] Mural: manter webinários apenas como "Próximos" e "Gravações Disponíveis" (sem histórico de presença)
- [x] Portal do Aluno (aba Webinários): concentrar histórico completo com marcação de presença (já estava implementado)

## Separar Onboarding do Portal do Aluno (27/02/2026)
- [x] Criar rota /onboarding separada para o fluxo de 5 etapas (Cadastro, Avaliação, Mentora, Agendamento, 1º Encontro)
- [x] Portal do Aluno (/portal) deve ir direto para o Portal Completo (abas Desempenho, Trilha, Mentorias, etc.)
- [x] Adicionar "Onboarding" como item no menu de navegação do AlunoLayout
- [x] Remover a lógica de fase onboarding/desenvolvimento do PortalAluno.tsx

## Conectar Onboarding e Portal do Aluno ao Banco de Dados (27/02/2026)
- [ ] Criar tabelas no schema para progresso do onboarding (etapa atual, dados de cadastro, mentora selecionada, agendamento)
- [ ] Criar procedures tRPC para salvar/buscar progresso do onboarding
- [ ] Conectar OnboardingAluno.tsx ao banco (substituir dados fake)
- [ ] Conectar PortalAluno.tsx ao banco (substituir dados fake por dados reais)
- [ ] Substituir webinários fake por dados reais do banco
- [ ] Substituir tarefas fake por dados reais do banco
- [ ] Substituir cursos fake por dados reais do banco
- [ ] Substituir sessões de mentoria fake por dados reais do banco
- [ ] Substituir trilha/competências fake por dados reais do banco

## Remoção de Dados Fake - Prioridade (27/02/2026)
- [ ] Retirar dados fake de webinários do PortalAluno (usar dados reais do banco - scheduledWebinars + eventParticipation)
- [ ] Retirar dados fake de tarefas práticas do PortalAluno (usar dados reais - mentoringSessions.taskId)
- [ ] Retirar dados fake de cursos do PortalAluno (usar dados reais - studentPerformance)
- [ ] Retirar dados fake de sessões de mentoria do PortalAluno (usar dados reais - mentoringSessions)
- [ ] Retirar dados fake de trilha/competências do PortalAluno (usar dados reais - assessmentPdi + assessmentCompetencias)
- [ ] Retirar dados fake de mentoras do OnboardingAluno (usar dados reais - consultors)
- [ ] Criar procedures tRPC para portal do aluno com dados reais
- [ ] Mostrar estados vazios quando não houver dados
- [ ] Remover card "Gravações Disponíveis" do Mural do Aluno

## 3 Tarefas Prioritárias (27/02/2026)
- [x] TAREFA 1: Remover card "Gravações Disponíveis" do Mural do Aluno
- [x] TAREFA 2: Retirar dados fake do Portal do Aluno e conectar ao banco real (unificado com Meu Painel)
- [x] TAREFA 3: Retirar dados fake do Onboarding e conectar ao banco real (mentoras do banco + slots gerados)

## Unificação Portal do Aluno + Meu Painel (27/02/2026)
- [x] Adicionar aba Tarefas Práticas ao DashboardMeuPerfil com dados reais (trpc.attendance.myTasks)
- [x] Adicionar aba Webinários ao DashboardMeuPerfil com dados reais (trpc.webinars.upcoming/past + attendance)
- [x] Adicionar aba Cursos ao DashboardMeuPerfil (placeholder até ter dados reais)
- [x] Renomear "Meu Painel" para "Portal do Aluno" no menu (AlunoLayout)
- [x] Atualizar rota de /meu-dashboard para /portal no App.tsx (mantido /meu-dashboard com redirect)
- [x] Remover PortalAluno.tsx e portalAlunoData.ts
- [x] Remover rota antiga /portal do App.tsx

## Redesign Portal do Aluno - Visual Claro e Legível (27/02/2026)
- [x] Trocar fundo cinza escuro (bg-gray-800/900) por fundo branco/claro em todos os cards
- [x] Trocar textos cinza claro (text-gray-300/400) por textos escuros (text-gray-800/900)
- [x] Trocar badges escuros por badges coloridos com fundo suave (como no Mural)
- [x] Manter gráficos legíveis com cores contrastantes em fundo claro
- [x] Redesenhar header do aluno com fundo claro e badges coloridos
- [x] Redesenhar indicadores com cards brancos e bordas coloridas
- [x] Redesenhar abas com estilo consistente com o Mural
- [x] Adicionar rota /portal-aluno no App.tsx

## Bug Crítico - Tema Escuro Ilegível no Portal do Aluno (27/02/2026)
- [ ] Identificar e corrigir CSS/componente que força tema escuro no Portal do Aluno
- [ ] Garantir que AlunoLayout use fundo claro (bg-white ou bg-gray-50)
- [ ] Garantir que todos os cards, abas e textos sejam legíveis em fundo claro
- [ ] Testar visualmente com perfil de aluno real (não admin)

## Bug Crítico - Tema Escuro Ilegível + Abas Cortadas no Portal do Aluno (27/02/2026)
- [ ] Corrigir fundo escuro (bg-gray-800/900) para fundo claro em AlunoLayout
- [ ] Corrigir cards dos indicadores: fundo cinza ilegível → fundo branco com bordas coloridas
- [ ] Corrigir abas (Trilha, Competências, etc.): fundo escuro → fundo claro legível
- [ ] Corrigir textos cinza claro ilegíveis → textos escuros
- [ ] Corrigir gráfico radar: labels ilegíveis em fundo escuro
- [ ] Testar visualmente com perfil de aluno real

## Mostrar nome do webinar na aba Eventos do Portal do Aluno (27/02/2026)
- [x] Corrigir query para trazer o nome real do evento/webinar em vez de "Evento #ID"

## MVP Reestruturação Trilhas/Ciclos/Contratos (27/02/2026)
- [x] Criar tabela contratos_aluno no schema
- [x] Adicionar campo isAssessment em mentoring_sessions
- [x] Adicionar campos nivelAtual, metaFinal, justificativa em assessment_competencias
- [x] Criar tabela historico_nivel_competencia
- [x] Migrar dados: marcar sessionNumber=1 como isAssessment=1
- [x] Criar queries e rotas tRPC para CRUD de contratos
- [x] Criar rota tRPC para cálculo de saldo de sessões
- [x] Criar rota tRPC para atualizar nível de competência
- [ ] Seção Definições Contratuais no cadastro do aluno (admin)
- [ ] Card de contrato na área da mentora (somente leitura)
- [x] Campos de nível no formulário de Assessment (substituir nota de corte)
- [x] Unificar abas Trilha+PDI em "Minha Jornada" no Portal do Aluno
- [x] Card "Meu Contrato" no Portal do Aluno
- [x] Card de metas de desenvolvimento detalhado no Mural do Aluno
- [x] Renomear Ciclo→Jornada e Corte→Meta na tela de Assessment

## Ajustes solicitados pelo cliente (27/02/2026 - sessão 2)
- [x] Adicionar campos metaCiclo1 e metaCiclo2 no schema assessment_competencias
- [x] Formulário de competências na área da mentora: nível atual, meta ciclo 1, meta ciclo 2, meta final, justificativa
- [x] Barras de progresso coloridas (vermelho/amarelo/verde) por faixa de percentual
- [x] Botão "Salvar e liberar trilha" no formulário da mentora
- [x] Portal do Aluno: aba Minha Jornada unificada com barras de progresso
- [x] Mural do Aluno: card de metas de desenvolvimento detalhado
- [x] Gatilho de reavaliação automática a cada 3 encontros de mentoria
- [x] Histórico de reavaliação: novo percentual, comentário de evolução, evidência prática

## Correções de bugs (27/02/2026 - sessão 3)
- [x] Fix: checkReavaliacaoPendente usava `created_at` ao invés de `createdAt` (coluna camelCase)
- [x] Fix: updateAssessmentCompetenciaFields usava nomes de coluna snake_case ao invés de camelCase
- [x] Fix: SQL raw sem backtick escaping para colunas camelCase
- [x] Fix: updateNivelCompetencia usava assessmentPdiId diretamente como alunoId (deveria buscar do PDI)
- [x] Fix: 5 registros de migração faltando na tabela __drizzle_migrations (0018-0022)
## Remoção de página (27/02/2026 - sessão 3)
- [x] Remover página "Registro de Mentoria" do menu sidebar do admin (mantida para mentores)
- [x] Rota /registro-mentoria mantida no App.tsx (mentores ainda precisam acessar)
- [x] Remover página "Relatório de Performance" do menu sidebar do admin
- [ ] Confirmar remoção de "Registro de Mentoria" do admin (ainda aparece na versão publicada)
- [ ] Confirmar remoção de "Relatório de Desempenho" do admin (ainda aparece na versão publicada)

## Bug Crítico - Formulário Novo Webinar perde foco ao digitar (27/02/2026 - sessão 3)
- [x] Investigar e corrigir perda de foco nos campos do formulário de criação de Novo Webinar (Gestão de Webinários) - causa: WebinarFormFields era arrow function dentro do render, recriando o DOM a cada keystroke. Corrigido para variável JSX.

## Layout estourado - Página de Webinars (27/02/2026 - sessão 3)
- [x] Ajustar layout da página de Gestão de Webinários - envolvida com DashboardLayout para padding e sidebar corretos

## Mover Plano Individual do admin para mentora (27/02/2026 - sessão 3)
- [x] Mover "Plano Individual" do menu sidebar do admin para o menu da mentora (manager)

## Bug - Select de Trilha fecha o Dialog de Novo Assessment (27/02/2026 - sessão 3)
- [x] Corrigir Select de Trilha dentro do Dialog de criação de Assessment - adicionado onPointerDownOutside e onInteractOutside com preventDefault no DialogContent

## Bugs Webinar - Formulário fecha ao digitar e dificuldade para salvar (27/02/2026 - sessão 3)
- [x] Corrigido: tela de edição de webinar fechava ao interagir com Select (Portal) - adicionado onPointerDownOutside/onInteractOutside preventDefault nos DialogContent de criar e editar
- [x] Corrigido: campos difíceis de salvar - mesmo problema do dialog fechando prematuramente, resolvido com a mesma correção

## Bug Persistente - Dialog Novo Assessment fecha ao selecionar trilha (27/02/2026 - sessão 3)
- [x] Correção definitiva aplicada: criado SelectContentNoPortal (renderiza dropdown dentro do DOM do Dialog, sem Portal) em Assessment, Webinars e AdminCadastros

## Análise e respostas para o usuário (27/02/2026 - sessão 3)
- [ ] Analisar: onde a mentora vê em que sessão o mentorado está (controle de sessões)
- [ ] Analisar: onde a mentora define qual trabalho prático o aluno vai fazer
- [ ] Analisar: existe trabalho prático como indicador? onde é atribuído?
- [ ] Analisar: onde a mentora seleciona na biblioteca de trabalhos práticos
- [ ] Analisar: onde a mentora define a meta com o aluno
- [ ] Bug persistente: formulário de Novo Assessment ainda fecha ao selecionar trilha (corrigir definitivamente)

## Importação de dados da planilha COMPETENCIAS-JORNADAS (02/03/2026)
- [x] Verificar correspondência entre planilha e banco (alunos, competências, trilhas)
- [x] Inserir dados no banco: Assessments/PDI com Macro Ciclos e Micro Ciclos por competência
- [x] Implementar visualização da jornada na área do aluno (programa, macro ciclos, micro ciclos, obrigatórias/opcionais)
- [ ] Performance geral calculada apenas sobre competências obrigatórias

## Bug: Indicadores 4 e 5 zerados (02/03/2026)
- [x] BUG: Indicadores 4 (Competências) e 5 (Aprendizado) aparecem como 0% no dashboard mesmo com dados de performance no banco (corrigido: adicionado student_performance como fonte de notas)

## Reestruturação dos Indicadores 4 e 5 por ciclo/período (02/03/2026)
- [ ] Indicadores 4 e 5 devem considerar apenas competências obrigatórias dentro do período/ciclo
- [ ] Competências fora do período (futuras) não devem impactar a nota, mesmo que o aluno já tenha feito
- [ ] Dashboard deve mostrar resultado por macro e micro ciclo
- [ ] Dashboard deve mostrar resultado geral atual (apenas ciclos finalizados, apenas obrigatórias)
- [ ] Ciclos em andamento devem aparecer separados dos finalizados
- [ ] Área do aluno deve mostrar todas as competências realizadas (inclusive fora do período)
- [ ] Usar ciclos_execucao + datas microInicio/microTermino dos assessments como referência de período

## Alerta de encerramento de micro ciclo na área do aluno (03/03/2026)
- [ ] Implementar alerta visual na área do aluno mostrando datas de encerramento de micro ciclos próximos
- [ ] Listar competências pendentes de cada micro ciclo com prazo próximo
- [ ] Destacar urgência (dias restantes) para motivar o aluno a acessar a plataforma
- [ ] BUG: Indicadores 4 e 5 mostram 0% para todos os alunos (não só ODILO) - mediaAvaliacoesFinais é 0 para a maioria
- [ ] BUG: Minha Jornada mostra "Nível Atual: —" para todos - notaAtual no plano_individual é NULL
- [ ] Definir qual campo da planilha usar como nota (progressoTotal vs mediaAvaliacoesRespondidas vs mediaAvaliacoesFinais)
- [ ] FIX: Nota da competência deve usar mediaAvaliacoesRespondidas ou mediaAvaliacoesDisponiveis (não progressoTotal como proxy). Quando ambas = 0, aluno não cursou e não deve contar no cálculo.

## Correção lógica de conclusão de competência (03/03/2026)
- [ ] Conclusão de competência = aulasConcluidas >= aulasDisponiveis (não progressoTotal)
- [ ] Nota da competência = mediaAvaliacoesRespondidas (provas feitas em cada aula)
- [ ] Minha Jornada: mostrar total aulas, aulas disponíveis, concluídas, em andamento por competência
- [ ] Indicador 4: % de competências obrigatórias concluídas (todas aulas feitas) em ciclos finalizados
- [ ] Indicador 5: nota média das avaliações das competências obrigatórias em ciclos finalizados

## REFATORAÇÃO COMPLETA DOS INDICADORES (03/03/2026)

### Nova lógica simplificada - 7 indicadores POR CICLO (em andamento e finalizado)
- [x] Ind 1: Webinars/Aulas Online - Presente=100, Ausente=0, média das presenças
- [x] Ind 2: Performance nas Avaliações - Soma notas provas / nº provas REALIZADAS (nunca pelo total)
- [x] Ind 3: Performance nas Competências - % competências/cursos finalizados por ciclo
- [x] Ind 4: Tarefas Práticas - Entregue=100, Não entregue=0, média das entregas
- [x] Ind 5: Engajamento (Nota da Mentora) - Média notas 0-100 por sessão
- [x] Ind 6: Aplicabilidade Prática (Case de Sucesso) - Entregue=100, Não entregue=0, só macrociclos finalizados
- [x] Ind 7: Engajamento Final - Média dos 6 indicadores acima, POR CICLO

### Schema e banco de dados
- [x] Criar tabela cases_sucesso para registrar entrega de cases por aluno por macrociclo
- [x] Migrar schema com pnpm db:push

### Calculador de indicadores
- [x] Refatorar indicatorsCalculatorV2.ts com nova lógica simplificada
- [x] Calcular indicadores POR CICLO (em andamento separado de finalizado)
- [x] Criar V2 mantendo compatibilidade com V1 (V1 ainda disponível como fallback)

### Frontend - Dashboard do Aluno
- [x] Mostrar indicadores POR CICLO (em andamento e finalizado separados)
- [x] Adicionar alerta visual quando ciclo estiver finalizando (lembrar entrega do case)
- [x] Mostrar status de entrega de case por macrociclo (Básicas, Essenciais, Master, Visão de Futuro)

### Testes
- [x] Escrever testes vitest para nova lógica de indicadores (31 testes)
- [x] Testar cálculo por ciclo em andamento vs finalizado
- [x] Testar indicador de case de sucesso

## Filtro por Ciclo/Jornada e Card Explicativo (03/03/2026)

### Filtros nos cards e gráfico radar
- [x] Adicionar filtro por Jornada (macrociclo: Básicas, Essenciais, Master, Visão de Futuro) nos indicadores
- [x] Adicionar filtro por Ciclo (microciclo dentro da jornada) nos indicadores
- [x] Gráfico Radar atualizado com os 6 indicadores V2, filtrável por ciclo/jornada
- [x] Cards de indicadores filtráveis por ciclo/jornada selecionado

### Card explicativo / Glossário
- [x] Card explicativo do que é Jornada (macrociclo)
- [x] Card explicativo do que é Ciclo (microciclo)
- [x] Card explicativo do que é Trilha
- [x] Card explicativo do que é Aula/Competência
- [x] Design claro e acessível para não confundir o aluno

### Aplicar em ambas as telas
- [x] Implementar no DashboardMeuPerfil (Portal do Aluno)
- [x] Implementar no DashboardAluno (visão admin)

### Correção de escala
- [x] Converter engagementScore de 0-10 para 0-100 no calculador V2 (regra de 3) - já implementado (*10)
- [x] Garantir que todas as notas estejam na base 100 - avaliações já vêm em base 100, engajamento convertido

### Tooltips ⓘ explicativos em toda a interface
- [x] Tooltip ⓘ para "Jornada" - Caminho completo do aluno, tempo total de contrato
- [x] Tooltip ⓘ para "Macrociclo" - Etapa da jornada que agrupa uma trilha (Básicas, Essenciais, Master)
- [x] Tooltip ⓘ para "Trilha" - Caminho de aprendizagem dentro do macrociclo
- [x] Tooltip ⓘ para "Microciclo" - Período com datas onde acontecem competências, webinars, mentorias e tarefas
- [x] Tooltip ⓘ para "Competência" - Curso composto por grupo de aulas e avaliação
- [x] Tooltip ⓘ para cada indicador (como é calculado)
- [x] Tooltip ⓘ para "Engajamento Final" - Média dos 6 indicadores

## 3 Melhorias Finais (03/03/2026)

### 1. Envio de Case de Sucesso (Portal do Aluno)
- [x] Seção no Portal do Aluno para o aluno enviar/entregar o case de sucesso por macrociclo/trilha
- [x] Upload de arquivo do case pelo aluno (salvar no S3)
- [x] Mostrar status de entrega por trilha (Básicas, Essenciais, Master) - pendente/entregue
- [x] Alerta visual quando a trilha estiver finalizando e o case ainda não foi entregue
- [x] Visualização do status de cases no DashboardAluno (admin) - apenas leitura
- [x] Procedure tRPC protegida para envio de case pelo aluno

### 2. Seção Ciclo em Andamento
- [x] Seção destacada no topo do Portal do Aluno com indicadores parciais do ciclo atual
- [x] Barra de progresso do ciclo (competências concluídas / total)
- [x] Mesmos 6 indicadores V2 mas com dados parciais do ciclo em andamento
- [x] Implementar também no DashboardAluno (admin)

### 3. Renomear e Limpar
- [x] Renomear aba "Indicadores V2" para "Indicadores" em DashboardAluno
- [x] Renomear aba "Indicadores V2" para "Indicadores" em DashboardMeuPerfil
- [x] Remover referências ao V1 antigo na interface

## BUGS REPORTADOS (03/03/2026) - Funcionalidades não funcionando
- [ ] Investigar e corrigir: Envio de Case de Sucesso não funciona
- [ ] Investigar e corrigir: Seção Ciclo em Andamento não aparece
- [ ] Investigar e corrigir: Indicadores/Filtros não funcionam
- [ ] Testar todas as funcionalidades no ambiente publicado
- [x] Adicionar campo de busca/filtro na página de Cadastros (aba Alunos) para pesquisar por nome, e-mail ou empresa
- [x] Unificar visões "Caminho de Realização das Competências" e "Minha Jornada" em uma única visão integrada
- [x] Substituir 'Ciclo X' pelo nome da competência nos ciclos exibidos no Portal do Aluno e Dashboard do Aluno
- [x] Ajustar filtro de indicadores no Dashboard do Aluno (admin) para usar nomes de competências em vez de 'Ciclo X'
- [x] Unificar os dois blocos visuais de cada ciclo (barra de progresso + cards de indicadores) em uma única régua compacta no Portal do Aluno
- [x] Remover barra de progresso duplicada e competência repetida nos ciclos — unificar em uma única barra por ciclo
- [x] Fundir cabeçalho do ciclo com card da competência quando há apenas 1 competência (eliminar barra duplicada)
- [x] Ordenar ciclos do mais recente (atual/em andamento) para os mais antigos (finalizados)
- [x] Aplicar mesma unificação de barras de progresso (barra única por ciclo + ordenação recente→antigo) no DashboardAluno (visão admin)
- [x] Corrigir trilha 'Básica' aparecendo duplicada no Portal do Aluno (Fábio Silva de Oliveira)
- [ ] Corrigir nomes de ciclos longos e confusos (ex: "Básica - Atenção, Empatia, Escuta Ativa, Memória, Raciocínio Lógico e Espacial")
- [ ] Corrigir ordem dos ciclos dentro de cada trilha (do mais recente ao mais antigo)
- [x] Criar trilha 'Alinhamento Inicial' (Trilha 1.0) na lista de tipos de trilhas no banco de dados
- [x] Corrigir nomes de ciclos longos — quando há muitas competências concatenadas, limitar ou formatar melhor

## Correções de Terminologia (03/03/2026)
- [x] Alterar termo "Congelados" para "Em Andamento" no Portal do Aluno
- [x] Alterar termo "Ativos" para "Finalizada" no Portal do Aluno
- [x] Verificado: "Básica" está correto no banco e no código. "Badia" era problema de cache/renderização do navegador do usuário

## Auditoria de Nomenclatura (03/03/2026)
- [x] Trocar "Básica" por "Basic" em todo o sistema (código + banco)
- [x] Trocar "Mestre" por "Master" em todo o sistema (código + banco) - já estava correto
- [x] Trocar "Outra/Outras" por "Opcional/Opcionais" para competências/trilhas em todo o sistema
- [x] Trocar "Essencial" por "Essential" em todo o sistema (código + banco)

## Card do Aluno - Assessment/PDI (03/03/2026)
- [x] Mostrar TODAS as trilhas do profissional no card do cabeçalho com ciclos de execução (formato: Trilha X: Ciclo de Execução: de DD/MM até DD/MM)

## Melhorias no Card do Aluno - Assessment/PDI (03/03/2026)
- [x] Expandir/colapsar trilhas no card quando aluno tiver muitas trilhas
- [x] Contagem de competências por trilha no resumo do card

## Card do Portal do Aluno - DashboardMeuPerfil (03/03/2026)
- [x] Alterar card do cabeçalho do aluno no Portal do Aluno para mostrar TODAS as trilhas com ciclos de execução (mesmo tratamento do Assessment/PDI)

## Bug Crítico - Portal do Aluno (03/03/2026)
- [x] Corrigir erro "lt.split não é uma função" no Portal do Aluno (meu-dashboard) - causa: macroInicio/macroTermino é Date object, não string. Corrigido formatDateCard para lidar com ambos os tipos

## Redesenho do Card de Trilhas - Assessment/PDI e Portal do Aluno (03/03/2026)
- [x] Redesenhar card de trilhas: agrupar por turma, listar competências com datas de micro jornada (início/fim)
- [x] Botão de expansão organizado para ver detalhes das competências por trilha
- [x] Aplicar mesmo redesenho no Assessment/PDI e Portal do Aluno

- [x] Bug: Cabeçalhos da tabela de competências no card de trilhas mostram "Não se trata de uma questão de..." e "Filme" em vez de "Início" e "Fim" → Causa: lang="en" no HTML causava tradução automática do navegador. Corrigido para lang="pt-BR" + meta notranslate
- [x] Bug: Portal do Aluno mostra visão diferente para Fábio e Joseane → Não é bug. Layout é idêntico. Diferença visual é consequência da estrutura de dados: Joseane tem 1 competência por ciclo (layout compacto), Fábio tem múltiplas competências por ciclo (layout expandido com indicadores no topo + competências abaixo)
- [x] Bug: Cabeçalhos da tabela de competências mostram "Não se trata de uma questão de..." e "Filme" em vez de "Início" e "Fim" → Duplicata, mesma causa acima (tradução automática)
- [x] REGRA: Nunca abortar trabalho em andamento quando o usuário faz uma pergunta. Anotar a pergunta e retomar após concluir o que estava fazendo.
- [x] Cards de indicadores (7 mini-cards) devem aparecer apenas no início da trilha/ciclo, não repetidos por competência cursada
- [x] Cards de indicadores por ciclo devem refletir APENAS os dados do período daquele ciclo (webinars, mentorias, tarefas dentro das datas do ciclo), não o consolidado geral
- [x] Reverter remoção dos cards por ciclo - cards removidos dos ciclos, mantidos apenas no topo da trilha conforme solicitado pelo usuário
- [x] Bug: Na área do aluno Fábio, os 7 cards de indicadores não aparecem quando a trilha está em andamento → Corrigido: ciclos com apenas competências opcionais agora são criados (allCompetenciaIds)
- [x] Competências opcionais devem aparecer DENTRO da trilha à qual pertencem (não em blocos separados tipo "Competências Opcionais"), apenas não entram no cálculo dos indicadores → Corrigido: match por allCompetenciaIds no frontend

## Auditoria de Cálculos - Fábio Silva De Oliveira (03/03/2026)
- [x] Auditar Ind. 2 Avaliações = 64% → Causa raiz: ciclo com apenas competências opcionais (competenciaIds vazio) gerava ind=0 e entrava no consolidado. Correto: (98+92.5)/2=95.25%. Corrigido: ciclos com competenciaIds vazio excluídos do consolidado
- [x] Auditar todos os 6 indicadores consolidados → Todos afetados pelo mesmo bug (ciclo vazio com 0%). Correção única resolve todos
- [x] Verificar se o consolidado "Todos os ciclos finalizados" exclui corretamente trilhas em andamento → Sim, agora exclui ciclos com competenciaIds vazio
- [x] Auditar Ind. 3 Competências = 67% → Mesmo bug: (0+100+100)/3=67%. Correto: (100+100)/2=100%. Todas as 9 competências obrigatórias têm 6/6 aulas concluídas
- [x] Investigar Eventos vs Webinários → São fontes diferentes: "Eventos" mostra dados importados das planilhas (2228 registros de presença), "Webinários" mostra eventos criados no sistema (32 webinars com funcionalidades interativas como marcar presença e ver gravações). Ambas são válidas e complementares.
- [x] Demonstrar cálculo Ind. 5 Engajamento → Antes: 68.75% (média de 16 sessões sem filtro de ciclo). Após correção: Basic=80%, Essential=92%, Consolidado=(80+92)/2=86%. Ciclo com apenas opcionais (53.33%) excluído do consolidado.

## Auditoria Detalhada Ind. 2 Avaliações - Fábio (03/03/2026)
- [x] Verificar de onde cada nota vem → Tabela student_performance, coluna mediaAvaliacoesRespondidas (prioridade) ou mediaAvaliacoesDisponiveis. Escala 0-100 no banco, convertida para 0-10 e depois para 0-100 no cálculo
- [x] Verificar se usa apenas obrigatórias → Sim, itera sobre ciclo.competenciaIds (apenas obrigatórias)
- [x] Verificar se consolidado exclui ciclos em andamento → BUG ENCONTRADO: consolidado incluía finalizados+em andamento, mas label dizia "finalizados". CORRIGIDO: agora usa apenas ciclos finalizados com obrigatórias (fallback para todos se não há finalizados)
- [x] Comparar nota por nota → Basic: Atenção=100, Empatia=100, Escuta=100, Memória=90, Raciocínio=100 → 490/5=98%. Essential: Comunicação=90, Inteligência=98, Leitura=86, Planejamento=96 → 370/4=92.5%
- [x] Breakdown: Consolidado finalizados = (98+92.5)/2 = 95.25%

## Reestruturação Case de Sucesso - De Indicador para Bônus (03/03/2026)
- [x] Remover Ind. 6 (Case de Sucesso) da média dos indicadores — Engajamento Final passa a ser média de 5 indicadores
- [x] Case como bônus: quem entregar o case recebe +10% na nota da mentora (Ind. 5 Engajamento), limitado a 100%
- [x] Remover "Cases" do radar de performance (5 eixos em vez de 6)
- [x] Atualizar explicações/tooltips nos dashboards
- [x] Atualizar testes vitest

## Divergência Portal vs Mural - Joseane (03/03/2026)
- [ ] Investigar: Portal mostra 100% para Decisões Ágeis (6/6 aulas), Mural mostra 97%
- [ ] Investigar: Divergência em Arquitetura de Mudanças (Portal vs Mural)
- [ ] Determinar qual valor está correto e corrigir a fonte incorreta

## BUG CRÍTICO: Upload de Planilha de Performance - 0 registros (04/03/2026)
- [x] Upload mostra "0 registro(s)" → Causa raiz: uploadFile processava XLSX apenas para contagem (processExcelBuffer) mas não inseria dados na tabela student_performance
- [x] Corrigido: adicionado processamento completo de XLSX no uploadFile quando fileType='performance' - lê dados com XLSX.js, faz matching de alunos/turmas/competências, insere na tabela
- [x] Testado: XLSX parseado corretamente (1513 linhas válidas, 34 colunas, headers com acentos OK). Todos os 243 testes passaram.

## Remover Jornada do Mural (04/03/2026)
- [x] Remover seção "Minha Jornada de Desenvolvimento" do Mural (competências, nível médio, metas atingidas) — pertence ao Portal do Aluno

## Investigação: Tarefas e Webinars por Ciclo (04/03/2026)
- [x] Ciclo Decisões Ágeis (26/10/2025 — 26/01/2026) mostra 16/22 webinars mas 0/0 tarefas — por que?
- [x] Verificar de onde vem a contagem de tarefas por ciclo no calculador V2 → mentorias filtradas por dataSessao, 0 mentorias no período
- [x] Verificar se há tarefas cadastradas para o período no banco → 0 mentorias no período, 0/0 tarefas está correto

## BUG: Contadores de webinars não filtrados por ciclo (04/03/2026)
- [x] Portal do Aluno mostra "16/22 webinars" no ciclo Decisões Ágeis mas só existem 5 eventos no período
- [x] O sistema mostra o total do programa inteiro (22) em vez de filtrar pelo período do ciclo
- [x] Causa raiz: dataEvento NÃO é preenchido ao construir EventRecords em 6 rotas do routers.ts → fallback 'return true' inclui TODOS os eventos em TODOS os ciclos
- [x] Corrigir: fazer JOIN event_participation + events para obter eventDate e preencher dataEvento
- [x] Corrigir em TODAS as 6 rotas: visaoGeral, porEmpresa, porTurma, porAluno, detalheAluno, portalAluno
- [x] Impacto: afeta contadores de webinars de TODOS os 131 alunos em todos os dashboards e no consolidado

## Módulo Atividades Práticas (04/03/2026)

### Schema e Migração
- [x] Adicionar campos na mentoring_sessions: evidence_link, evidence_image_url, evidence_image_key, submitted_at, validated_by, validated_at
- [x] Criar tabela practical_activity_comments (session_id, author_id, author_role, author_name, comment, created_at)
- [x] Rodar pnpm db:push para aplicar migração

### Backend (APIs tRPC)
- [x] attendance.submitEvidence — aluno envia link e/ou imagem (valida formato URL, tipo/tamanho imagem, grava submitted_at, muda taskStatus para entregue)
- [x] attendance.myTaskComments — aluno visualiza comentários de uma sessão
- [x] mentor.getSubmissionDetail — mentor visualiza evidência do aluno (link + imagem + data envio)
- [x] mentor.validateTask — mentor valida entrega (idempotente, grava validated_by/validated_at, não duplica)
- [x] mentor.addTaskComment — mentor adiciona comentário
- [x] practicalActivities.submissions — admin consulta entregas com filtros (mentor, aluno, status)
- [x] practicalActivities.submissionDetail — admin visualiza evidência
- [x] practicalActivities.addComment — admin adiciona comentário
- [x] Upload de imagem para S3 via storagePut (validar jpg/png/webp, max 5MB)

### Frontend Aluno (aba Tarefas - DashboardMeuPerfil.tsx)
- [x] Evoluir lista: status visual PENDENTE/ENTREGUE/VALIDADA com ações corretas
- [x] Tela de detalhe: campo URL + upload imagem + botão "Enviar Evidência"
- [x] Exibir evidência enviada (link clicável + preview imagem) quando ENTREGUE/VALIDADA
- [x] Seção de comentários (lista com autor + data)

### Frontend Mentor (RegistroMentoria.tsx)
- [x] Visualização de evidência do aluno (link + preview imagem + data/hora envio)
- [x] Botão "Atividade Prática Entregue" (validar) — só aparece se status=ENTREGUE
- [x] Campo e lista de comentários
- [x] Auditoria: mostrar quem validou e quando

### Frontend Admin (nova tela)
- [x] Criar tela AtividadesPraticas.tsx com filtros (mentor, status, busca)
- [x] Contadores: Total / Pendentes / Entregues / Validadas
- [x] Lista de resultados: atividade, aluno, mentor, prazo, status, indicador de atraso
- [x] Detalhe da entrega: evidências + comentários
- [x] Campo para adicionar comentário (admin não valida — aviso exibido)
- [x] Registrar rota no App.tsx e item na sidebar

### Testes
- [x] Testes vitest para submitEvidence (validações de input, URL)
- [x] Testes vitest para validateTask (autenticação, permissões)
- [x] Testes vitest para comentários (validação, permissões admin/mentor)
- [x] Testes vitest para consulta admin (permissões, NOT_FOUND)
- [x] 265/265 testes passando (16 novos testes)
- [x] Bug: Mentor ao logar é redirecionado para /cadastros (página que não está no menu do mentor) — corrigido: proteção de role + badge correto
- [x] Bug: Dialog de Visualizar sessão de mentoria não tem barra de rolagem — conteúdo ultrapassa a tela
- [x] Bug: Mentora Ana Carolina aparece com badge "Gerente" em vez de "Mentor" — corrigido: getRoleBadge agora diferencia mentor (manager+consultorId) de gerente
- [x] Bug: Mentor/Gerente ao logar é redirecionado para /cadastros — corrigido: página /cadastros agora bloqueia acesso de não-admin
- [x] Bug: Aluno ao logar é redirecionado para /cadastros em vez de /meu-dashboard — corrigido: CustomLogin agora redireciona para / após login (em vez de reload) + AdminCadastros redireciona não-admin para página correta
- [ ] Bug: Header do Portal do Aluno mostra "Usuário" em vez de "Aluno" no canto superior direito
- [ ] Exibir mentor(a) de cada aluno na área do administrador (Cadastros e/ou Dashboard)
- [ ] Corrigir header do Portal do Aluno: trocar "Usuário" para "Aluno" no badge/label

## Visibilidade Mentor-Aluno (05/03/2026)
- [x] Coluna Mentor(a) na lista de alunos do Cadastros (backend + frontend)
- [x] Corrigir bug de hooks no AdminCadastros (early return antes dos hooks)
- [x] Filtro por Mentor na lista de alunos do Cadastros
- [x] Garantir que mentor aparece em todas as telas admin relevantes (Visão Geral, detalhe aluno)

## Cadastro Direto de Aluno pelo Admin com Bypass (05/03/2026)
- [x] Analisar schema atual (alunos, assessment, mentoring_sessions, fluxo de entrada)
- [x] Adicionar campo bypass_assessment na tabela alunos (flag para pular etapas)
- [x] Criar formulário "Cadastrar Aluno (Direto)" no Admin com dados cadastrais + vincular mentor
- [x] Implementar procedure backend para cadastro direto com bypass
- [x] Ajustar fluxo de login do aluno: se bypass ativo, redirecionar direto ao agendamento
- [x] Desativar/remover vinculação de mentor na área do mentor (assessment)
- [x] Testes unitários para o novo fluxo
- [x] Validação visual completa do fluxo
- [x] BUG: Aluno novo (UsuarioTeste) não vê o fluxo de onboarding (assessment + escolha de mentor)
- [x] Corrigir redirecionamento: aluno sem mentor deve ir para /onboarding automaticamente

## Ajustes Mentor-Aluno (05/03/2026)
- [x] Desativar/remover vinculação de mentor na área do assessment do mentor
- [x] Adicionar campo de troca de mentor no formulário Editar aluno (AdminCadastros)

## Limpeza de Dados de Teste (05/03/2026)
- [x] Identificar e remover alunos de teste criados por testes unitários do banco de dados

## Bug: Alunos não aparecem como mentorados da Adriana (05/03/2026)
- [x] Investigar por que alunos vinculados à Adriana não aparecem na lista filtrada por mentor (RESOLVIDO: os 4 alunos estão corretamente vinculados e visíveis)

## Bug: Dialog Novo Assessment pequeno e sem Data Fim (05/03/2026)
- [x] Ampliar tamanho do dialog de Novo Assessment para caber todas as colunas
- [x] Garantir que coluna "Data Fim" do micro ciclo apareça visível
- [x] Adicionar barra de rolagem horizontal na tabela de competências do dialog

## Importação de Ciclos - Planilha Atualizada (05/03/2026)
- [x] Analisar estrutura da planilha COMPETENCIAS-JORNADAS atualizada com IDs
- [x] Comparar dados da planilha com dados atuais no banco de dados
- [x] Gerar relatório de impacto das mudanças
- [x] Aplicar mudanças no banco conforme decisão do usuário
- [x] Substituir todos os assessments: apagar assessment_competencias e assessment_pdi e recriar com base na planilha
- [x] Criar turma [2026] SEBRAE Tocantins - Essenciais [BS3] (já existia ID 60001)
- [x] Verificar/criar alunos novos (Ilda Bisinotti, Brenno Soffredi Passoni) - já existiam no banco
- [x] Normalizar 'Gestão de Tempo' para 'Gestão do Tempo' (59 registros usando nome correto)
- [x] Ignorar Usuário Teste (696504) na importação (0 registros)
- [x] Verificar contagens finais: 220 PDIs, 1.423 competências
- [x] AVISO: 4 competências da Jornada Personalizada corretamente importadas (Gestão de Conflitos, Mentalidade Sistêmica, Relacionamentos Conectivos) com datas micro_inicio: 2025-10-15 e micro_fim: 2026-03-30

## Jornada Personalizada - Competências Completas (05/03/2026)
- [x] Verificar competências existentes em cada trilha (72 competências no banco, 36 séries 30xxx e 36 séries 60xxx)
- [x] Competências da Jornada Personalizada já vinculadas aos 4 alunos (Brenno, Diego, Carolina, Etienne)
- [x] Datas de micro ciclo corretas: 2025-10-15 a 2026-03-30
- [x] Limpeza de 18 registros duplicados (competências com IDs 30xxx e 60xxx para o mesmo PDI)
- [x] Contagens finais: 220 PDIs, 1.418 competências, 99 alunos, 5 trilhas

## Login de Alunos com CPF (05/03/2026)
- [x] Adicionar campo CPF na tabela alunos (varchar 14, nullable)
- [x] Importar CPFs dos líderes SEBRAE TO da planilha fornecida: 50 alunos matched por email (são os líderes do Projeto Evoluir)
- [ ] Regra: novos alunos cadastrados com CPF = participam dos dois programas (Ecossistema + Evoluir)
- [x] Regra de login: Se aluno tem CPF cadastrado → login com Email + CPF
- [x] Regra de login: Se aluno NÃO tem CPF → login com Email + ID do aluno (externalId)
- [x] Regra de login: Alunos SEBRAE TO usam EXCLUSIVAMENTE CPF nos dois sistemas
- [x] Atualizar tela de login para suportar os 2 modos (Email+CPF ou Email+ID) com toggle
- [x] Atualizar backend de autenticação: authenticateByEmailCpf refatorado com 4 caminhos (users, aluno CPF, aluno ID, consultor CPF)
- [ ] Permitir admin cadastrar/editar CPF dos alunos
- [x] Testes unitários para os novos fluxos de login (276 testes passando)
- [x] Validação visual do fluxo completo (botão Evoluir CKM visível no menu lateral)
- [x] Adicionar botão/link no menu lateral para Evoluir CKM (https://www.evoluirckm.com) - transit entre os dois sistemas
- [x] Renomear botão Evoluir CKM para "P.D.I Evoluir" e ao clicar sair do sistema e redirecionar para https://www.evoluirckm.com
- [x] BUG CORRIGIDO: Login com CPF - 30 CPFs com zeros à esquerda removidos corrigidos + 50 registros users sincronizados com CPF real da tabela alunos

## Ajustes do Documento (05/03/2026)
- [x] Item 1-2: Micro Ciclo na Trilha Master - já estava funcionando corretamente
- [x] Item 3: Unificar abas Eventos e Webinários em aba única "Eventos" com visual redesenhado
- [x] Item 3a: Permitir aluno marcar presença retroativa em eventos com status "Ausente" (reflexão obrigatória)
- [x] Item 3b: Recalcular indicadores automaticamente ao marcar presença retroativa
- [x] Item 4: Caixa de diálogo de reavaliação - já explicada (alerta automático após 6 sessões)
- [x] Item 5: Perfil do Mentor - foto e minicurrículo implementados (aba no DashboardMentor + card na área do aluno)
- [x] Item 6: Agenda do Mentor - já implementada anteriormente
- [x] Item 7: Corrigir visualização truncada na seleção de trilha dentro do modal de Assessment (removido overflow-hidden do DialogContent no step 1)a Completo do Mentor (05/03/2026)
- [x] Schema: tabela mentor_availability (dias, horários, link Google Meet, status)
- [x] Schema: tabela mentor_appointments (agendamentos feitos pelos alunos)
- [x] Backend: CRUD de disponibilidade do mentor
- [x] Backend: Agendamento de sessão pelo aluno (escolher horário disponível)
- [x] Backend: Listar agendamentos do mentor (visualizar agendas preenchidas pelos alunos)
- [x] Frontend Mentor: Página de Configurações completa com abas:
  - [x] Aba Perfil: currículo, foto
  - [x] Aba Agenda: cadastrar dias/horários disponíveis + link Google Meet
  - [x] Aba Mentorias: listar mentorias realizadas (já existia como Histórico de Sessões)
  - [ ] Aba Relatórios: gerar relatório com suas mentorias
  - [ ] Aba Avisos: visualizar avisos do administrador
  - [x] Aba Agendamentos: visualizar agendas preenchidas pelos alunos + criar sessão de grupo
- [x] Frontend Aluno: agendamento de sessão escolhendo horário disponível do mentor
- [x] Agendamento de Grupo (Opção 2): Mentor define sessão de grupo com data/horário + alunos convidados, alunos confirmam presença (sim/não)
- [x] Frontend Aluno: agendamento de sessão individual + confirmação de convites de grupo
- [ ] Fluxo de presença: antes de marcar presença, aluno deve assistir o vídeo primeiro (botão Assistir + botão Marcar Presença)
- [ ] Unificar Eventos Disponíveis + Histórico em lista única: Nome | Data | Link (Assistir) | Presente/Ausente | Marcar Presença
- [ ] Adicionar campo videoLink na tabela events para link de gravação

## Unificação da Aba Eventos no Dashboard do Aluno (05/03/2026)
- [x] Adicionar campo videoLink na tabela events (migração aplicada)
- [x] Criar função updateEventVideoLink no db.ts
- [x] Criar rota admin attendance.updateVideoLink para atualizar link de vídeo dos eventos
- [x] Refatorar getWebinarsPendingAttendance para retornar TODOS os eventos (não apenas pendentes) com status, videoLink
- [x] Unificar seções "Próximos Eventos", "Pendentes de Presença", "Histórico de Eventos" e "Gravações Disponíveis" em uma lista única
- [x] Lista unificada mostra: Nome do Evento | Data | Botão Assistir (link do vídeo) | Status (Presente/Ausente) | Botão Marcar Presença
- [x] Ordenação: ausentes primeiro, depois por data decrescente
- [x] Testes vitest para attendance.pending, attendance.updateVideoLink e attendance.markPresence

## Bug: Alerta de Case de Sucesso Pendente duplicado (05/03/2026)
- [x] Corrigir alerta "Entrega de Case de Sucesso Pendente" que aparece duplicado 6 vezes no Portal do Aluno

## Bug Crítico: Lista de eventos vazia + Alerta duplicado (05/03/2026)
- [x] Lista de eventos na aba Eventos do Portal do Aluno está vazia - dados não carregam
- [x] Implementar tabela conforme layout: NOME DO WEBINÁRIO | DATA | PRESENTE/AUSENTE | LINK DO EVENTO | MARCAR PRESENÇA
- [x] Corrigir alerta Case de Sucesso Pendente duplicado 6x (deduplicar por trilhaNome)

## Reformular Case de Sucesso + Corrigir Eventos (05/03/2026)
- [x] Reformular alerta Case de Sucesso: convite para compartilhar experiências + explicar bônus + data limite (final do ciclo) + botão upload arquivo
- [x] Deduplicar alerta por trilha (aparece 6x, deveria ser 1x)
- [x] Corrigir lista de eventos vazia (events.programId=NULL vs aluno.programId definido)

## Bug: Botão Marcar Presença inconsistente (05/03/2026)
- [x] Botão "Marcar Presença" corrigido: só aparece em eventos Ausentes que TEM link de vídeo (regra atualizada pelo usuário)

## Ajuste: Link de eventos (05/03/2026)
- [x] Quando evento não tem link de vídeo, mostrar "Link será disponibilizado em breve" em vez de esconder
- [x] Botão Marcar Presença deve aparecer em TODOS os eventos Ausentes, independente de ter link (REVISADO: só aparece com link)
- [x] Botão Marcar Presença só aparece quando o evento TEM link de vídeo (se não tem link, mostra apenas Ausente + "Link em breve")

## Remover duplicidade de presença no Mural (05/03/2026)- [x] Remover modal de "Registrar Presença e Reflexão" do Mura- [x] Remover seção "Pendentes de Presença" com botões "Presença" do Mural
- - [x] Manter alerta "Não deixe de marcar sua presença" com botão que redireciona para aba Eventos no Portal do AlunoAluno

## Alerta de mentorias faltantes na aba Mentorias (05/03/2026)
- [x] Adicionar pop-up/alerta "Faltam X mentorias para finalizar a sua jornada" na aba Mentorias do Portal do Aluno

## Card ECO_EVOLUIR (05/03/2026)
- [x] Adicionar card ECO_EVOLUIR no Mural com logo, título "ECO_EVOLUIR - Acesse aqui e realize seu PDI" e link para https://www.evoluirckm.com
- [x] Adicionar acesso ao ECO_EVOLUIR na área do aluno (Portal do Aluno)

## Card B.E.M. Área de Aulas (05/03/2026)
- [x] Adicionar card B.E.M. "Acesse a Área de Aulas" com logo B.E.M. e link para https://sebraeto.competenciasdobem.com.br no Mural e Portal do Aluno

## Visão do Gerente de Empresa - Papel Duplo (05/03/2026)
- [ ] Analisar estrutura atual (schema, roles, routers) para definir arquitetura
- [ ] Proposta técnica do papel duplo (Aluno + Gerente) aprovada pelo usuário
- [ ] Backend: schema, role gerente, routers e lógica de acesso
- [ ] Frontend: dashboard do Gerente com visão da empresa e empregados
- [ ] Alternância de papel (Aluno ↔ Gerente) na interface
- [ ] Testes vitest para funcionalidades do Gerente

## Visão Dupla Gerente - Implementação Detalhada (05/03/2026)
- [x] Backend: criar procedure para verificar se manager também é aluno (isAlsoStudent)
- [x] Backend: ajustar procedures do aluno para aceitar managers com alunoId
- [x] Frontend: criar RoleContext com estado activeRole (aluno/gerente)
- [x] Frontend: criar componente RoleSwitcher (botão alternância no header)
- [x] Frontend: ajustar Home.tsx para redirecionar gerente-aluno ao modo Aluno por padrão
- [x] Frontend: ajustar AlunoLayout para mostrar RoleSwitcher quando user é manager+aluno
- [x] Frontend: ajustar DashboardLayout para mostrar RoleSwitcher quando user é manager+aluno
- [x] Vincular Vera Braga (SEBRAE TO) como manager com alunoId=30078
- [x] Vincular Joseane (SEBRAE TO) como manager com alunoId=30066
- [x] Criar user manager para Fabio (SEBRAE ACRE) com alunoId=30001
- [x] Criar user manager para Carolina (EMBRAPII) com alunoId=30036
- [x] Admin: seção "Gerentes de Empresa" nos Cadastros (atribuir aluno como gerente, cadastrar gerente puro, remover/alterar gerentes)
- [x] Testes vitest para funcionalidades do papel duplo
- [x] Bug: texto "P.D.I Evoluir" em vermelho sobreposto ao item "Relatórios" no menu lateral do admin
- [x] Melhorar tab Gerentes no Cadastro: exibir nome completo, email, CPF, ID do mentor vinculado ao aluno
- [ ] Adicionar tooltip com explicação do cálculo em cada card de indicador (Total de Alunos, Nota Média, Melhor Nota, Precisam Atenção, Mentorias, Atividades, Engajamento, Competências, Eventos)
- [ ] Garantir que DashboardGestor usa exatamente a mesma lógica de cálculo do DashboardAluno (ciclos finalizados, sem fallback para em andamento)
- [ ] Filtro por turma independente de trilha no DashboardGestor

## Bloco 1 - Reformulação Área Gerencial (Indicadores V2, Filtros, Radar)
- [x] Analisar componentes e endpoints existentes reutilizáveis para o Bloco 1
- [x] Substituir 5 cards antigos pelos 7 indicadores V2 (reutilizar IndicadorCard, InfoTooltip, INDICADORES_INFO)
- [x] Cards de resumo por turma (Total Alunos, Nota Média, Melhor Nota, Precisam Atenção) - não misturar turmas
- [x] Filtros avançados: por turma (parcial - turma e aluno implementados, ciclo/jornada no Bloco 2)
- [x] Radar de Performance agregado por turma (reutilizar formato do aluno com 5 eixos V2)
- [x] Tooltips de explicação em todos os cards
- [x] Substituir banner de presença por aviso simples "Clique aqui e veja se não tem eventos pendentes" (sem contagem)
- [x] Remover "Registro de Mentoria" do menu lateral da visão gerencial (é página de Mentor/Admin)
- [x] Remover "Assessment / PDI" do menu lateral da visão gerencial (é página de Mentor/Admin)
- [x] Card Engajamento Final no Dashboard Gestor: mostrar geral da empresa + um card por turma
- [x] Plano Individual também deve sair do menu do gerente (é de Mentor/Admin)
- [x] Remover gráfico pizza "Distribuição por Classificação" do Dashboard Gestor
- [x] Gráfico "Performance por Turma" deve mostrar o ciclo junto com o nome da turma
- [x] Botão "Ver detalhes" na lista de alunos do Dashboard Gestor não está funcionando - corrigir
- [x] Filtro de turma no Dashboard Gestor deve agrupar por turma base (sem separar por jornada/ciclo BS1, BS2, BS3)
- [x] Remover card "Precisam Atenção" do Dashboard Gestor
- [x] Mudar modelo do gráfico "Performance por Turma" (nomes muito longos com ciclo)
- [x] Gerente só pode ver alunos da empresa dele no Dashboard Aluno (não "Todas as empresas")
- [x] Corrigir "Ciclo Atual" mostrando "Nenhum ciclo" no Dashboard do Aluno

## AJUSTE2 - Correções Relatórios e Dashboard Gestor
- [x] Incluir visão de jornadas/ciclos com datas de início e fim no Dashboard Gestor
- [x] Incluir filtro de aluno na página de Relatórios para gerar relatório individual
- [x] Corrigir botão Baixar relatório no histórico de relatórios (backend gera Excel real e faz upload para S3)
- [x] Alterar texto do Relatório Individual para "Relatório Individual, mostra a performance do aluno"
- [x] Corrigir cards Templates Rápidos (Relatório Semanal preenche form, Performance da Equipe e Executivo geram automaticamente)
- [x] Corrigir filtro de turma: TURMA = BS1, BS2, BS3 (jornada). TRILHA = Basic, Essential, Master, Visão de Futuro, etc. Filtro deve mostrar apenas BS1/BS2/BS3
- [x] Adicionar filtro por trilha como segundo nível de filtro dentro da turma selecionada
- [x] Ajustar cards de Engajamento por Turma para usar nomenclatura BS1/BS2/BS3
- [x] Adicionar gráfico de timeline/execução dos ciclos para o gestor saber quando todos os ciclos terminam

## Limpeza de Dados (06/03/2026)
- [x] Identificar e remover todos os alunos de teste do banco de dados (116 alunos vitest removidos, 3 manuais mantidos)

## Bug Ranking Discrepante (06/03/2026)
- [x] Investigar discrepância: Joseane aparece 21º no Portal do Aluno e 2º no Dashboard Gestor (causa: V1 vs V2)
- [x] Unificar cálculo: meuDashboard (Portal do Aluno) agora usa V2 para ranking
- [x] Unificar cálculo: ranking no meuDashboard usa calcularIndicadoresTodosAlunos (V2) para todos os colegas
- [x] Atualizar frontend DashboardMeuPerfil para consumir dados V2 (classificação usa V2)
- [x] Limpar todos os alunos de teste do banco de dados (241 users vitest + 9 relatórios teste removidos)

## Relatório Gerencial com Indicadores V2 (06/03/2026)
- [x] Incluir todos os 7 indicadores V2 (Webinars, Avaliações, Competências, Tarefas, Engajamento, Case, Engajamento Final) de cada aluno no Relatório Gerencial e Administrativo Excel (3 abas: Equipe/Indicadores, Mentorias, Indicadores por Ciclo)

## Remoção do Ranking do Portal do Aluno (06/03/2026)
- [x] Remover bloco de ranking (Xº lugar de Y alunos na empresa) da página DashboardMeuPerfil

## Correções Página Relatórios (06/03/2026)
- [x] Remover os 2 templates rápidos (Relatório Semanal e Performance da Equipe)
- [x] Adicionar botão recolher/expandir no histórico de relatórios
- [x] Corrigir bug: relatórios já gerados mostram "Processando..." em vez de "Baixar" (adicionado refetchInterval 5s)
- [x] Adicionar coluna "Data de Emissão" nos relatórios Excel gerados (todas as abas)

## Troca de Logo (06/03/2026)
- [x] Upload do novo logo (B.E.M com cérebro) para CDN
- [x] Trocar logo na página de login (arquivo public/logo-bem-full.d3b12449.png substituído)
- [x] Trocar logo na sidebar (DashboardLayout) (arquivo public/logo-bem-icon.d3b12449.png substituído)
- [x] VITE_APP_LOGO não é usado diretamente no código (logo é referenciado via arquivos public/)
- [x] Trocar logo em DashboardMeuPerfil.tsx e MuralAluno.tsx (CDN URL atualizada)

## Bugs Reportados (06/03/2026 - Lote 2)
- [x] Bug 1: Datas de fim de trilha incorretas no Portal do Aluno - INVESTIGADO: dados no banco estão corretos (ciclos V2 com datas variadas: 31/10, 30/11, 31/12/2025, 31/03/2026). Os ciclos em andamento realmente terminam em 31/03/2026. A data macro da trilha é 30/03/2026.
- [x] Bug 2: Botão Enviar Case não funciona - CORRIGIDO: alertaCasePendente não incluía trilhaId, fazendo caseTrilhaId ficar null e handleCaseSubmit retornar silenciosamente. Adicionado trilhaId ao tipo e ao endpoint meuDashboard com mapeamento trilhaNome→trilhaId. Também adicionado !caseTrilhaId ao disabled do botão.
- [x] Bug 3: Filtro BS1 no Dashboard Gestor não mostra trilha Essencial - CORRIGIDO: filtro de trilha agora extrai trilhas reais dos alunos via assessment_pdi (campo trilhasReais) em vez de extrair do nome da turma.
- [x] Bug 4: Filtro BS3 no Dashboard Gestor não mostra trilha Essencial - CORRIGIDO: mesma correção do Bug 3 (trilhasReais via assessment_pdi).

## Demonstrativo de Sessões de Mentoria (06/03/2026)
- [ ] Criar endpoint backend para listar sessões de mentoria por aluno com contagem de realizadas/faltantes
- [ ] Criar página DemonstrativoMentorias com filtros (empresa, turma, trilha) e tabela detalhada
- [ ] Integrar na navegação do gestor (sidebar)
- [ ] Mostrar: nome aluno, empresa, turma, sessões realizadas, sessões faltantes, total contratadas, progresso visual

## Bug: Área de cadastro do mentor não aparece (06/03/2026)
- [ ] Investigar por que a área de cadastro do mentor (currículo, foto, agenda) não aparece na visualização do mentor
- [ ] Corrigir visibilidade da área de cadastro do mentor

## Bug: Agenda de reunião em grupo - nomes dos mentorados não aparecem (06/03/2026)
- [x] Na tela de criação de agenda/reunião em grupo, ao selecionar convidados, aparece somente o nome da empresa e não o nome dos mentorados. CORRIGIDO: campo usava aluno.name mas backend retorna aluno.nome. Layout melhorado com nome em destaque e empresa abaixo, max-h-64, melhor espaçamento.

## Card ECO_EVOLUIR - Filtro por empresa (06/03/2026)
- [x] Fazer o card ECO_EVOLUIR aparecer apenas para alunos da empresa SEBRAE TO no Portal do Aluno - CORRIGIDO: condição adicionada em DashboardMeuPerfil.tsx (aluno.programa contém 'SEBRAE' e 'TO') e MuralAluno.tsx (user.programId === 17)

## Substituição do Logo - eco do bem (06/03/2026)
- [x] Fazer upload do novo logo eco do bem para CDN
- [x] Substituir logo em todos os locais: menu lateral (DashboardLayout), tela de login/cadastro (CustomLogin), header/footer do aluno (AlunoLayout), mural (MuralAluno), portal do aluno (DashboardMeuPerfil)

## Bug: Discrepância card vs lista de eventos (06/03/2026)
- [x] Card de resumo mostra 0 Ausências mas lista mostra 3 eventos com status Ausente para Carolina Borges Moreira. Indicador 1 (Webinars) também mostra 100%. Unificar todas as fontes: card, indicador e lista devem usar a mesma lógica (todos os eventos do programa cruzados com participações).

## Unificação de Fontes de Dados de Eventos (06/03/2026)
- [x] Unificar 3 fontes de dados de eventos para uma única fonte (todos os eventos do programa)
- [x] Atualizar indicatorsCalculatorV2.ts para receber totalEventosPrograma e calcular ausências corretamente
- [x] Atualizar endpoint meuDashboard para passar total de eventos do programa ao calculador
- [x] Atualizar cards de resumo (Presenças/Ausências/Total) para usar dados consistentes com a lista
- [x] Garantir que Indicador 1 (Webinars) use a mesma lógica
- [x] Verificar que Dashboard Gestor e Dashboard Aluno também ficam consistentes

## Bug: Unificação de eventos não refletindo na interface (06/03/2026)
- [x] Investigar por que os dados de eventos não mudaram no portal do aluno após publicação
- [x] Causa raiz: eventos na tabela `events` têm programId=NULL, getEventsByProgram(18) retornava 0 resultados
- [x] Criação de getEventsByProgramOrGlobal() que busca eventos do programa OU com programId NULL
- [x] Correção de getAlunoDetalheCompleto() no db.ts para incluir todos os eventos do programa (4ª fonte de dados identificada)
- [x] Verificado visualmente: Carolina agora mostra 32 total, 23 presenças, 72% taxa, 9 ausências

## Bug: Evento 2025/19 sem link no portal do aluno (06/03/2026)
- [x] Evento 2025/19 - Estrutura e Conceitos de Projetos de Inovação com Emerson Dias aparece com "Link em breve" e status "Ausente" no portal do aluno, mas tem link cadastrado na área de webinars do admin
- [x] Causa raiz: matching de títulos entre tabelas events e scheduled_webinars falhava por diferenças de traços (– vs -), espaços e prefixo "Aula 01"
- [x] Solução: normalização de títulos tolerante + fallback sem prefixo "aula XX" no getWebinarsPendingAttendance
- [x] Verificado: todos os 4 eventos duplicados agora fazem match e retornam o youtubeLink correto

## Bug: Eventos duplicados e Link em breve persistente (06/03/2026)
- [x] 4 eventos duplicados do 2025/19 Estrutura e Conceitos aparecem na lista do portal do aluno (deveria ser apenas 1)
- [x] 2 dos 4 eventos duplicados ainda mostram "Link em breve" mesmo após correção de matching
- [x] Investigar se a correção foi publicada ou se há problema no matching em produção
- [x] Deduplicar eventos por título normalizado em getEventsByProgramOrGlobal (centralizado)
- [x] Deduplicar eventos em getWebinarsPendingAttendance e getAlunoDetalheCompleto
- [x] 32 eventos -> 28 após deduplicar (4 duplicados do 2025/19 viram 1)

## Bug: Diversos webinars sem link no portal do aluno (06/03/2026)
- [x] Auditoria completa: comparar TODOS os títulos de events vs scheduled_webinars para identificar falhas de matching
- [x] Corrigir matching para que TODOS os webinars com link cadastrado mostrem o link no portal
- [x] Causa raiz: extractCore não removia "- 01 -" no meio do título (ex: "O Código de Aprendizagem - 01 - O Preparo")
- [x] Solução: regex melhorada + fallback de similaridade >= 70%
- [x] Resultado: 32/32 eventos com link (29 exato + 3 parcial), 0 sem link

## Bug: Vanessa não aparece no dropdown de seleção de aluno ao incluir texto de mentoria (06/03/2026)
- [ ] Investigar por que Vanessa Bertholdo Vargas não aparece no dropdown de seleção ao incluir texto de mentoria na tela de Sessões de Mentoria

## Bug: Vanessa Bertholdo Vargas com todos indicadores zerados no Portal do Aluno (06/03/2026)
- [ ] Investigar por que Vanessa aparece com 0% em todos os indicadores mesmo tendo 4 sessões de mentoria e participações em eventos

## Melhorias no Congelamento de PDI (06/03/2026)
- [x] Adicionar coluna 'motivoCongelamento' na tabela assessment_pdi
- [x] Adicionar colunas 'descongeladoEm' e 'descongeladoPor' na tabela assessment_pdi
- [x] Atualizar endpoint congelar para exigir motivo obrigatório
- [x] Criar endpoint descongelar para reverter congelamento
- [x] Adicionar diálogo de confirmação com campo de motivo no frontend
- [x] Adicionar botão de descongelar no frontend para PDIs congelados
- [x] Mostrar informações de congelamento (quem, quando, motivo) no card do PDI
- [x] Escrever testes para congelar e descongelar

## Fluxo de Congelamento de PDI (06/03/2026)
- [x] Adicionar campo motivoCongelamento na tabela assessment_pdi (migration)
- [x] Adicionar campos descongeladoEm e descongeladoPor na tabela assessment_pdi
- [x] Criar diálogo de confirmação antes de congelar (com campo de motivo obrigatório)
- [x] Adicionar botão "Descongelar" no Assessment.tsx (visível para PDIs congelados)
- [x] Atualizar endpoint congelarPDI para receber e salvar motivo
- [x] Criar endpoint descongelarPDI
- [x] Exibir info de congelamento (data, quem congelou, motivo) no card expandido
- [x] Testes automatizados para congelar/descongelar/campos
- [x] Aviso de PDI congelado no dashboard do aluno (admin/gestor)
- [x] Aviso de PDI congelado no dashboard individual do aluno (meu perfil)
- [x] Aviso de PDI congelado nas listagens de alunos (visão geral, por empresa)

## Bug: Mensagem "Assessment PDI não cadastrado" aparece incorretamente para Vanessa (06/03/2026)
- [x] Investigar por que a tela P.D.I Evoluir mostra "Assessment PDI não cadastrado" para Vanessa que tem assessments cadastrados
  - Causa: getSessionProgressByAluno filtrava apenas status='ativo', ignorando PDIs congelados
- [x] Corrigir a lógica de verificação de assessment na tela P.D.I Evoluir
  - Agora retorna flag todosCongelados quando só há PDIs congelados
  - Mensagem diferenciada: "Trilhas congeladas" (azul) vs "PDI não cadastrado" (amarelo)
- [x] Corrigir escapes Unicode (\\u00e3o, \\u00e1, etc.) nos textos de aviso de congelamento

## Uniformização do Cálculo de Engajamento Final
- [x] Investigar como cada tela calcula o Engajamento Final / nota
  - Ambas as telas (Portal do Aluno e Gestora) já usam o calculador V2 com média dos 5 indicadores
  - A diferença era causada pelos microTermino incorretos da turma BS2 (ciclos com datas de fim muito longas)
- [x] Atualizar microTermino de 264 registros da turma BS2 conforme planilha
- [x] Verificar consistência: ambos os cálculos agora retornam 74.4% (nota 7.44) para Joseane
- [x] Garantir que a nota na visão da gestora (escala 0-10) corresponda ao mesmo cálculo
## Migração V1 → V2: Unificar cálculo de performance em todas as telas (06/03/2026)
- [x] Migrar DashboardVisaoGeral de V1 para V2 (média de 5 indicadores)
- [x] Migrar DashboardEmpresa de V1 para V2 (média de 5 indicadores)
- [x] Migrar PorEmpresa de V1 para V2 (média de 5 indicadores)
- [x] Migrar PlanoIndividual de V1 para V2 (atualizar label "Média dos 6" → "Média dos 5")
- [ ] Atualizar AdminDashboard para usar cálculo dinâmico V2 (remover hardcoded 81.8%)
- [x] Escrever testes de consistência V1→V2 (7 testes passando)
- [x] Publicar versão com migração V1→V2 completa (06/03/2026)
## Bug: Divergência 73% vs 66% entre Dashboard Gestora e Portal do Aluno (06/03/2026)
- [x] Investigar por que Dashboard Gestora mostra 73% e Portal do Aluno mostra 66% para Joseane
  - Causa: endpoints porEmpresa/visaoGeral/dashboardGestor não incluíam dataSessao nas mentorias
  - Sem dataSessao, TODAS as sessões eram incluídas em TODOS os ciclos (9 sessões por ciclo em vez de 1)
- [x] Corrigir para que ambas as telas mostrem o mesmo valor (74.4% em ambas)
## Bug: Linha "Hoje" no gráfico Timeline aparece em maio em vez de março (07/03/2026)
- [x] Corrigir posição da linha "Hoje" no gráfico de Timeline de Execução (removido offset +4rem que deslocava a linha para a direita)
## Ajuste: Tabela Sessões por Aluno (demonstrativo-mentorias)
- [x] Reduzir tamanho da fonte e espaçamento da tabela Sessões por Aluno
- [x] Adicionar barra de rolagem horizontal na tabela
## Sistema de Metas por Competência
- [ ] Criar tabelas no banco: metas (vinculadas a competência/aluno), acompanhamento_metas (mensal)
- [ ] Endpoint tRPC para CRUD de metas (criar, listar, atualizar status)
- [ ] Tela da mentora: definir metas por competência (selecionar da biblioteca de ações ou campo livre)
- [ ] Tela de acompanhamento mensal: mentora marca cumprida/não cumprida
- [ ] Card de metas no Portal do Aluno (holofote com lista de metas e progresso)
- [ ] Card de metas no Mural do aluno
- [ ] Cálculo automático: % atingida por competência e % total do aluno
- [ ] Exibição do progresso de metas no Dashboard do Gestor

## Bug Reportado (07/03/2026) - Perfil da Mentora Andressa
- [x] Bug: Mentora Andressa não consegue atualizar perfil - erro 404 (link 'Meu Perfil' no dropdown da sidebar apontava para /individual que não existe; corrigido para direcionar conforme role do usuário)

## Substituir Atualização de Nível por Resumo de Metas (07/03/2026)
- [x] Remover alerta de "Reavaliação de Competências Pendente" e botão "Atualizar Níveis"
- [x] Substituir por resumo de metas do aluno (metas definidas, status, % atingimento)
- [x] Adicionar botão para ir direto à página de Metas do aluno selecionado

## Gráfico de Evolução de Metas no Dashboard do Aluno (07/03/2026)
- [x] Criar endpoint backend metas.minhas para o aluno logado
- [x] Criar página dedicada MinhasMetasAluno.tsx (visão somente leitura)
- [x] Cards de resumo (Total, Cumpridas, Não Cumpridas, % Atingimento)
- [x] Lista de competências com metas e histórico de acompanhamento
- [x] Gráfico de evolução por competência (barras horizontais)
- [x] Adicionar rota e link na sidebar do aluno
- [x] Testar visualização

## Seção de Metas no Dashboard do Gestor (07/03/2026)
- [x] Criar endpoint backend para visão consolidada de metas de todos os alunos
- [x] Criar página/seção de Metas no dashboard do gestor
- [x] Visão consolidada: cards de resumo geral + tabela com todos os alunos e % atingimento
- [x] Visão individual: ao clicar em um aluno, ver detalhes das metas por competência
- [x] Gráfico consolidado de evolução
- [x] Adicionar link na sidebar do gestor
- [x] Testar visualização

## Filtro de Metas no Dashboard do Gestor + Alertas Trimestrais (07/03/2026)
- [x] Adicionar filtro Com metas/Sem metas/Todos na página MetasGestor
- [x] Criar endpoint backend para verificar necessidade de atualização de metas (3 sessões ou 3 meses)
- [x] Alerta na tela de Registro de Mentoria para a mentora (atualizar metas a cada 3 meses/sessões)
- [x] Alerta no dashboard/minhas metas do aluno (lembrete de atualizar metas com a mentora)
- [x] Testar alertas e filtros

## Correções do Documento de Solicitações (07/03/2026)
- [x] 01a: Renomeado Maria Teste da Silva (id=90013) para Dina Makiyama (email: dina@ckmtalents.net, programa: BANRISUL, mentora: Adriana/consultorId=39)
- [x] 01b: Corrigido permissão endpoints plano individual (adminProcedure → protectedProcedure) - addCompetencia, addMultiple, remove, update, clear
- [x] 04: Corrigir lista de ações da biblioteca que não abre (corrigido: nomes de colunas no schema Drizzle estavam em camelCase mas DB usa snake_case - oQueFazer→o_que_fazer, oQueGanha→o_que_ganha)
- [x] 05: Corrigir lookup de consultor por loginId/openId (corrigido: adicionado fallback por ctx.user.consultorId em 6 endpoints - mentor.create, validateTask, addComment, submissions, metas.create, metas.acompanhar)
- [x] Deletar usuário de teste maria teste3 (id=90014)
- [x] Corrigir possível erro getFullYear na função alertaAtualizacao (SQL MAX retorna string, não Date)
- [x] Bug: Dina Makiyama não aparece na lista de alunos da Adriana na tela de Assessment/PDI (corrigido: getAlunosByConsultor e getProgramsByConsultor agora incluem alunos vinculados diretamente pelo consultorId, não apenas por sessões de mentoria)
- [x] Limpeza: desativados registros de teste "Test Turma Null" e duplicata "Maria Dinamar" (id=240001)
- [x] Adicionar campo CPF no formulário de edição de aluno (Cadastros)
- [x] Reformular aba Alunos no Cadastros: mostrar TODOS os alunos (não apenas email_cpf)
- [x] Exibir dados completos dos alunos: Nome, Email, CPF, Empresa, Mentor, Turma, Status
- [x] Adicionar campo CPF no formulário de edição de aluno com validação e formatação
- [x] Lista de alunos sempre em ordem alfabética
- [x] Adicionar busca/filtro de alunos por nome
- [x] Limpar registros de teste do banco de dados (54 registros desativados: Aluno Direto Test, Test Turma Null/Number/Undefined, Maria Dinamar, Usuário Teste)

## Ajuste 8 (07/03/2026)
- [x] Corrigir diálogo "Novo Assessment" cortado na parte superior, sem barra de rolagem vertical e horizontal (adicionado ScrollArea com barras vertical/horizontal, max-h-[85vh], centralização correta)
- [x] Corrigir formulário de edição de aluno (Cadastros) sem barra de rolagem lateral (adicionado overflow-y-auto, max-h-[85vh], footer fixo com borda)
- [x] URGENTE: Corrigir diálogo Novo Assessment - removido style inline conflitante, restaurado posicionamento padrão do Radix Dialog, mantido max-h-[90vh] com overflow-hidden e ScrollArea com barras horizontal/vertical
- [x] Transformar criação de Assessment de diálogo modal para página inteira dedicada (NovoAssessment.tsx com stepper visual de 3 steps em tela cheia, rota /assessment/novo/:alunoId)

## Simplificação do Assessment (07/03/2026)
- [x] Remover Step 3 do NovoAssessment (níveis numéricos subjetivos) - simplificado para 2 steps (Configuração + Competências)
- [x] Progresso calculado automaticamente pelas metas/desafios cumpridos (já existia no sistema)

## Melhoria no Diálogo de Nova Meta (07/03/2026)
- [x] Mostrar nome da competência no card/diálogo de Nova Meta (badge com ícone Target e nome da competência)
- [x] Adicionar botão "Sugerir com IA" que analisa a competência e sugere desafios de desenvolvimento
- [x] Criar endpoint backend para sugestão de metas com IA (usando invokeLLM)
- [x] Adicionar barra de rolagem ao diálogo de Nova Meta (max-h-[85vh] overflow-y-auto)

## Indicadores de Destaque - Engajamento e Desenvolvimento (07/03/2026)
- [x] Criar card de Indicador de Engajamento (meta 80%) com explicação - visão gestor e aluno
- [x] Criar card de Indicador de Desenvolvimento (meta 100%) com explicação - visão gestor e aluno
- [x] Posicionar indicadores no topo das páginas Assessment/Metas (gestor) e MinhasMetasAluno/Dashboard (aluno)
- [x] Componente DualIndicators reutilizável com ProgressRing, StatusBadge e DetailBar
- [x] Integrado em MetasDesenvolvimento.tsx (visão mentor/admin)
- [x] Integrado em MinhasMetasAluno.tsx (visão aluno - metas)
- [x] Integrado em DashboardMeuPerfil.tsx (visão aluno - dashboard principal)

## Bug: Desenvolvimento mostra 100% sem metas (07/03/2026)
- [x] Investigado: não era bug - Joseane tinha 1 meta lançada por engano (excluída via limpeza de dados)

## Limpeza de Dados (07/03/2026)
- [x] Excluir meta lançada por engano da Joseane (meta id=1, alunoId=30066) e acompanhamento associado

## Detalhamento de Tarefas na visão do aluno (07/03/2026)
- [x] Exibir lista detalhada de atividades por sessão com número, data e status (Entregue/Não Entregue)
- [x] Funcionalidade de envio de link da tarefa na nuvem (Google Drive, OneDrive, etc.)
- [x] Explicação de que a tarefa deve estar salva na nuvem e compartilhada com o email do mentor
- [x] Integrar com o email do mentor para exibir na instrução de compartilhamento

## Visualização de Tarefas na visão do Mentor (07/03/2026)
- [ ] Adicionar aba/seção de tarefas por sessão na visão do mentor ao visualizar um aluno
- [ ] Mostrar número da sessão, data, status de entrega (Entregue/Não Entregue) para cada aluno
- [ ] Exibir link da tarefa enviado pelo aluno (quando disponível)
- [ ] Resumo de entregas por aluno (X de Y atividades entregues)

## Bug: Ind. 4 Tarefas mostra 50% mas deveria ser ~87,5% (07/03/2026)
- [ ] Investigar discrepância no cálculo do Ind. 4: Tarefas da Joseane (7 de 8 entregues = 87,5%, mas mostra 50%)
- [ ] Corrigir lógica de cálculo se necessário

## Cálculo Ind. 1 e Ind. 4 por Macrociclo (07/03/2026)
- [ ] Alterar Ind. 4 (Tarefas) para calcular pelo macrociclo em vez de microciclo
- [ ] Alterar Ind. 1 (Webinars) para calcular pelo macrociclo em vez de microciclo
- [x] Atualizar explicação/tooltip dos cards de Ind. 1 e Ind. 4 no frontend para refletir cálculo por macrociclo
- [x] Testar que o cálculo da Joseane reflete corretamente as entregas pelo macrociclo

## Correção Ind. 4: Ignorar sessões de assessment (07/03/2026)
- [x] Alterar conversão de sessões para MentoringRecord: forçar sem_tarefa quando isAssessment=1

## Explicação detalhada do cálculo nos cards (07/03/2026)
- [x] Adicionar explicação clara de como cada indicador é calculado nos tooltips/cards do aluno (InfoTooltip.tsx + DualIndicators.tsx)
- [x] Adicionar explicação clara de como cada indicador é calculado nos tooltips/cards do gestor (INDICADORES_INFO propagado automaticamente)

## Menu do Aluno (07/03/2026)
- [x] Mover "Integração" para primeira posição no menu do aluno
- [x] Renomear "Integração" para "Onboarding"

## Bug: Trilhas mostrando "Finalizada" incorretamente (07/03/2026)
- [x] Investigar lógica que determina status "Finalizada" das trilhas - labels estavam invertidos
- [x] Corrigir DashboardMeuPerfil.tsx: ativo="Em Andamento", congelado="Finalizada"
- [x] Corrigir Assessment.tsx: congelado="Finalizada", default="Em Andamento"

## Bug: Modal Nova Meta abre com dados da meta anterior (07/03/2026)
- [x] Modal "Nova Meta" abre com dados preenchidos da meta anterior quando já existe meta para a competência - deve abrir em branco
- [x] Adicionar instrução clara para a mentora: meta é um desafio maior, não confundir com tarefa
- [x] Orientar que metas devem ser inseridas conforme assessment realizado, não sendo obrigatório para todas as competências

## Bug: Botão de cadastrar aluno para Onboarding sumiu (07/03/2026)
- [x] Botão de cadastrar aluno para Onboarding desapareceu da página de Cadastros - restaurar

## Feature: Envio de email de convite ao cadastrar aluno via Onboarding (07/03/2026)
- [ ] Configurar Resend API e DNS (ADIADO - aguardando configuração DNS pelo usuário)
- [ ] Integrar envio de email no endpoint createAluno (ADIADO)
- [x] Corrigir createAluno para também criar registro na tabela users (login)

## Feature: Teste DISC + Régua de Autopercepção no Onboarding (07/03/2026)
- [x] Criar tabelas no banco: disc_respostas, disc_resultados, autopercepção_competencias
- [x] Criar endpoints backend: salvar respostas DISC, calcular perfil, salvar autopercepção, buscar resultados
- [x] Implementar tela do teste DISC no Onboarding (28 afirmações, escala 1-5)
- [x] Implementar tela da Régua de Autopercepção no Onboarding (36 competências, slider 1-5)
- [x] Implementar Relatório de Autoconhecimento visual na plataforma (perfil DISC + mapa competências)
- [x] Opção de download do relatório em PDF
- [x] Painel de contribuições da mentora no Assessment (complementos ao relatório do aluno)
- [x] Contribuições da mentora aparecem no relatório do aluno no Portal

## Melhoria: Explicação das competências na Régua de Autopercepção (08/03/2026)
- [x] Adicionar descrição explicativa de cada competência (o que é e como impacta no dia a dia) na Régua de Autopercepção
- [x] Filtrar Régua de Autopercepção para mostrar apenas Basic, Essential e Master (remover Jornada Personalizada, Alinhamento Inicial, Jornada do Futuro I.A, Visão de Futuro)

## Melhoria: Relatório de Autoconhecimento - texto introdutório e régua visual (08/03/2026)
- [x] Adicionar texto introdutório incentivador sobre sinceridade, autoconhecimento e reflexão antes do encontro com a mentora
- [x] Mostrar régua de autopercepção visual (barras das competências) abaixo do texto do perfil DISC no relatório

## Bug: Onboarding perde estado ao atualizar página (08/03/2026)
- [x] Corrigir persistência do estado do Onboarding - ao atualizar a página (F5), volta ao início desconsiderando teste DISC e dados salvos

## Bug: Fotos das mentoras não aparecem nos cards de Escolha sua Mentora (08/03/2026)
- [x] Investigar e corrigir fotos das mentoras que não carregam nos cards do Onboarding

## Perfil Completo da Mentora (08/03/2026)
- [x] Corrigir modal "Ver Currículo" no Onboarding para exibir miniCurriculo e especialidade da mentora (dados já existentes no banco)
- [x] Textos acolhedores e avatar de mentora guia em cada etapa do Onboarding
- [x] Gerar novo avatar de mentora guia baseado na foto de referência fornecida pela usuária

## Bug: Banner da mentora guia não aparece no Onboarding (08/03/2026)
- [x] Investigar e corrigir por que o banner MentoraGuiaBanner não aparece nas etapas do Onboarding do aluno (era erro antigo de log, banner já funcionava)

## Bug: Etapa 5 mostra "Encontro Realizado" sem verificar presença real (08/03/2026)
- [x] Corrigir etapa 5 do Onboarding: agora verifica no banco se a mentora registrou presença, fez assessment e relatório antes de mostrar como realizado

## Bug: Aluno do Onboarding não aparece para mentora no Assessment (08/03/2026)
- [x] Aluno José da Silva cadastrado pelo onboarding e que escolheu a mentora Adriana não aparece na lista de alunos dela no assessment (corrigido: onboarding agora salva consultorId)
- [x] Relatório do teste DISC do aluno visível para a mentora ao acessar o assessment (card DISC adicionado)
- [x] Mentora acessa o relatório DISC do aluno ao atribuir metas/PDI (card DISC adicionado na página de Metas)

## Bug: Dados do onboarding não persistem (cadastro, mentora, DISC) (08/03/2026)
- [x] Dados do cadastro do aluno no onboarding agora são salvos no banco (endpoint salvarCadastro criado)
- [x] Escolha da mentora no onboarding agora vincula o aluno à mentora (endpoint escolherMentora criado)
- [x] Agendamento do onboarding agora é salvo no banco (endpoint criarAgendamento criado)
- [x] Relatório DISC visível para mentora no assessment e nas metas

## Funcionalidade: Bloqueio do Onboarding para alunos que já completaram (08/03/2026)
- [x] Detectar se aluno já completou onboarding (tem trilha definida/mentora vinculada/presença registrada)
- [x] Colocar todas as etapas em modo somente leitura (campos desabilitados, botões ocultos)
- [x] Exibir badge/aviso visual "Onboarding Concluído" indicando que é apenas visualização

## Funcionalidade: Reassessment por ciclo com comparativo de evolução (08/03/2026)
- [x] Usar campo periodoTermino da tabela contratosAluno para controlar fim do contrato
- [x] Criar endpoint verificarReassessment para checar elegibilidade (30 dias antes do término)
- [x] Exibir banner de convite para refazer assessment quando elegível
- [x] Campo ciclo adicionado na tabela disc_resultados para suportar múltiplos assessments
- [x] Endpoint disc.comparativo criado para gerar relatório de evolução DISC
- [x] Endpoint disc.historico criado para buscar todos os ciclos

## Funcionalidade: Notificação automática à mentora quando aluno a escolhe (08/03/2026)
- [x] Enviar notificação por email à mentora quando aluno confirma escolha no onboarding
- [x] Enviar notificação por email à mentora quando aluno faz agendamento
- [x] Incluir nome do aluno, email e dados do encontro na notificação
- [x] Notificar owner também quando aluno escolhe mentora

## Funcionalidade: Vídeo "O Guia do Mentor" na página de Assessment (08/03/2026)
- [x] Upload do vídeo "O Guia do Mentor" para CDN
- [x] Ler documento de resumo do vídeo
- [x] Criar seção com vídeo player e resumo na página de Assessment do mentor

## Ajustes9 - Solicitações (08/03/2026)
- [x] Item 1: Habilitar portal completo do aluno só após mentora fazer assessment - IMPLEMENTADO: tela de bloqueio com mensagem + DISC visível
- [x] Item 3: Investigar Jackeline com 0% na visão gerencial - INVESTIGADO: mediaAvaliacoesFinais=0 para todas competencias vem da planilha de performance (dados originais). Não é bug de código. Confirmar com usuário qual aluna específica.
- [x] Item 4: Incluir filtro de relatório por período - IMPLEMENTADO: campos De/Até no frontend + filtro de sessões e eventos no backend
- [x] Item 6: Jose da Silva não aparece na lista de mentorados da Adriana (consultorId=null) - CORRIGIDO: UPDATE consultorId=39
- [x] Item 7: Adicionar notificação in-app (sino/badge) além do email - IMPLEMENTADO: tabela in_app_notifications, componente NotificationBell com badge, notificações automáticas em assessment e mentoria
- [x] Item 8: Corrigir inconsistência de contagem de alunos da Adriana (5 vs 6 vs 7) - CORRIGIDO: getConsultorStats agora unifica alunos de sessões + consultorId
- [x] Item 11: Remover relatório gerencial (visão de todos os alunos) da área do mentor - CORRIGIDO: mentor só vê relatório Individual dos seus alunos, sem opção Gerencial
- [x] Item 12: Relatório de mentorias realizadas por período com valor de cada mentoria - IMPLEMENTADO: aba Financeiro no Demonstrativo com filtro de período, KPIs e tabela por mentor
- [x] Item 13: Campo de valor por sessão de mentoria no cadastro do mentor (admin) - IMPLEMENTADO: campo valorSessao na tabela consultors + formulários de criação/edição + coluna na tabela

## Bug Reportado - Item 5 DISC no Assessment do Mentor
- [x] Item 5: Mentor não consegue visualizar relatório DISC do aluno na tela de Assessment/PDI - CORRIGIDO: card DISC agora sempre aparece quando aluno selecionado (com dados ou mensagem 'não realizado')

## Item 5 Completo - Relatório do Aluno no Assessment do Mentor
- [x] Exibir relatório COMPLETO do aluno no Assessment: DISC + percepções pessoais do onboarding + descrição do trabalho do cadastro - IMPLEMENTADO

## Ajustes10 - Cadastro do Aluno e Relatório Assessment
- [x] Ajuste10-1: Trocar campo "Experiência Profissional" por "Minicurrículo" no cadastro/onboarding do aluno - IMPLEMENTADO
- [x] Ajuste10-2: Adicionar campo "Quem é você? Conte um pouco como você se define como pessoa" no cadastro/onboarding do aluno - IMPLEMENTADO
- [x] Ajuste10-3: Exibir relatório completo no Assessment do mentor com 4 itens: DISC + Percepção Pessoal + Minicurrículo + Quem é Você - IMPLEMENTADO

## Ajustes11 - Bugs Críticos (Regressões na visão da Mentora)
- [x] Ajuste11-1: Relatório do mentor não possibilita geral pelo grupo, só abre Individual - CONFIRMADO OK pelo usuário
- [x] Ajuste11-2: Botão "Gerar Relatório" não está funcionando - CONFIRMADO OK pelo usuário
- [x] Ajuste11-3: Consulta de alunos para metas parou de funcionar - CONFIRMADO OK pelo usuário
- [x] Ajuste11-4: Dashboard do mentor parou de funcionar - CONFIRMADO OK pelo usuário
- [x] Ajuste11-5: Registro de mentoria parou de funcionar - CONFIRMADO OK pelo usuário
- [x] Ajuste11-6: Plano Individual parou de mostrar alunos - CONFIRMADO OK pelo usuário

## Bug Importação - Jaqueline com 0% (Ajuste9 Item 3)
- [ ] Corrigir bug de importação: campos mediaAvaliacoesFinais e avaliacoesRespondidas importados como 0 quando dados reais têm valores (ex: 100, 86, 90, 93). Campos corretos são "Média em avaliações disponíveis" e "Média em avaliações respondidas" (colunas 29 e 30 da planilha)
- [ ] Atualizar dados da Jaqueline e verificar se outros alunos foram afetados

## Consistência de Lógica de Cálculo (08/03/2026)
- [x] Bug na rota de relatórios (exportação Excel): argumentos passados na ordem errada para calcularIndicadoresTodosAlunos (competenciasPorAlunoReport no lugar de compIdToCodigoMap, e compIdToCodigoMapReport no lugar de casesData)
- [x] Verificar que todas as 7 chamadas de calcularIndicadoresTodosAlunos usam a mesma assinatura correta (mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData)
- [x] Confirmar que calcularIndicadoresAlunoV2 (individual) e calcularIndicadoresTodosAlunos (batch) produzem resultados idênticos para a mesma entrada

## Reorganização da Área Administrativa (16 itens → 7 áreas) (08/03/2026)
- [x] Reestruturar menu lateral (sidebar) com 7 áreas e submenus colapsáveis
- [x] Área Mentores: unificar cadastro + dashboard + sessões + financeiro
- [x] Área Alunos: unificar cadastro + assessment + metas + atividades
- [x] Área Empresas e Resultados: unificar Visão Geral + Por Empresa
- [x] Área Parametrização: turmas + trilhas + fórmulas + empresas + acesso + biblioteca tarefas
- [x] Área Conteúdo e Comunicação: webinars + avisos + placeholders cursos/atividades extras
- [ ] Simplificar Upload: remover cards mentorias/eventos/desempenho, manter só performance
- [x] Testar navegação completa e consistência (TypeScript OK, LSP OK, menu renderiza corretamente)
- [x] Adicionar "Atividades Práticas" ao menu do mentor (ele atribui tarefas nas sessões de mentoria)
- [x] Limpar alunos de teste do banco de dados (60 registros com email @test.com removidos, total de 211 → 135 alunos reais)
- [x] Criar procedimentos tRPC para CRUD da Biblioteca de Tarefas (listar, criar, editar, ativar/desativar)
- [x] Criar página BibliotecaTarefas.tsx com visualização por competência e tarefa
- [x] Registrar rota /biblioteca-tarefas no App.tsx e remover placeholder do menu
- [x] Criar procedimento tRPC que usa LLM para gerar conteúdo da tarefa com base na competência
- [x] Adicionar botão 'Criar com IA' no frontend da Biblioteca de Tarefas com geração automática e edição
- [x] Mudar campo Competência para select com competências das trilhas (não texto livre)
- [x] Implementar leque de tarefas por competência no fluxo do mentor (RegistroMentoria: accordion por competência; MetasDesenvolvimento: já filtra por competência selecionada)
- [ ] Bug: Ao criar nova tarefa na Biblioteca, a tarefa anterior da mesma competência é apagada/substituída em vez de ser adicionada

## Cursos Gratuitos (YouTube/Externos)
- [x] Criar tabela courses no schema.ts (tipo gratuito, título, descrição, thumbnail, link YouTube, categoria, competência)
- [x] Migrar banco de dados com pnpm db:push
- [x] Criar helpers no db.ts para CRUD de cursos
- [x] Criar endpoints tRPC para cursos (list, create, update, toggleActive)
- [x] Criar interface admin para gerenciar cursos (listar, criar, editar, ativar/desativar)
- [x] Criar catálogo de cursos no portal do aluno (cards com thumbnail, título, link YouTube)
- [x] Adicionar rotas e menus (admin: Conteúdo e Comunicação > Cursos; aluno: Cursos Disponíveis)
- [x] Escrever testes vitest para os endpoints de cursos (13 testes passando)
- [x] Bug: Página Biblioteca de Tarefas não tem sidebar/DashboardLayout - sem navegação para sair
- [x] Adicionar DashboardLayout na página CursosDisponiveis (admin)
- [x] Adicionar AlunoLayout na página CursosAluno (aluno)
- [x] Bug: Item 'Cursos' no menu lateral mostra badge 'Em breve' e toast placeholder em vez de navegar para /cursos
- [x] Criar tabela activities no schema.ts (tipo: workshop/treinamento/palestra/evento/outro, modalidade: presencial/online/híbrido, título, descrição, data, local, vagas, instrutor, imagem)
- [x] Criar tabela activity_registrations para inscrições dos alunos (status: inscrito/confirmado/cancelado/presente/ausente)
- [x] Migrar banco de dados com pnpm db:push
- [x] Criar helpers no db.ts para CRUD de atividades e inscrições
- [x] Criar endpoints tRPC para atividades (list, create, update, toggleActive, delete, register, unregister, listRegistrations, countRegistrations, myRegistration, updateRegistrationStatus)
- [x] Criar interface admin para gerenciar atividades extras (listar, criar, editar, ver inscritos, confirmar/cancelar inscrições)
- [x] Criar catálogo de atividades extras no portal do aluno (cards com inscrição, detalhes, filtros)
- [x] Remover placeholder 'Em breve' do item Atividades Extras no menu admin e aluno
- [x] Adicionar rotas no App.tsx (/atividades-extras admin, /minhas-atividades aluno)
- [x] Escrever testes vitest para os endpoints de atividades (todos passando)
- [x] Adicionar botão de excluir na interface admin de Cursos (backend já existia, frontend já tinha)
- [x] Adicionar botão de excluir na interface admin de Atividades Extras com dialog de confirmação
- [x] Vincular atividades extras a turmas: tabela activity_turmas + endpoints getAllTurmasMap, setActivityTurmas, getActivitiesForTurma
- [x] Adicionar seleção de turma (checkboxes) no formulário de criar/editar atividade extra
- [x] Filtrar atividades no portal do aluno pela turma do aluno (listForStudent)
- [x] Testes vitest atualizados com testes de vinculação de turmas (438 testes passando)
- [x] Analisar e corrigir algoritmo de cálculo DISC: aluno com 100% em D, I, S e C simultaneamente (causa: Likert sem normalização)
- [x] Reformular DISC: Criar novo questionário com escolha forçada (ipsativo) do zero - 28 blocos
- [x] Reformular DISC: Criar blocos de 4 afirmações (D, I, S, C) socialmente equivalentes
- [x] Reformular DISC: Novo algoritmo de pontuação ipsativo (mais/menos) com normalização 0-100
- [x] Reformular DISC: Atualizar schema do banco para novo formato (blocoIndex, maisId, menosId, maisDimensao, menosDimensao, ciclo)
- [x] Reformular DISC: Nova interface de teste (escolha forçada: mais/menos parecido com cards interativos)
- [x] Reformular DISC: Gráficos de resultado compatíveis com novo formato normalizado
- [x] Reformular DISC: Índice de consistência + alerta de baixa diferenciação implementados
- [x] Reformular DISC: 450 testes vitest passando (incluindo novos testes de escolha forçada)

## Reset DISC - Admin solicitar que aluno refaça o teste
- [x] Backend: endpoint tRPC para resetar respostas e resultados DISC de um aluno específico
- [x] Frontend: botão de reset DISC na interface admin (área de assessment/alunos)
- [x] Testes vitest para reset DISC (5 testes passando)

## Bug: Aba "Meu Perfil" sumiu do Dashboard de Mentor (tabs)
- [ ] Encontrar a tab Meu Perfil no DashboardMentor.tsx e entender por que sumiu
- [ ] Restaurar a tab Meu Perfil no Dashboard de Mentor
- [ ] Testar correção

## Redesign: Seleção de Tarefa no Registro de Mentoria
- [ ] Busca unificada por competência e por conteúdo da tarefa
- [ ] Resultados em lista plana com botão "Selecionar" (sem accordion)
- [ ] Opção de personalizar tarefa (texto livre) separada da biblioteca
- [ ] Ao selecionar da biblioteca, permitir ajustar o texto sem alterar a original

## Fase 0 - Bugs Críticos
- [x] A3: Corrigir hora fim errada no agendamento do Portal do Aluno
- [x] A5: Adicionar coluna "Data da Mentoria" no Excel + corrigir filtro Gerencial
- [x] A2: Corrigir competências com 0% no Assessment (usa student_performance automático)
- [x] A4: Validar disponibilidade real do mentor no agendamento

## Fase 1 - Melhorias e Otimização
- [x] A6: Sistema de precificação flexível por sessão no cadastro do mentor
- [x] A7: Campos Tempo de Contrato e Turma nos 2 formatos de cadastro do aluno + formulário de edição
- [x] B1: Redesign da seleção de tarefa no Registro de Mentoria (4 modos: Biblioteca, Personalizar, Livre, Sem Tarefa)
- [x] B3: Criar área de Configurações do Mentor (Perfil, Agenda, Agendamentos, Notificações)
- [x] B4: Simplificar Dashboard do Mentor (remover abas redundantes, layout limpo com cards, gráficos, próximos agendamentos e alertas)
- [x] B5: Relatório Gerencial para o mentor (resumo geral, sessões por mês, indicadores V2 + atalhos rápidos)

## Fase 0 - Correção de Bugs Críticos (A2-A5)
- [x] A2: Competências aparecem com 0% mesmo com trilha concluída (fix V3: matching robusto por nome base + aceitar 0% como valor válido)
- [x] A3: Horário disponível do mentor mostra hora fim errada no Portal do Aluno (fix: auto-calcular endTime + validar no backend + corrigir dado existente)
- [x] A4: Agendamento no Portal do Aluno não valida disponibilidade real do mentor (fix: validação frontend dia da semana + validação backend contra mentor_availability)
- [x] A5: Relatório Excel: falta coluna "Data da Mentoria" na aba Dados do Aluno + filtro Gerencial não abre para mentor (fix: colunas Total Sessões e Última Mentoria no relatório gerencial + isManager inclui mentores)

## Relatório Gerencial - Novas Colunas na Aba Equipe
- [x] Adicionar coluna Período do Contrato na aba equipe do relatório gerencial Excel
- [x] Adicionar coluna Macrociclos (Trilhas) na aba equipe do relatório gerencial Excel
- [x] Adicionar coluna Microciclos (Competências) na aba equipe do relatório gerencial Excel
- [x] Coluna Turma já existia na aba equipe do relatório gerencial Excel

## Desbloqueio Assessment Onboarding
- [x] Permitir visualização do Assessment (DISC) mesmo quando Onboarding está concluído (forçar step=5 quando onboarding completo)

## Bug - Autopercepção Joseane
- [x] Corrigir mapa de autopercepção da Joseane que não aparece preenchido no Assessment do Onboarding (incluir Visão de Futuro no filtro de trilhas da Régua e do Mapa)

## Bugs Reportados (11/03/2026)
- [x] Bug: Cursos cadastrados pelo admin não aparecem para o aluno assistir (adicionado Cursos e Atividades ao menu AlunoLayout)
- [x] Investigar: Verificar cálculo de webinares da Walbenia - CONFIRMADO BUG: unificação marca ausência em eventos anteriores ao macrociclo
- [x] Bug: Corrigir unificação de eventos - filtrar eventos pela data de início do macrociclo do aluno (7 ocorrências corrigidas)
- [x] Bug: Corrigir duplicatas de eventos na unificação - deduplicar por título + data (3 deduplicadores atualizados)
- [x] Bug: Evento de hoje não aparece para o aluno preencher presença no portal (scheduled_webinars agora são incluídos como eventos sintéticos + markPresence cria evento real automaticamente + regra de liberação por startDate)
- [x] Bug: Lista de eventos do aluno (getWebinarsPendingAttendance) não filtra por macroInicio - corrigido filtro por macroInicio
- [x] Feature: Adicionar informação do período de cálculo dos eventos na tela de Eventos do aluno
- [x] Ajuste: Reverter filtro na lista de eventos do aluno - mostrar todos os eventos com campo dentroDoMacrociclo
- [x] Ajuste: Cards de resumo contam apenas eventos dentroDoMacrociclo (não penaliza nem pontua fora)
- [x] Feature: Badge visual nos eventos fora do período + explicação da lógica abaixo dos cards
- [x] Ajuste: Ordenar lista de eventos por data decrescente (mais recentes primeiro)
- [x] Investigar: Deduplicação de eventos - confirmado que a 1 ausência da Walbenia é o evento de HOJE (ainda não assistido), não é bug
- [x] Feature: Botão de compartilhar no LinkedIn abaixo de cada evento com post pré-preenchido (#ecolider #desenvolvimento #ckmtalents @dinamakiyama)
- [x] Investigar: Ruama tem 28 presenças e 0 ausências mas indicador de Webinars mostra 94% em vez de 100% (RESOLVIDO: dados corretos no banco após deduplicação - 28/28 = 100%, limpeza de 3 participações duplicadas)
## Inclusão de scheduled_webinars na unificação de eventos (11/03/2026)
- [x] Incluir eventos de scheduled_webinars na unificação de eventos do dashboard (meuDashboard, dashboardGeral, dashboardEmpresa, dashboardGestor, relatórios)
- [x] Garantir que scheduled_webinars impactem corretamente o indicador de participação (Ind.1 Webinars)
- [x] Testes vitest para validar a inclusão de scheduled_webinars na unificação (12 testes passando)

## Ajuste visual menu superior (11/03/2026)
- [x] Diminuir tamanho das letras do menu superior (navbar do aluno) para melhor proporção (text-sm → text-xs, ícones h-4 → h-3.5, padding px-4 → px-3, gap reduzido)

## Bug: Visualização DISC/Assessment no Onboarding concluído (11/03/2026)
- [x] Corrigir: Joseane não consegue visualizar DISC, assessment e teste de autoconhecimento no Onboarding (etapas com cadeado não clicáveis quando onboarding concluído) - Stepper agora permite navegação livre quando readOnly, barra 100%, todas etapas clicáveis

## Bug: Datas de macrociclos/microciclos no relatório Excel do gestor (11/03/2026)
- [x] Corrigir: datas de início e fim dos macrociclos e microciclos não estão aparecendo no Excel exportado pelo gestor - Adicionadas colunas 'Início do Ciclo' e 'Fim do Ciclo' na aba 'Indicadores por Ciclo'

## Limpeza de dados e ajuste Demonstrativo (16/03/2026)
- [x] Limpar 20 alunos de teste do SEBRAE TO (nomes "Teste Contrato A7" e "Teste Direto Contrato A7") - 20 deletados, 0 dados relacionados perdidos, total SEBRAE TO agora 50
- [x] Ajustar card "Total Alunos" no Demonstrativo de Sessões para mostrar alunos distintos em vez de PDIs - usa Set(alunoId).size

- [ ] Investigar e limpar alunos de teste restantes em TODOS os programas (painel admin mostra 211, deveria ser menos)

## Botão excluir aluno no cadastro admin (16/03/2026)
- [x] Criar endpoint backend para excluir aluno (com verificação de dados relacionados) - getAlunoDependencies + deleteAluno com cascade
- [x] Adicionar botão de excluir na interface de cadastro de alunos com diálogo de confirmação - botão Trash2 + Dialog com lista de dependências

## Exportar alunos em Excel (16/03/2026)
- [x] Adicionar botão de exportar lista de alunos em formato Excel na área de cadastros do admin - import dinâmico xlsx, exporta filteredAlunos com colunas auto-dimensionadas

## Melhoria visual tabela alunos (16/03/2026)
- [x] Melhorar visualização da tabela de alunos: nome cortado, tabela muito larga, difícil identificar aluno ao excluir - Nome sticky, fonte text-xs, ações com ícones compactos
- [ ] Refatorar tabela de alunos para layout expansível: linha compacta com dados essenciais, clique expande detalhes e ações (Editar, Excluir)

## Varredura de Email (16/03/2026)
- [x] Diagnosticar infraestrutura de email: configuração SMTP, pontos de envio, templates e status
- [x] Configurar App Password do Google para conta relacionamento@ckmtalents.net
- [x] Ativar envio automático de email de boas-vindas ao cadastrar alunos (Convite Onboarding e Cadastro Direto)
- [x] Atualizar template de email com tom positivo, emojis, logo ECOBEM e frase motivacional
- [x] Tabela expansível de alunos no Cadastros (linhas compactas com expansão ao clicar)
- [x] Corrigir email boas-vindas: remover tarja azul do header, deixar só o logo sobre fundo branco
- [x] Corrigir email boas-vindas: URL do botão dá 404 (/login não existe), apontar para URL correta (raiz do site)
- [x] Corrigir texto com códigos Unicode literais (\u00ea, \u2014, etc.) em OnboardingAluno, TesteDiscOnboarding, DashboardAluno, IndividualDashboard e Upload
- [x] Onboarding: ao selecionar mentora sem agenda disponível nos próximos 10 dias, exibir mensagem "Esta profissional não tem agenda disponível, escolha outro profissional"
- [x] Onboarding: mentores inativos (inabilitados pelo admin) não devem aparecer na lista de seleção para novos alunos
- [x] Admin Cadastros: criar botão ativar/inativar mentor na área de gestão de mentores
- [x] Onboarding: adicionar badge visual no card da mentora indicando se tem agenda disponível (verde) ou não (vermelho) antes do aluno clicar
- [x] Mentor: implementar agenda por data específica (além dos horários semanais recorrentes)
- [x] Mentor: adicionar funcionalidade de configurar disponibilidade por data específica (não apenas dia da semana)
- [x] Onboarding: adicionar botão com vídeo explicativo sobre o DISC antes do aluno iniciar o teste
- [x] Onboarding DISC: adicionar indicador visual de vídeo concluído e só habilitar botão "Iniciar o Teste DISC" após assistir o vídeo
- [x] Alunas Adelice Novak e Ana Flávia Mendes Borges: eliminadas do programa, não serão cadastradas
- [x] Onboarding DISC: permitir que aluno pule o vídeo após tê-lo assistido uma vez (salvar estado no banco)
- [x] Bug: Onboarding sempre retorna para etapa de cadastro mesmo quando aluno já salvou dados - corrigido: adicionada verificação de cadastroPreenchido na lógica de step
- [x] Adicionar informação de duração (4 minutos) no vídeo explicativo do DISC no onboarding
- [x] Reformular etapa de agendamento do onboarding: mostrar datas/horários disponíveis reais da mentora (não genéricos)
- [x] Mostrar link da sala de entrevista (Google Meet) na etapa de agendamento
- [x] Enviar email de confirmação de agendamento para o aluno após selecionar data/horário
- [x] Enviar email para mentora informando que foi escolhida, parabenizando e solicitando que estude currículo e testes do aluno
- [x] Enviar email para o administrador quando aluno fizer agendamento no onboarding (CC no email da mentora)
- [x] Criar painel administrativo para visualizar todos os agendamentos realizados na plataforma
- [x] Bug: Mentora escolhida pelo aluno no onboarding não é persistida ao retornar - corrigido: recuperar mentoraId do banco + useEffect para restaurar selectedMentora
- [x] Remover botão de gerar relatório dos testes DISC para o aluno no onboarding
- [x] #0a ajustes17: Corrigir erro React #310 ao acessar dashboard por empresa - hooks movidos antes de early returns + ErrorBoundary com recuperação automática
- [x] #2 ajustes17: Corrigir cadastro de gerente que cria como mentor - removido consultorId do createGerente + corrigido dados existentes no banco
- [x] Remover aba Gerentes redundante do AdminCadastros - manter apenas Visão Dupla (renomeada para Gerentes)
- [x] Reorganizar menu sidebar: mover Cadastros para dentro de Parametrização e remover links redundantes em Alunos, Mentores e Empresas
- [x] #0b ajustes17: Investigar por que Brenno e Ilda não têm dados no dashboard (resolvido via #3d/#3e)
- [x] #1 ajustes17: Botão de inativar aluno + excluir da contagem
- [ ] #10 ajustes17: Alterar regra de cálculo de webinares para período total do contrato (V2)
- [ ] #11 ajustes17: Investigar tarefas zeradas da aluna Millena
- [ ] #12 ajustes17: Corrigir sobreposição de abas do menu
- [x] #3 ajustes17: Implementar edição de assessment (trilha, competências, ciclos, contrato) pelo admin/mentor - resolve também #0b (Brenno/Ilda sem dados)
- [x] #3b ajustes17: BUG - Dados de Brenno e Ilda (EMBRAPII) não aparecem no assessment apesar de terem sido carregados via upload - investigar e corrigir
- [x] #3c ajustes17: Corrigir barra de rolagem no diálogo de edição de assessment - campos ficam cortados quando edita competência
- [x] #3d ajustes17: Correção imediata - popular plano_individual do Brenno e Ilda a partir dos assessment_competencias existentes
- [x] #3e ajustes17: Automação futura - sincronizar plano_individual automaticamente quando assessment é criado/editado
- [x] #13 ajustes17: BUG - Alerta de acompanhamento deve considerar apenas sessões com o mentor ATUAL do aluno, não o mentor anterior (ex: alunos da Giovana transferidos para outros mentores mostram 180+ dias sem sessão incorretamente)
- [x] #14 ajustes17: Implementar envio de e-mail automático quando mentoria estiver com mais de 30 dias sem ser agendada - para o aluno, CC mentor e CC administrador + card na tela Demonstrativo com lista detalhada de alunos/mentores atrasados + botão envio manual

## Melhoria Tabela Sessões por Aluno (16/03/2026)
- [x] Adicionar coluna "Última Sessão" na tabela (data + dias atrás)
- [x] Adicionar filtro "Atrasado 30+ dias" no dropdown de Status
- [x] Linhas clicáveis com Sheet de visão detalhada completa do aluno
- [x] Filtros por todas as colunas (incluir filtro por Mentor)
- [x] Botão de envio manual de alertas por e-mail para alunos atrasados
- [x] Badge visual (vermelho) para alunos com 30+ dias sem sessão
- [x] Integrar cron job de alertas automáticos no startup do servidor

## Correções Tabela Sessões (17/03/2026)
- [x] Barra de ferramentas horizontal (filtros em linha única)
- [x] Separar em 2 tipos de status: "Status Progresso" (Completo/Em andamento/Falta 1) e "Status Sessão" (Em dia/Atrasado Xd)
- [x] Corrigir filtro de status para funcionar com ambos os tipos
- [x] Corrigir coluna Mentor aparecendo em branco (busca mentor das sessões quando PDI não tem consultorId)
- [x] Permitir envio de alertas para ambos os casos de status
- [x] Limpar botão para resetar filtros
- [x] Linhas clicáveis com Sheet/dialog de visão completa e detalhada do aluno
- [x] Paginação na tabela (225+ linhas, 30 por página)
- [ ] Configurar frequência do cron de alertas e personalizar template do e-mail
- [ ] Corrigir barra de ferramentas/filtros para layout horizontal (toolbar) na tabela de Sessões

## Excluir empresas inativas dos alertas e visualizações
- [x] getAllStudentsSessionProgress: filtrar PDIs de empresas inativas
- [x] cronAlertasMentoria: filtrar alunos de empresas inativas
- [x] enviarAlertas (routers.ts): filtrar alunos de empresas inativas
- [x] notificarCicloQuaseFechando: corrigido automaticamente via getAllStudentsSessionProgress

## Inativação em cascata e ciclo completo
- [x] Inativação em cascata: ao inativar empresa, inativar todos os alunos e PDIs vinculados
- [x] Ciclo completo: alunos com sessões completas (12/12) não devem aparecer como "Atrasado" no Status Sessão
- [x] Ciclo completo: alunos com sessões completas não devem receber alertas por e-mail (cron + manual)
- [x] Reativação em cascata: ao reativar empresa, reativar alunos e PDIs vinculados
- [x] Implementar barra de rolagem horizontal na tabela de sessões de mentoria
- [x] Ocultar todos os campos de comentários do mentor na visualização do aluno, exceto o campo "feedback para o aluno"
- [x] Adicionar descritivo robusto da nota de evolução como feedback automático no histórico de sessões do aluno
- [x] Bug: Dashboard Mentores mostra "14 mentores cadastrados" mas exibe apenas 6 cards (corrigido: filtrar apenas role=mentor, remover .slice(0,6))
- [ ] Filtrar mentores inativos nos dropdowns de seleção em todo o sistema (getConsultors sem filtro)
- [ ] Limpar 4 registros fantasma de mentores sem nome/email/CPF nos Cadastros
- [ ] Adicionar coluna Status visível na tabela de Cadastros de Mentores

## Importação de Sessões Faltantes (17/03/2026)
- [x] Analisar planilha MENTORIASFALTANTES.xlsx (89 registros, 86 alunos, 4 consultoras, 8 turmas)
- [x] Criar script de importação com verificação de duplicatas
- [x] Importar 69 sessões novas (18 duplicatas ignoradas, 2 headers ignorados)
- [x] Validar dados importados: 33/33 alunos Masters com sessão 16, total 1306 sessões no banco

## Bug: Datas de Última Sessão com -1 dia no CSV exportado (17/03/2026)
- [x] Investigar e corrigir bug de fuso horário na exportação CSV do demonstrativo de mentorias
- [x] Datas aparecem 1 dia antes do correto (ex: 05/02 no banco → 04/02 no CSV)
- [x] Criado dateUtils.ts com formatDateSafe, formatDateCustomSafe, formatDateLongSafe (usa UTC)
- [x] Corrigido em 29 arquivos do frontend (todas as chamadas toLocaleDateString)
- [x] Corrigidas 2 datas com ano errado no banco (Aldeni 2026→2025, Ilda 2026→2025)
- [x] Testes vitest passando (20/20) com cenários reais do bug

## Editar Mentorias na Parametrização (17/03/2026)
- [x] Criar página "Editar Mentorias" na seção de Parametrização
- [x] Implementar filtros por empresa, turma, aluno e consultor
- [x] Exibir tabela com sessões de mentoria (nº sessão, data, aluno, consultor, presença, tarefa)
- [x] Permitir editar a data da sessão de mentoria já lançada
- [x] Criar endpoint backend para atualizar data da sessão
- [x] Adicionar rota no menu de Parametrização
- [x] Escrever testes vitest para o endpoint de edição (15 testes passando)

## Bug: Alunos inativos aparecendo como pendentes no demonstrativo (17/03/2026)
- [x] Gabriela Tomasi (inativada) aparece como "Em andamento" e "Atrasado 174d" no demonstrativo
- [x] Filtrar alunos inativos do demonstrativo de mentorias (8 PDIs de 4 alunos inativos removidos: Luciano, Gabriela, Dina, Graça)
- [x] Filtrar alunos com PDI congelado do demonstrativo de mentorias (não devem aparecer como pendentes)

## Excluir Sessão de Mentoria (17/03/2026)
- [x] Criar endpoint backend para excluir sessão de mentoria
- [x] Adicionar botão de excluir na tabela da página Editar Mentorias (lixeira vermelha)
- [x] Incluir confirmação antes de excluir (dialog de confirmação com detalhes da sessão)

## Expandir Edição de Mentorias (17/03/2026)
- [x] Permitir editar tarefa (entregue/não entregue) no dialog de edição
- [x] Permitir editar número da sessão com validação de duplicidade (mesmo aluno não pode ter 2 sessões com mesmo número)
- [x] Permitir editar o mentor/consultora da sessão
- [x] Atualizar backend (updateSessionDate → updateSession completo)
- [x] Atualizar frontend com novos campos no dialog (data, nº sessão, mentor, presença, tarefa)

## Lista de Datas de Sessões no Card de Detalhes do Aluno (17/03/2026)
- [x] Adicionar lista sequencial de sessões com datas no card de Detalhes do Aluno (Demonstrativo)

## Total de Sessões Previstas no Cadastro do PDI (17/03/2026)
- [ ] Adicionar coluna totalSessoesPrevistas na tabela assessment_pdi (schema + migração)
- [ ] Atualizar lógica de cálculo: usar totalSessoesPrevistas em vez de diferença de meses
- [ ] Atualizar endpoints de criação/edição do PDI para aceitar o novo campo
- [ ] Atualizar formulário de cadastro do PDI no frontend com campo "Total de Sessões Previstas"
- [ ] Manter fallback: se campo não preenchido, usar cálculo antigo (diferença de meses)

## Incluir Nova Sessão de Mentoria (Admin) (17/03/2026)
- [x] Criar endpoint backend para adicionar nova sessão de mentoria (admin)
- [x] Adicionar botão "Nova Sessão" na página Editar Mentorias
- [x] Criar dialog com campos: aluno, mentor, data, nº sessão, presença, tarefa, nota evolução, parecer
- [x] Validar duplicidade de nº sessão para o mesmo aluno
- [x] Notificar admin por e-mail com cópia para dina@makiyama.com.br ao criar nova sessão de mentoria

## Bug: EMBRAPII - Primeira sessão (Assessment) não contabilizada (17/03/2026)
- [ ] Investigar como a sessão de assessment da EMBRAPII está registrada no banco
- [ ] Corrigir para que a sessão de assessment seja contabilizada na contagem de sessões realizadas

## Excluir Assessment da Contagem de Mentorias (17/03/2026)
- [x] Excluir sessões de assessment (isAssessment=1) da contagem de "sessões realizadas" no Demonstrativo
- [x] Aplicar filtro em getSessionProgressByAluno e getAllStudentsSessionProgress
- [x] A 1ª sessão (assessment) não conta no total de mentorias previstas no cadastro

## Limpeza: Remover Atividades Extras de Teste (17/03/2026)
- [x] Identificar e remover todas as atividades extras de teste do banco de dados (682 atividades + 78 inscrições + 147 vínculos turma excluídos)

## Bug: Indicador 4 (Tarefas) mostrando 0% mesmo com tarefas entregues (17/03/2026)
- [x] Investigar cálculo do Ind. 4 Tarefas no dashboard do aluno
- [x] Corrigir para que reflita corretamente tarefas demandadas vs entregues
- [x] Refatorar Ind. 1 (Webinars), Ind. 4 (Tarefas) e Ind. 5 (Engajamento) para calcular com base no macrociclo (assessment_pdi.macroInicio/macroTermino) em vez de por microciclo

## Melhoria: Visualização de Atividades Práticas do Aluno (17/03/2026)
- [x] Investigar fluxo de cadastro de tarefa pelo mentor (campos disponíveis: taskMode, taskId, customTaskTitle, customTaskDescription, taskDeadline)
- [x] Ajustar visualização do aluno para exibir nome, descrição e detalhes da tarefa cadastrada pelo mentor
- [x] Garantir que a lista de tarefas do aluno mostre dados vindos da sessão de mentoria (taskId, customTaskTitle, customTaskDescription, etc.)
- [x] Corrigir backend (myTasks, submissions, submissionDetail) para incluir tarefas personalizadas e livres (não só da biblioteca)

## Cards de Resumo na aba Tarefas do Aluno (17/03/2026)
- [x] Adicionar cards de resumo (Total, Pendentes, Entregues, Validadas) no topo da aba Tarefas, similar aos cards da aba Webinars

## Novas Etapas do Onboarding do Aluno (17/03/2026)
- [x] Etapa 6 - Meu PDI: Visualização do assessment/PDI elaborado pelo mentor com competências e metas
- [x] Etapa 7 - Sua Jornada: Vídeo de boas-vindas + 4 vídeos temáticos (Competências, Webinars, Tarefas, Metas)
- [x] Etapa 8 - Aceite e Início: Aceite formal do PDI + início oficial da trilha de desenvolvimento
- [x] Linguagem alegre, motivadora e desafiadora focada no autoconhecimento
- [x] Stepper atualizado para 8 etapas
- [x] Tabelas no banco para rastrear vídeos assistidos e aceite (onboarding_jornada, onboarding_videos)
- [x] Backend: procedures marcarPdiVisualizado, marcarVideoAssistido, realizarAceite, videos
- [x] Vídeos configuráveis pelo admin (URLs YouTube/Vimeo) - tabela onboarding_videos
- [x] Checkbox "Assistido" em cada vídeo para liberar avanço
- [x] Termo de compromisso com aceite formal (4 checkboxes + assinatura digital)

## Refatoração Etapa 6 - Visualização Completa do PDI (17/03/2026)
- [x] Seção Visão Geral: macrociclo (período, trilha, status, sessões previstas) + cards de progresso
- [x] Seção Visão Geral: Timeline visual dos microciclos com competências e cores
- [x] Seção Competências: Cards expandíveis com nível atual, meta, progresso curso, aulas, avaliações
- [x] Seção Etapas: Timeline vertical (mentorias, tarefas, webinars, cursos, metas) com contadores
- [x] Seção Recursos: Grid com webinars próximos, cursos, tarefas e metas
- [x] Interface visual moderna com navegação por abas (4 seções)
- [x] Animações leves (pulse, gradientes, transições hover/expand)
- [x] Hero card personalizado com nome do aluno e decorações visuais
- [x] Linguagem motivadora focada no autoconhecimento

## Nova Lógica de Onboarding (17/03/2026)
- [x] Schema: campo onboardingLiberado + cadastroConfirmado na tabela onboarding_jornada/alunos
- [x] Backend: nova lógica getAlunoOnboardingStatus baseada em PDI (sem PDI = onboarding obrigatório)
- [x] Backend: procedure admin liberarOnboarding (novo ciclo)
- [x] Backend: ajustar lógica de progresso — etapa 1 sempre primeiro (cadastroConfirmado)
- [x] Frontend: redirecionamento nas páginas do aluno (Mural, Dashboard) para onboarding se sem PDI
- [x] Frontend: botão "Liberar Onboarding" na lista de alunos (só para quem tem PDI)
- [x] Ajustar cadastro de aluno (admin) para NÃO atribuir mentor — aluno sempre escolhe no onboarding
- [x] Validação: aluno com PDI sem mentor = erro apontado para correção (verificado: 0 casos no banco)
- [x] Remover lógica de bypassOnboarding (bypassOnboarding=0 no cadastro direto, regra agora é baseada em PDI)
- [x] Testes (onboarding.test.ts — todos passando)

## Bug: Onboarding não bloqueia edição para aluno com PDI (17/03/2026)
- [x] Aluno com PDI (ex: Joseane) consegue editar e salvar cadastro no onboarding — deveria ser somente leitura
  - Frontend: readOnly agora baseado em hasPdi + needsOnboarding (não apenas onboardingCompleto)
  - Backend: todas as mutations do onboarding protegidas contra edição por aluno com PDI

## Bug: Stepper readOnly bloqueia clique nas etapas (17/03/2026)
- [x] Em readOnly, todas as etapas do stepper devem ser clicáveis para visualização (sem cadeado)
  - Loading state adicionado para evitar flash de conteúdo incorreto enquanto onboardingStatus carrega
  - Stepper já tinha lógica correta (isLocked=false em readOnly), problema era timing de carregamento

## Resumo do Plano - Novos cards calculados (17/03/2026)
- [x] Adicionar cards: Webinares (≈quinzenas no ciclo), Mentorias (≈meses no ciclo), Competências e Tarefas (≈mentorias)
- [x] Calcular valores com base no ciclo (início e término) com símbolo de aproximado (≈)

## Links nos cards do Resumo do Plano (17/03/2026)
- [x] Adicionar link em cada card do Resumo do Plano para a seção correspondente na plataforma

## Avatar da Guia - GIF Animado (17/03/2026)
- [x] Trocar avatar da guia por ilustração gerada por IA de mulher negra profissional + animação CSS float

## Balão de Diálogo Interativo no Avatar (17/03/2026)
- [x] Adicionar balão de diálogo ao avatar da guia que exibe dicas contextuais ao passar o mouse

## Filtrar Cases de Sucesso por trilhas do aluno (18/03/2026)
- [x] Mostrar apenas cards das trilhas que o aluno realmente faz na área de Cases de Sucesso
  - Backend: trilhasDisponiveis agora filtra por assessment_pdi do aluno (getAssessmentsByAluno)
  - Testes: 9 testes unitários cobrindo cenários (múltiplos PDIs, trilha inativa, sem PDI, etc.)

## Bug: Competência Raciocínio Lógico sem evolução para Wandemberg (18/03/2026)
- [ ] Investigar por que "Raciocínio Lógico e Espacial" do Wandemberg aparece sem barra de progresso, sem nota e como "Vencida"
  - Tem 3/4 webinars e 2/2 tarefas, mas não mostra Aulas, Nota, Nível Mentora
  - Outras competências (Gestão do Tempo, Empatia) mostram todos os dados normalmente

## Ajustes Solicitados - Documento Flavia Balieiro (18/03/2026)
- [x] Página Editar Mentorias: organizar sessões por ordem numérica (ascendente) e incluir filtro de pesquisa
- [x] Página Editar Mentorias: ao clicar na linha do aluno, abrir card com dados detalhados (Sheet lateral com progresso, sessões, última sessão)
- [x] Formulário Nova Sessão de Mentoria: corrigir filtro de alunos por turma (agora considera PDI do aluno)
- [x] Bug: Flavia Balieiro agora aparece ao filtrar por Jornada Personalizada (via PDI, mesmo com turmaId=Basic)
- [x] 13 testes unitários cobrindo ordenação, busca e filtro PDI

## Bug: Flavia Balieiro NÃO aparece ao filtrar por Jornada Personalizada no Nova Sessão (18/03/2026)
- [x] Corrigir filtro: Flavia tem 2 trilhas (Basic + Jornada Personalizada) mas não aparece ao selecionar turma Jornada Personalizada
  - Causa raiz: getAllStudentsSessionProgress usava aluno.turmaId (30002=Basic) em vez de pdi.turmaId (30009=Jornada Personalizada)
  - Correção: alterado para usar pdi.turmaId || aluno.turmaId no db.ts
- [x] Verificar se progressData retorna dados corretos para Flavia com turmaNome matching
  - Confirmado visualmente: Flavia aparece na lista ao filtrar por Jornada Personalizada

## Bug: Aba Ciclos de Execução no Plano Individual não mostra ciclos existentes (18/03/2026)
- [x] Aba "Ciclos de Execução" agora mostra micro ciclos derivados do PDI (assessment_competencias)
- [x] Backend: nova função getCiclosDerivadosDoPdi agrupa competências por trilha/período
- [x] Frontend: exibe ciclos com badge PDI, timeline visual e competências associadas

- [x] Adicionar página Plano Individual no menu/sidebar do administrador (grupo Alunos)

## Ajustes Plano Individual - Permissões e Título (18/03/2026)
- [x] Alterar título da página para "P.D.I - Plano Individual"
- [x] Mentora vê apenas seus mentorados na lista de alunos (via trpc.alunos.byConsultor)
- [x] Apenas administrador pode ver/editar plano de todos os alunos
  - Botões Adicionar Competências, Atribuir em Lote, Remover e Novo Ciclo ocultos para mentores
  - Status não é clicável para mentores (somente visualização)
- [x] 19 testes unitários cobrindo permissões, filtragem e ciclos PDI

## Reorganização: Plano Individual como página central de gestão do PDI (18/03/2026)
- [x] Análise: mapear todas as funcionalidades PDI espalhadas no sistema (banco, páginas, routers)
- [x] Análise: identificar onde estão dados de contrato, mentorias, webinars, tarefas, metas
- [x] Análise: produzir documento de mapeamento para validação do usuário
- [x] Implementar reorganização na página Plano Individual

## Reorganização da Página P.D.I - Plano Individual (18/03/2026) - SEQUENCIAL
- [x] Página sequencial unificada (sem abas) com seções fluindo de cima para baixo
- [x] Seção 1: Seleção de Aluno (filtros + lista lateral)
- [x] Seção 2: Contrato (período, sessões contratadas, saldo)
- [x] Seção 3: Jornada/PDI (macro + micro jornada: trilhas, competências, níveis, metas ciclo, datas)
- [x] Seção 4: Ciclos de Execução (timeline com CRUD)
- [x] Seção 5: Metas de Desenvolvimento (criação, acompanhamento, biblioteca, IA)
- [x] Seção 6: Performance Filtrada (indicadores V2)
- [x] Manter funcionalidades existentes (competências do plano, ciclos, atribuição em lote)

## Criar PDI do Zero para Alunos sem Plano (18/03/2026)
- [x] Quando aluno não tem assessment/PDI, mostrar seção "Criar PDI" com botão e formulário
- [x] Permitir mentora criar assessment/trilha para o aluno diretamente na página
- [x] Após criar assessment, sincronizar competências no plano individual
- [x] Exibir estado vazio amigável com CTA claro para iniciar o PDI

## Botão Editar Assessment + Novo Macrociclo na Página PDI (18/03/2026)
- [x] Adicionar botão "Editar" em cada assessment existente (abre EditAssessmentDialog)
- [x] Adicionar botão "+ Novo Assessment" para criar novo macrociclo para alunos que já têm assessment
- [x] Criar wizard/formulário inline para criar PDI do zero (alunos sem assessment)
- [x] NÃO alterar permissões do contrato (fica só admin, conforme solicitado)

## Bugs Contrato na Página PDI (18/03/2026)
- [x] Fix: campo observacoes envia null ao editar contrato (expected string, received null)
- [x] Fix: contrato não aparece após criação (query invalidation)
- [x] Fix: incompatibilidade de nomes de campos entre frontend e backend (periodoInicio/periodoTermino/totalSessoesContratadas)
- [x] Fix: campo valorContrato removido do formulário (não existe no schema do banco)
- [x] Verificado: criação de contrato funciona e aparece imediatamente na lista
- [x] Verificado: edição de contrato funciona sem erros de validação
- [x] Verificado: exclusão de contrato funciona corretamente

## Remoção da seção Ciclos de Execução da página PDI (18/03/2026)
- [x] Remover seção Ciclos de Execução da página PDI (macrociclo já definido no formulário de Assessment)
- [x] Remover botão "Novo Ciclo" e dialog de criação de ciclo
- [x] Remover estados e mutations relacionados a ciclos que não são mais necessários
- [x] Atualizar testes unitários (22 testes PDI + 18 testes jornada passando)

## Remoção de colunas Meta C1 e Meta C2 da tabela Assessment PDI (18/03/2026)
- [x] Remover colunas Meta C1 e Meta C2 da tabela de competências no Assessment PDI
- [x] Manter colunas Peso, Nível e Meta Final (usados em cálculos)


## Bugs de validação de status ativo/inativo (18/03/2026)
- [ ] Bug: possível criar PDI (Assessment) para aluno inativado - deveria bloquear
- [ ] Bug: possível ativar aluno vinculado a empresa desativada - deveria bloquear
- [ ] Adicionar validação no backend: impedir criação de Assessment para aluno inativo
- [ ] Adicionar validação no backend: impedir ativação de aluno se empresa está desativada
- [ ] Adicionar validação no frontend: ocultar/desabilitar ações de PDI para alunos inativos
- [ ] Adicionar validação no frontend: impedir ativação de aluno com empresa desativada

## Bug visual sidebar (18/03/2026)
- [ ] Bug: texto "Painel Inicial" sobrepõe "Alunos" no sidebar - corrigir espaçamento/layout


## Sidebar overlap fix + IA na Biblioteca de Tarefas (18/03/2026)
- [x] Fix: sobreposição de "Painel Inicial" sobre "Alunos" no sidebar (confirmado na versão publicada)
- [ ] Feature: botão "Gerar com IA" no formulário de criação/edição de tarefa na Biblioteca de Tarefas
- [ ] Feature: endpoint tRPC para gerar Resumo, O que fazer e O que ganha via LLM


## Foto e Minicurrículo do Mentor (18/03/2026)
- [x] Campos fotoUrl e miniCurriculo já existiam na tabela de consultores (schema)
- [x] Endpoint tRPC mentor.uploadPhoto já existia para upload de foto (S3)
- [x] Endpoint editMentor atualizado para aceitar miniCurriculo
- [x] Frontend da aba Mentores atualizado com foto (upload) e minicurrículo (textarea) no dialog de edição
- [x] Edição de foto e minicurrículo funcionando para mentores já cadastrados


## Relatórios Financeiros (18/03/2026)
- [x] Relatório Financeiro por Mentora: nome mentora, alunos atendidos, empresa, datas sessões, valor sessão, total a pagar no período
- [x] Relatório Financeiro por Empresa: nome empresa, alunos, mentora, datas sessões, valor sessão, total gasto no período
- [x] Adicionar "Financeiro por Mentora" e "Financeiro por Empresa" no dropdown Tipo de Relatório
- [x] Exportação em Excel (PDF usa mesmo mecanismo)
- [x] Controle de acesso: apenas admin pode gerar relatórios financeiros
- [x] Filtro por período (data início/fim) funcional
- [x] Precificação flexível por faixa de sessões (mentor_session_pricing)
- [x] 17 testes unitários cobrindo acesso, geração e validação

## Correção Visual - Cards de Mentoras no Onboarding (18/03/2026)
- [x] Fotos das mentoras nos cards estão muito próximas/cortadas - melhorar enquadramento
- [x] Reduzir tamanho da foto no card para não ocupar toda a área
- [x] Garantir que o rosto fique visível e bem enquadrado (object-position)

## Redesign Cards de Mentoras - Layout com Foto Circular (18/03/2026)
- [x] Trocar layout de foto grande no card para foto circular pequena (avatar)
- [x] Nome e especialidade ao lado da foto circular
- [x] Botão para ver currículo completo
- [x] Badges de disponibilidade e áreas de atuação
- [x] Botão de seleção da mentora

## Redesign Cards de Mentoras v2 - Inspirado na Referência (18/03/2026)
- [x] Foto circular grande centralizada no topo do card (w-24 h-24)
- [x] Nome da mentora abaixo da foto, centralizado (primeiro + último nome)
- [x] Botão "Saiba mais" verde (ver currículo) + botão "Escolher" empilhados
- [x] Badge de disponibilidade discreto (verde/laranja)
- [x] Layout limpo e elegante similar à referência (5 colunas em telas grandes)

## Bug: Horário do Webinar não atualiza após salvar (19/03/2026)
- [x] Investigar lógica de salvamento e exibição de horário dos webinars
- [x] Corrigir bug de timezone/offset - criadas funções formatDateTimeBrazil, utcToLocalDatetimeInput, localDatetimeInputToUTC
- [x] Garantir que o horário editado no formulário seja exibido corretamente na listagem
- [x] Corrigido também em AvisosAdmin e MuralAluno
- [x] 18 testes unitários cobrindo conversão UTC <-> Brazil timezone

## Implementar Envio Real de Lembretes de Webinar (19/03/2026)
- [x] Criar função de envio de email SMTP para lembretes de webinar (buildWebinarReminderEmail)
- [x] Criar notificações in-app para todos os alunos ativos ao enviar lembrete (createNotifications)
- [x] Atualizar procedimento sendReminder para enviar email + notificação in-app
- [x] Template HTML do email com informações do webinar (título, data, horário, link, palestrante)
- [x] Tratamento de erros: continuar enviando mesmo se um email falhar (batch de 10 com delay)
- [x] Atualizar toast para refletir quantidade real de emails e notificações enviadas
- [x] 17 testes unitários para o envio de lembretes (webinar-reminder.test.ts)

## Reorganizar Layout do Mural do Aluno (19/03/2026)
- [x] Mover os dois cards grandes (ECO_EVOLUIR e B.E.M. Área de Aulas) para abaixo dos avisos/comunicados
- [x] Transformar os dois cards grandes em mini-cards compactos (seção "Plataformas Externas")
- [x] Card "Cursos Disponíveis" verificado - funciona corretamente (exibe drill-down com estado vazio quando não há cursos)
- [x] Avisos/comunicados e webinar em destaque ficam visíveis primeiro no mural

## Bug: Card "Cursos Disponíveis" no Mural (19/03/2026)
- [x] Card mostra "0" mas existem 71 cursos cadastrados na página /cursos
- [x] Ao clicar no card, abre drill-down vazia em vez de redirecionar para /cursos
- [x] Corrigir contagem para refletir cursos reais (usa courses.listActive)
- [x] Corrigir navegação para ir para /cursos ao clicar (setLocation("/cursos"))

## Redirect Aluno com PDI para Mural (19/03/2026)
- [x] Aluno que já tem PDI (onboarding concluído) deve ser redirecionado para /mural ao acessar a plataforma
- [x] Verificar fluxo de redirecionamento atual após login - alterado de /meu-dashboard para /mural

## Seleção de Destinatários e Reenvio de Lembretes (19/03/2026)
- [x] Adicionar checkboxes para selecionar destinatários: Alunos, Gerentes, Mentores (dialog com 3 checkboxes)
- [x] Atualizar backend sendReminder para aceitar array de grupos destinatários
- [x] Criar função para buscar emails de gerentes (getActiveManagersWithEmails)
- [x] Criar função para buscar emails de mentores (getActiveMentorsWithEmails)
- [x] Adicionar botão "Reenviar Lembrete" para webinars que já tiveram lembrete enviado
- [x] Permitir reenvio com seleção de destinatários diferente
- [x] Atualizar toast com detalhamento por grupo (X alunos, Y gerentes, Z mentores)
- [x] 18 testes unitários cobrindo seleção de grupos, deduplicação e reenvio

## Verificar Link de Reunião no Email de Lembrete (19/03/2026)
- [x] Garantir que o link de reunião do webinar seja passado corretamente para o template do email
- [x] Botão "Acessar Reunião" aparece no email quando o webinar tem link cadastrado
- [x] Verificado: Aula 04 tem meetingLink = https://www.even3.com.br/... - botão verde aparecerá no email

## Email de Teste para Admin (19/03/2026)
- [x] Incluir relacionamento@ckmtalents.net como destinatário fixo em todos os envios de lembrete
- [x] Admin sempre recebe cópia do email para visualizar como chega aos destinatários

## Página Admin: Acompanhamento de Onboarding (19/03/2026)
- [ ] Criar página admin "Acompanhamento de Onboarding" com régua de progresso por aluno
- [ ] Etapas da régua: Convite Enviado → Cadastro Preenchido → Teste Realizado → Mentoria Agendada → PDI Publicado → Termo de Compromisso Assinado
- [ ] Visualizar evolução de cada aluno com indicador visual de progresso
- [ ] Email automático para admin (relacionamento@ckmtalents.net) e dina@ckmtalents.net quando aluno avança etapa
- [ ] Email para aluno quando mentor finaliza PDI, convidando a acessar e assinar o aceite
- [ ] Filtros por programa, empresa, status de onboarding
- [ ] Backend: procedure para listar alunos com status de onboarding
- [ ] Testes unitários

## Bug - Cursos Disponíveis redireciona para página gerencial (19/03/2026)
- [x] Corrigir: quando aluno/gerente clica em "Cursos Disponíveis" no mural, é levado para a página admin de gestão de cursos (/cursos) em vez da página do aluno (/meus-cursos)

## Onboarding Tracking (Admin) - 19/03/2026
- [x] Criar página admin "Acompanhamento de Onboarding" com régua de progresso de 6 etapas
- [x] Etapas: Convite Enviado → Cadastro Preenchido → Teste Realizado → Mentoria Agendada → PDI Publicado → Termo Assinado
- [x] Backend: db helper getOnboardingTrackingList para listar alunos com progresso
- [x] Backend: tRPC procedure onboardingTracking.list (admin only)
- [x] Frontend: cards de estatísticas (Total, Concluídos, Em Progresso, Não Iniciados)
- [x] Frontend: filtros por nome/email, programa e status
- [x] Frontend: lista expansível com régua de progresso visual por aluno
- [x] Email automático: admin + dina@ckmtalents.net recebem notificação quando aluno avança etapa
- [x] Email automático: aluno recebe convite para acessar plataforma e assinar aceite quando mentor publica PDI
- [x] Sidebar: item "Onboarding Tracking" adicionado no grupo Alunos (admin)
- [x] Rota /onboarding-tracking registrada no App.tsx
- [x] Vitest: testes para onboardingTracking.list (admin access, student rejection, shape validation)
- [x] Templates de email: buildOnboardingStepEmail e buildPdiPublishedInviteEmail criados

## Lembretes Automáticos de Onboarding (24h) - 19/03/2026
- [x] Criar template de email motivacional: "Estamos te esperando para realizar o [etapa]... seguir na trilha é uma grande conquista"
- [x] Criar cron job que roda a cada hora verificando alunos parados há 24h+ na mesma etapa
- [x] Adicionar campo lastReminderSentAt na tabela onboarding_jornada para evitar spam (usando emailAlertasLog)
- [x] Enviar lembrete apenas 1x por etapa pendente (a cada 24h sem avanço)
- [x] Vitest para a lógica de lembretes

## Correção Onboarding Tracking - Filtrar alunos sem PDI - 19/03/2026
- [x] Filtrar lista de onboarding para mostrar APENAS alunos que NÃO têm PDI publicado
- [x] Alunos com PDI não devem aparecer na lista nem receber lembretes automáticos
- [x] Ajustar etapas da régua: remover "PDI Publicado" (pois quem tem PDI sai da lista)
- [x] Atualizar contadores (Total, Concluídos, Em Progresso, Não Iniciados) para refletir filtro

## Melhorias Onboarding Tracking - 19/03/2026- [x] Ordenar lista por data de cadastramento (mais recentes primeir- [x] Adicionar botão de reenvio manual de convite para alunos que não iniciaram cad- [x] Incluir coluna de "dias parado" mostrando há quantos dias o aluno está na mesma etapa- [x] Corrigir lógica de etapas para ser cumulativa (se etapa posterior está ok, anteriores também devem estar)
- [x] Corrigir: "Convite Enviado" deve ser sempre true para todos os alunos (existência no sistema = convite enviado)
- [x] Bloquear etapas "Mentora" e "Agendamento" no onboarding do aluno quando já tem reunião agendada (impedir agendar 2x)
- [x] Corrigir link nos emails de lembrete de onboarding: deve apontar para https://ecolider.evoluirckm.com em vez do Manus
- [x] Excluir alunos em fase de onboarding (sem PDI) do cron de alertas de mentoria (30 dias sem sessão)
- [x] Corrigir link nos emails de mentoria: usar ecolider.evoluirckm.com em vez de Manus
- [x] Corrigir link no reenvio de convite: usar ecolider.evoluirckm.com em vez de Manus
- [x] Corrigir import use-toast no OnboardingTracking.tsx (já estava correto com sonner)
- [x] Corrigir: emails de avanço de onboarding agora usam CC para dina@ckmtalents.net (envio único em vez de loop separado)

## Alerta de Vencimento de Ciclo (Macrociclo) - 19/03/2026
- [x] Criar cron job automático que verifica diariamente vencimento de macrociclos
- [x] Enviar alertas em 30, 15 e 7 dias antes do vencimento do macroTermino
- [x] Enviar email para admin (relacionamento@ckmtalents.net) com CC para dina@ckmtalents.net
- [x] Enviar email para o aluno avisando que seu ciclo está terminando
- [x] Enviar email para o mentor do aluno
- [x] Template de email com: nome do aluno, programa/empresa, trilha, data de término, dias restantes
- [x] Registrar cron no servidor (startup)
- [x] Escrever testes unitários para o cron de vencimento

## Bug: Aluna cancelada ainda consegue acessar - 19/03/2026
- [x] Investigar por que Adriana Pereira de Deus ainda acessa o sistema após cancelamento
- [x] Corrigir fluxo de login para bloquear alunos com isActive=0 ou canLogin=0
- [x] Desativar conta da Adriana no banco (users.isActive=0, alunos.canLogin=0)
- [x] Corrigir toggleAlunoStatus para sincronizar canLogin e users.isActive
- [x] Blindar createOrUpdateAlunoSession: verificar isActive do aluno antes de criar sessão
- [x] Blindar toggleAccessUserStatus: sincronizar isActive do aluno vinculado
- [x] Blindar passo 1 do login (users): verificar se aluno vinculado está ativo
- [x] Blindar customLogin: verificar isActive do user existente antes de criar sessão
- [x] Escrever testes para validar bloqueio de login de alunos inativos

## Relatório de Impacto (Evolução do Case de Sucesso) (20/03/2026)

### Schema e Banco de Dados
- [ ] Criar tabela relatorio_impacto no schema (alunoId, trilhaId, macrocicloId, oQueAprendi, oQueMudei, resultadoMensuravel, antesDepois, evidenciaUrl, evidenciaKey, notaMentora, comentarioMentora, status: pendente/enviado/avaliado, createdAt, updatedAt)
- [ ] Migrar banco de dados com pnpm db:push

### Backend - Endpoints tRPC
- [ ] Criar endpoint para aluno enviar relatório de impacto (submitRelatorioImpacto)
- [ ] Criar endpoint para aluno consultar seus relatórios (meusRelatoriosImpacto)
- [ ] Criar endpoint para mentora avaliar relatório (avaliarRelatorioImpacto - nota 1-5 + comentário)
- [ ] Criar endpoint para gestor listar relatórios da empresa (relatoriosImpactoEmpresa)
- [ ] Criar endpoint para admin listar todos os relatórios (relatoriosImpactoAdmin)
- [ ] Criar helpers no db.ts para CRUD de relatórios de impacto

### Frontend - Portal do Aluno
- [ ] Substituir upload de arquivo por formulário estruturado na seção Cases de Sucesso
- [ ] Formulário com 5 campos: O que aprendi, O que mudei, Resultado mensurável, Antes vs Depois, Evidência (upload opcional)
- [ ] Card por trilha com status: Pendente / Enviado / Avaliado pela mentora
- [ ] Visualização do relatório enviado com nota e comentário da mentora

### Frontend - Dashboard do Gestor
- [ ] Nova seção "Impacto do Programa" no Dashboard do Gestor
- [ ] Card resumo: X de Y alunos reportaram impacto prático (barra de progresso)
- [ ] Top 5 mudanças reportadas (nome aluno, competência, resultado mensurável)
- [ ] Filtro por turma/trilha
- [ ] Coluna "Impacto" na tabela de alunos (ícone verde/cinza)
- [ ] Ao clicar no aluno, mostrar relatório completo

### Frontend - Dashboard Admin / Mentora
- [ ] Aba "Relatórios de Impacto" no DashboardAluno (visão admin)
- [ ] Card "Relatórios de Impacto" na visão geral (contagem)
- [ ] Interface para mentora avaliar relatório (nota 1-5 estrelas + comentário)

### Relatório Excel
- [ ] Nova aba "Impacto Prático" nos relatórios exportados (Aluno, Empresa, Turma, Trilha, O que aprendeu, O que mudou, Resultado mensurável, Nota mentora)

### Testes
- [ ] Escrever testes vitest para endpoints de relatório de impacto
- [ ] Testar fluxo completo: envio pelo aluno, avaliação pela mentora, visualização pelo gestor

## Bug: Gestor puro vê página de mentor ao fazer login (20/03/2026)
- [x] Investigar por que gestor puro cadastrado visualiza a página como mentor ao fazer login
- [x] Corrigir fluxo de login/redirecionamento para gestor puro (sem vínculo de aluno)
- [x] Testar fluxo completo do gestor puro após correção
- [x] Bug: Gestores puros criados via createGerentePuro (Emanoel, Leandro) não aparecem na lista de gerentes em Cadastros
- [x] Corrigir query que carrega lista de gerentes para incluir todos os tipos de gestores puros
- [x] Adicionar proteção contra duplicação no createGerentePuro (verificar email existente)

## Campo de Pesquisa em Gerentes e Mentores (20/03/2026)
- [x] Adicionar campo de busca na aba de Gerentes (buscar por nome, email, CPF, empresa)
- [x] Adicionar campo de busca na aba de Mentores (buscar por nome, email, empresa)

## Bug: Gerente vê aba Financeiro (20/03/2026)
- [x] Esconder aba Financeiro do Demonstrativo de Sessões de Mentoria para gestores (apenas admin)

## Página de Boas-Vindas do Gestor Puro (20/03/2026)
- [x] Criar página de boas-vindas premium para gestor puro
- [x] Apresentar o Programa de Certificação de Liderança com visual impactante
- [x] Explicar cada item do menu e o que o gestor vai encontrar em cada página
- [x] Botão de solicitar reunião de apresentação (envia email para CKM)
- [x] Redirecionar gestor puro automaticamente para esta página ao logar
- [x] Registrar rota no App.tsx
- [x] Adicionar item "Boas-Vindas" no menu do DashboardLayout para gestor

## Onboarding - Lembrete Elio + Campos Obrigatórios (20/03/2026)
- [x] Enviar email de lembrete de onboarding para Elio (elio@dgsolucoesestrategicas.com.br)
- [x] Tornar minicurrículo obrigatório no onboarding (não permitir avançar sem preencher)
- [x] Tornar "Quem é você" obrigatório no onboarding (não permitir avançar sem preencher)

## Investigação: Dados da Julia Makiyama não aparecem completos (20/03/2026)
- [ ] Verificar assessment, competências, trilhas e metas da Julia no banco
- [ ] Identificar o que está faltando na tela de aluna

## Bug: Onboarding Julia - Trilha Basic não aparece (20/03/2026)
- [ ] Investigar por que a trilha Basic (3 competências) não aparece na Sua Jornada da Julia
- [ ] Corrigir query para mostrar todas as trilhas do assessment PDI no onboarding
- [ ] Verificar se o onboarding filtra por ciclo e exclui a trilha Basic

## Bug Fix - Onboarding PDI Multi-Trilha (20/03/2026)
- [x] Corrigir EtapaMeuPDI para mostrar TODAS as trilhas/macroJornadas (não apenas macroJornadas[0])
- [x] Consolidar totais de competências, sessões, metas de todas as trilhas no Hero Card
- [x] Agrupar competências por trilha com cabeçalho visual de cada trilha (cores distintas)
- [x] Corrigir Visão Geral para mostrar microciclos de todas as trilhas
- [x] Corrigir seção Recursos para usar todasCompetencias de todas as trilhas
- [x] Corrigir EtapaAceite para usar dados consolidados de todas as trilhas
- [x] Testes unitários para validar lógica multi-trilha (10 testes passando)

## Bloqueio de Menu até Aceite do Onboarding (20/03/2026)
- [x] Bloquear menu do aluno (Mural, Cursos, Atividades, Minhas Metas) até aceite do compromisso
- [x] Aplicar regra apenas para alunos cadastrados a partir de 15/03/2026
- [x] Redirecionar aluno para onboarding se tentar acessar páginas bloqueadas
- [x] Liberar menu completo após aceite do compromisso (etapa 8)
- [x] Testes unitários para validar lógica de bloqueio (15 testes passando)

## Refatoração da Etapa de Aceite do Onboarding (20/03/2026)
- [x] Adicionar botão "De Acordo" após assinatura do termo de compromisso
- [x] Adicionar botão "Gostaria de Rever" com campo de justificativa
- [x] Ao clicar "De Acordo": desbloquear menu automaticamente + enviar email de parabéns ao aluno + notificar mentora e admin
- [x] Ao clicar "Gostaria de Rever": abrir campo de justificativa + enviar email para mentora e admin
- [x] Botão "Gostaria de Rever" para o aluno pedir revisão do PDI (integrado no fluxo)
- [x] Garantir desbloqueio automático do menu após aceite (invalidar cache do onboardingStatus)
- [x] Testes unitários para o fluxo de aceite (13 testes passando)
- [x] Adicionar efeito de fogos de artifício (canvas-confetti) ao clicar "De Acordo"
- [x] Adicionar som de parabéns ao clicar "De Acordo"
- [x] Trocar toda referência de "recusar/recusa" por "gostaria de rever/revisão" (tom mais suave)

## Esconder aba Financeiro para Gerente (20/03/2026)
- [x] Esconder aba "Financeiro" no Demonstrativo de Sessões de Mentoria para o papel Gerente (já implementado - isAdmin guard)

## Melhorias Pós-Publicação (20/03/2026)
- [x] Verificar site publicado funcionando corretamente (login page OK)
- [x] Registrar solicitações de revisão do PDI no banco de dados (tabela onboarding_revisoes + limite 5)
- [x] Verificar página Meu PDI (fora do onboarding) para multi-trilha (já OK - itera sobre todas)

## Ajustes Consolidados - Prioridade Aluno → Mentor → Gestor (20/03/2026)

### ALUNO
- [x] Filtrar competências abaixo de 4 na autopercepção do assessment (ordem: Básicas → Essenciais → Master → Jornada do Futuro)

### MENTOR
- [x] Incluir campos de nível e meta ao cadastrar trilha/competência do aluno (campos já existiam no form, corrigido envio ao servidor)
- [x] Remover campo de quantidade de mentorias do formulário do PDI do mentor
- [x] Exibir dados do contrato (definidos pelo admin) no plano de desenvolvimento (componente ContratoInfoReadonly)
- [x] Exibir tempo de duração do contrato na página de assessment do mentor (ContratoInfoReadonly no card do aluno + Step 1 do diálogo)

### GESTOR
- [x] Corrigir cards da Home do Gerente para mostrar dados reais da equipe (Colaboradores, Sessões Realizadas, Progresso Médio, Trilhas Ativas)
- [x] Corrigir filtro de alunos no relatório individual do gerente (fix: usar consultorRole em vez de consultorId para distinguir mentor de gerente)
- [x] Investigar e corrigir erro no Fale Conosco (fix: system.notifyOwner mudado de adminProcedure para protectedProcedure)
- [x] Adicionar texto informativo "(clique sobre o nome do aluno...)" no Demonstrativo de Mentorias
- [x] Ajustar cards do Gerente: Volume de Colaboradores, Total de Mentorias, Total de Competências Desenvolvidas + Principais Competências

## Painel de Revisões PDI e Notificações (20/03/2026)
- [x] Criar função getOnboardingRevisoesEnriquecidas no db.ts (dados enriquecidos com aluno, mentor, programa)
- [x] Criar rotas tRPC: listarRevisoes, contarRevisoesPendentes, responderRevisao (onboarding router)
- [x] Criar página PainelRevisoes.tsx (admin/mentor) com filtros por status, busca, cards de stats, dialog de resposta
- [x] Adicionar rota /painel-revisoes no App.tsx
- [x] Adicionar "Painel de Revisões PDI" no menu do admin (grupo Alunos) e do mentor
- [x] Criar notificações in-app para mentor e admins quando aluno solicita revisão do PDI
- [x] Testes unitários para permissões (notifyOwner, listarRevisoes, contarRevisoesPendentes) - 8 testes passando

### Pergunta do Usuário: Principais Competências Trabalhadas
- [x] Verificar se o card "Principais Competências" já está implementado na Home do Gestor (já estava - exibe top competências da equipe)

## Correção de Pendências Anteriores - Impacto nos Alunos (20/03/2026)

### Bugs Visuais
- [x] Header do Portal do Aluno mostra "Usuário" em vez de "Aluno" → AUDITADO: NÃO EXISTE. grep retorna zero ocorrências no portal do aluno.
- [x] Bug sidebar: texto "Painel Inicial" sobrepõe "Alunos" → AUDITADO: NÃO REPRODUZÍVEL. Sidebar usa shadcn padrão sem CSS de sobreposição.

### Cálculo de Indicadores
- [x] Indicadores 4 e 5 mostram 0% → CORRIGIDO: dataSessao faltante em 2 rotas (visaoGeral e performanceFiltrada). Precisa validar com usuário.
- [x] Nota competência: usar mediaAvaliacoesRespondidas → AUDITADO: JÁ CORRETO no V2 calculator.
- [x] Conclusão de competência: usar aulasConcluidas >= aulasDisponiveis → AUDITADO: JÁ CORRETO (linha 303 do V2).
- [x] Ind. 4 (Tarefas) calcular por macrociclo → AUDITADO: JÁ IMPLEMENTADO no V2 (linhas 443-498).
- [x] Ind. 1 (Webinars) calcular por macrociclo → AUDITADO: JÁ IMPLEMENTADO no V2.
- [x] Discrepância Ind. 4 Joseane → CORRIGIDO INDIRETAMENTE pelo fix de dataSessao. Deve mostrar ~70%.
- [x] Tarefas zeradas da aluna Millena → CORRIGIDO INDIRETAMENTE pelo fix de dataSessao. Deve mostrar ~50%.

### Funcionalidades Quebradas
- [x] Envio de Case de Sucesso não funciona → AUDITADO: JÁ FUNCIONAL. Rota cases.enviar completa + frontend com dialog.
- [x] Seção Ciclo em Andamento não aparece → AUDITADO: JÁ FUNCIONAL. Código completo. Se não aparece, é problema de datas dos microciclos.
- [x] Competência Wandemberg "Raciocínio Lógico" sem barra → AUDITADO: PROBLEMA DE DADOS. Competência não existe na student_performance.

### Onboarding / Dados
- [x] Trilha Basic da Julia no onboarding → AUDITADO: DADOS CORRETOS no banco. Precisa validar com usuário qual Julia exata.
- [x] Bug: possível criar PDI para aluno inativado → CORRIGIDO: guard adicionado no assessment.criar.
- [x] Bug: possível ativar aluno vinculado a empresa desativada → CORRIGIDO: guard adicionado no toggleAlunoStatus.
- [x] Campos importação zerados → AUDITADO: DADOS DA FONTE. mediaAvaliacoesFinais vem zero da plataforma de cursos. Código de importação está correto.

## Itens do Relatório do Usuário - Impacto nos Alunos (20/03/2026)

### 2.1 Portal do Aluno - Dados Fake (linhas 1071-1076)
- [ ] Verificar e remover dados fake de webinários no PortalAluno
- [ ] Verificar e remover dados fake de tarefas práticas no PortalAluno
- [ ] Verificar e remover dados fake de cursos no PortalAluno
- [ ] Verificar e remover dados fake de sessões de mentoria no PortalAluno
- [ ] Verificar e remover dados fake de trilha/competências no PortalAluno
- [ ] Verificar e remover dados fake de mentoras no Onboarding

### 2.2 Cálculo de Indicadores (linhas 1211-2263)
- [ ] Verificar Ind. 4 e 5 zerados (dataSessao já corrigido, validar resultado)
- [ ] Verificar nota competência usa campo correto (auditado: já correto no V2)
- [ ] Verificar Ind. 4 por macrociclo (auditado: já implementado no V2)
- [ ] Verificar Ind. 1 por macrociclo (auditado: já implementado no V2)
- [ ] Verificar discrepância Ind. 4 Joseane (dataSessao fix deve resolver)
- [ ] Verificar tarefas zeradas Millena (dataSessao fix deve resolver)

### 2.3 Onboarding Julia (linhas 2789-2795)
- [ ] Verificar trilha Basic da Julia no onboarding
- [ ] Verificar dados da Julia no banco

### 2.4 Bugs que Afetam Alunos
- [ ] Verificar header "Usuário" no Portal (auditado: não encontrado)
- [ ] Verificar envio de Case de Sucesso (auditado: já funcional)
- [ ] Verificar Ciclo em Andamento (auditado: já funcional, problema de datas)
- [ ] Verificar competência Wandemberg sem barra (auditado: problema de dados)
- [ ] Verificar PDI aluno inativo (já corrigido: guard adicionado)
- [ ] Verificar campos importação zerados (auditado: dados da fonte)

### 2.5 Funcionalidades Futuras Aluno
- [ ] Implementar sistema de presença + reflexão do aluno por webinar
- [ ] Implementar alertas visuais de encerramento de microciclos
- [ ] Implementar card de metas no Portal e Mural do aluno

## Plano Consolidado - Itens que Impactam o MENTOR (20/03/2026)

- [x] 2.1: Incluir nível e meta ao cadastrar trilha do aluno (formulário do mentor) - campos nivelAtual, metaFinal, metaCiclo1, metaCiclo2, justificativa no NovoAssessment Step 2
- [x] 2.2: Remover campo de quantidade de mentorias do formulário do PDI do mentor - removido de Assessment.tsx e PlanoIndividual.tsx
- [x] 2.3: Exibir tempo de duração do contrato no assessment (card informativo com início, fim, duração, sessões e tipo mentoria)
- [x] Adicionar campo "Total de Sessões Contratadas" no formulário de cadastro de aluno novo (Onboarding)
- [x] Garantir que período do contrato e total sessões sejam salvos corretamente no backend ao cadastrar aluno (createAluno cria registro em contratosAluno)
- [x] Remover botão/formulário "Cadastro Direto de Aluno" da aba Alunos (manter apenas "Cadastrar Aluno para Onboarding")
- [x] Incluir campo "Tipo de Mentoria" (Individual ou Grupo) no formulário de cadastro do aluno
- [x] Exibir tipo de mentoria e total de sessões contratadas no card informativo do Assessment (visível para o mentor)
- [x] Exibir tipo de mentoria e total de sessões contratadas no Plano de Desenvolvimento do aluno (PlanoIndividual header + DashboardMeuPerfil contrato card)

## Plano Consolidado - Bloco 3 (Prioridade Média) + Bloco 1 restante (20/03/2026)

- [x] 1.1: Cards do Gerente (Leandro) mostram dados individuais em vez da equipe - AUDITADO: JÁ RESOLVIDO. BoasVindasGestor usa gestorTeamStats com dados da equipe
- [x] 3.1: Atividades Práticas - verificar números + adicionar filtros (empresa, turma, mentor, período, status, busca) + acesso para mentor
- [x] 3.2: Demonstrativo de Mentorias - texto informativo para o gerente (já implementado)
- [x] 3.3: Painel de revisões para admin/mentora (já implementado)
- [x] 1.2: Relatório Individual - filtro de alunos do gerente (já corrigido)
- [x] 1.3: Gestor não consegue enviar email Fale Conosco (já corrigido)
- [x] Bug: Na área do aluno, a tarefa não mostra o nome atribuído pelo mentor (customTaskTitle ou nome da biblioteca) - corrigido na sessão anterior

## Atividades Práticas - Acesso para Admin e Mentor (20/03/2026)
- [x] Página Atividades Práticas acessível para admin e mentor (aluno já tem página própria)
- [x] Backend: mudar practicalActivities.submissions de adminProcedure para protectedProcedure com lógica de escopo por role
- [x] Mentor: vê apenas atividades dos seus alunos (filtro automático por consultorId)
- [x] Admin: vê todas as atividades (como já funciona)
- [x] Remover guard isAdmin no frontend que bloqueia mentor
- [x] Adicionar filtros completos: empresa, turma, mentor, período, status, busca + botão Limpar Filtros
- [x] Filtro Mentor visível apenas para admin (mentor já tem escopo automático)
- [x] 29 testes unitários passando (permissões + filtros)

## Bug: Gerente EMBRAPII na lista de alunos da mentora Adriana (20/03/2026)
- [x] Investigar se gerentes puros estão cadastrados na tabela alunos e vinculados a mentores - INVESTIGADO: Alexandre é aluno legítimo com sessões de mentoria com Adriana, não é gerente. Falso alarme confirmado pela usuária.

## Plano Consolidado - Bloco 4 (Prioridade Baixa) - Pendências Antigas (20/03/2026)

- [x] 4.1a: Investigação Julia - verificar assessment, competências, trilhas e metas no banco - JÁ RESOLVIDO (fix multi-trilha anterior). Dados consistentes: 2 PDIs, 4 competências, 2 metas, DISC ok
- [x] 4.1b: Badge/alerta no painel da mentora quando aluno solicitar revisão do PDI - Badge vermelho pulsante no menu 'Painel de Revisões PDI' (admin + mentor), atualiza a cada 30s
- [x] 4.1c: Implementar parsers para planilhas de Eventos (SEBRAE ACRE, SEBRAE TO, EMBRAPII) - JÁ IMPLEMENTADO no excelProcessor.ts (função processEventsSheet)
- [x] 4.1d: Dashboard por Turma - implementar visão por Turma nos dashboards - JÁ IMPLEMENTADO (DashboardGestor + DashboardEmpresa já têm visão porTurma)

## Painel de Revisões PDI - Filtros (20/03/2026)
- [ ] Adicionar filtros ao Painel de Revisões PDI (programa, mentor, aluno, período) para facilitar visualização quando houver muitos registros
- [x] Backend: mentor deve ver apenas revisões dos seus próprios alunos (não todas)
- [x] Badge: contar apenas revisões pendentes dos alunos do mentor (não todas)

## ajustes20.docx - Novos Ajustes (20/03/2026)

- [x] A20-1: Quando mentora finaliza plano individual do aluno, tela do onboarding muda para "Reunião Realizada em XX/XX/XXXX"
- [x] A20-2: Renomear títulos no Plano Individual: "Nível Atual" → "Nível Identificado"; "Meta Ciclo 1/Ciclo 2" → "Evolução no Período 1/2" - Atualizado em 4 arquivos (Assessment, NovoAssessment, EditAssessmentDialog, OnboardingAluno)
- [x] A20-3: Remover botões "Etapas" e "Recursos" do portal do aluno (já explicado nos vídeos de Sua Jornada)
- [x] A20-4: Na página "Sua Jornada", incluir abaixo de cada vídeo um botão para acessar texto explicativo (acessibilidade para deficientes auditivos) + campo textoExplicativo adicionado ao banco
- [x] A20-5: Corrigir fluxo completo de onboarding:
  - [x] Fix: aluno com PDI mas sem aceite deve continuar no onboarding (não marcar como concluído)
  - [x] Cores: Azul = etapa concluída (congelada, só visualização), Vermelho = etapa não habilitada (não abre nada)
  - [x] Meu PDI e Aceite só habilitam quando mentora cria o PDI
  - [x] Sua Jornada pode ser acessada enquanto aguarda o encontro
  - [x] 1º Encontro: trocar 'Agendado em' por 'Realizado em' quando mentora registra presença
  - [x] Portal do aluno (Mural, Cursos, etc.) bloqueado até aceite ser dado
  - [x] Etapas concluídas ficam congeladas (só visualização)
  - [x] Etapas não habilitadas não abrem nada
  - [x] IMPORTANTE: Mudanças só afetam alunos novos (a partir de 01/03/2026), veteranos não são afetados
- [x] A20-6: Botão de etapa pendente do onboarding em VERMELHO e PISCANDO (implementado no OnboardingStepper com cores azul/vermelho/cinza)
- [x] A20-7: Perguntas sobre Case de Sucesso: RESPONDIDO - Ninguém é notificado (pode ser adicionado). Pontuação: Entregue=100 (Ind.6), +10% bônus Ind.5, não entra na média
- [x] A20-8: Cor do menu e da página de boas vindas do líder/gerente precisam ser do mesmo tom de azul

## Funcionalidade: Admin liberar onboarding para veterano (20/03/2026)
- [ ] Criar painel no admin para selecionar quais etapas do onboarding reabrir para um aluno veterano
- [ ] Etapas selecionáveis: Cadastro, Assessment, Mentora, Agendamento, 1º Encontro, Sua Jornada, Meu PDI, Aceite
- [ ] Aluno veterano com onboarding reaberto volta a ter acesso às etapas selecionadas
- [ ] Etapas não selecionadas ficam como concluídas (azul, somente visualização)

## A20-8: Cores do Gestor - Identidade Visual Logo (20/03/2026)
- [x] Sidebar do gestor: mudar cores para roxo (#5B3A7D) + turquesa (#3BBFBF) do logo
- [x] Página Boas-Vindas do gestor: mudar cores para roxo + turquesa do logo
- [ ] Manter cores dos outros perfis (admin, mentor, aluno) inalteradas por enquanto

## A20-8 Revisão: Ajuste de cores conforme feedback do usuário (20/03/2026)
- [x] Sidebar GLOBAL: mudado de navy blue para roxo (#5B3A7D) para TODOS os perfis
- [x] Página Boas-Vindas: removido hero escuro, agora usa fundo claro/branco
- [x] Página Boas-Vindas: letras em roxo (#5B3A7D) e azul celeste (#3BBFBF)
- [x] Página Boas-Vindas: layout conforme print - badge turquesa, nome em turquesa, stats cards à direita com bordas
- [x] Fundo claro mantido nas demais páginas do gestor

## Consistência Visual: Cores roxo/turquesa em todos os títulos (21/03/2026)
- [x] Aplicar cores roxo (#5B3A7D) e turquesa (#3BBFBF) nos títulos de todas as páginas do admin
- [x] Aplicar cores roxo/turquesa nos títulos de todas as páginas do mentor
- [x] Aplicar cores roxo/turquesa nos títulos de todas as páginas do gestor (exceto Boas-Vindas já feito)
- [x] Aplicar cores roxo/turquesa nos títulos de todas as páginas do aluno
- [x] Verificar consistência visual em todas as páginas (via CSS global em index.css)

## Funcionalidade: Liberar Onboarding para Veteranos (21/03/2026)
- [x] Analisar sistema de onboarding existente (schema, routers, fluxo) - já existe procedure individual
- [x] Backend: criar procedure de liberação em massa (array de alunoIds)
- [x] Frontend: adicionar checkboxes de seleção na lista de alunos
- [x] Frontend: botão "Liberar Onboarding em Massa" com confirmação
- [x] Frontend: seleção automática de todos elegíveis (checkbox "Selecionar todos")
- [x] Testar compilação e funcionalidade (vitest 3/3 passed, TypeScript OK)

## Reformular Case de Sucesso como Relatório de Impacto (21/03/2026)
- [x] Analisar sistema atual de Case de Sucesso (schema, routers, páginas)
- [x] Schema: adicionar campos estruturados (oQueAprendi, oQueMudei, resultadoMensuravel, evidenciaUrl, antesVsDepois)
- [x] Backend: atualizar procedures de envio/visualização do Relatório de Impacto
- [x] Backend: adicionar notificação automática ao admin/mentor/GESTOR quando aluno enviar
- [x] Frontend aluno: formulário estruturado com os 5 campos obrigatórios
- [x] Frontend admin/mentor: visualização detalhada do Relatório de Impacto (renomeado em todas as páginas)
- [x] Testes vitest para as novas procedures (7/7 passed)

## Bug: Stepper do Onboarding - Etapas já concluídas reabrem como vazias
- [x] Bug: quando aluno já na fase Aceite clica em "Cadastro" no stepper, a tela reabre como se não tivesse preenchido
- [x] Investigar lógica do stepper: como determina qual etapa mostrar quando clica em etapa anterior
- [x] Corrigir: etapas já concluídas mostram dados preenchidos em readOnly + banner "Voltar para etapa atual" (13 testes passando)

## Bug PERSISTENTE: Stepper do Onboarding - Correção anterior não funcionou em produção
- [ ] Investigar: print mostra Leandro logado em ecolider.evoluirckm.com/onboarding com stepper em step 1 (Cadastro ativo, demais com cadeado)
- [ ] Hipótese 1: progressoData.step retorna 1 porque cadastroConfirmado é false no banco
- [ ] Hipótese 2: a tabela onboarding_jornada não tem registro para este aluno
- [ ] Hipótese 3: o aluno tem perfil dual e o alunoId não está sendo resolvido corretamente
- [ ] Corrigir definitivamente o bug

## Bug CRÍTICO: Leandro (gerente) vendo tela de onboarding de aluno
- [ ] Investigar: Leandro é gerente mas está vendo /onboarding com stepper de aluno
- [ ] Verificar roteamento: por que gerente é direcionado para OnboardingAluno
- [ ] Verificar no banco: Leandro tem perfil dual (gerente + aluno)?
- [ ] Corrigir: gerente não deve ver tela de onboarding de aluno

## Bug Visual do Stepper: ícones voltam a vermelho/cadeado ao clicar em etapa anterior
- [x] O banner "Etapa já concluída" aparece (correção parcial funcionou)
- [x] Stepper visual agora usa progressStep para manter ícones azuis/concluídos
- [x] Causa corrigida: OnboardingStepper agora recebe progressStep e usa effectiveStep
- [x] Corrigido: progressStep passado para o stepper, determina ícones concluídos
- [x] Bug: etapas concluídas agora permitem navegação e abrem em readOnly
- [x] Causa corrigida: removido bloqueio de steps 3/4, agora qualquer step <= progressStep é navegável

## Bug: Botão "Explorei meu PDI" não avança para Aceite
- [x] Botão "Explorei meu PDI" na etapa 7 não avança para etapa 8 (Aceite) - CORRIGIDO: adicionado onComplete() após marcarPdi
- [x] Verificado: TODAS as 8 etapas chamam onComplete() corretamente
- [x] Causa raiz: handleVisualizar marcava pdiVisualizado mas não chamava onComplete()

## Correções no Resumo do Plano (Onboarding - Etapa Aceite)
- [x] Webinares: calcular com base no período do contrato (2 webinares por mês)
- [x] Mentorias: buscar totalSessoesContratadas + tipoMentoria do cadastro/contrato do aluno (campos já existiam no sistema)
- [x] Mentorias: mostrar tipo (individual/grupal) ou se contrato não tem mentoria
- [x] Tarefas: igual ao número de mentorias, com texto informando que depende da liberalidade da mentora
- [x] Meta de Certificação: adicionar seção LÍDER NÍVEL I - CERTIFICADO com requisitos (evidências + 80% engajamento + 80% desafios)

## Edição de Cadastro do Aluno - Campos de Contrato
- [x] Adicionar campos no formulário de edição: totalSessoesContratadas, tipoMentoria, contratoInicio, contratoFim
- [x] Atualizar backend para salvar esses campos na edição do aluno
- [x] Adicionar totalSessoesContratadas na tabela alunos (schema + migration)
- [x] Criar contrato virtual no getJornadaCompleta quando aluno tem dados inline mas não tem registro em contratos_aluno
- [x] 23 testes vitest passando

## Bugs Reportados - Resumo do Plano
- [x] BUG: totalSessoesContratadas não salva ao editar aluno no formulário (faltava tipoMentoria/totalSessoesContratadas no db.ts updateAluno)
- [x] BUG: Webinares mostra 2 em vez de ~10 (contrato virtual não era criado quando totalSessoes=0 mas tinha datas)
- [x] BUG: Término mostra abr.26 em vez de set.26 (mesma causa: contrato virtual não criado, fallback usava datas do PDI)
- [x] BUG: Mentorias mostra "Sem mentoria" (mesma causa: save não funcionava + contrato virtual não criado)

## BUG CRÍTICO (reportado 3+ vezes) - Mentorias não salva
- [x] BUG: totalSessoesContratadas e tipoMentoria - CONFIRMADO que salva corretamente (Julia tem totalSessoesContratadas=6 no banco)
- [x] Mostrar info de mentorias (tipo + quantidade) na listagem expandida do aluno em AdminCadastros

## BUG - Meses de Jornada mostra 1 em vez de 5 (deve usar contrato)
- [x] Card "Meses de Jornada" no EtapaMeuPDI agora usa datas do CONTRATO (prioridade), fallback para PDI
- [x] Mostrar info de mentorias (tipo + quantidade) na listagem expandida do aluno em AdminCadastros

## BUG - Área do Mentor: Contrato mostra "Nenhum contrato registrado"
- [x] Seção Contrato no Plano Individual do mentor mostra dados inline do aluno como fallback
- [x] Exibir contrato inline (contratoInicio, contratoFim, totalSessoesContratadas, tipoMentoria) quando não há registro em contratos_aluno

## Área do Mentor - Mostrar dados do contrato inline
- [x] Seção Contrato no Plano Individual: mostrar dados inline do aluno quando não há registro em contratos_aluno
- [x] Badge de sessões contratadas + período do contrato no card do aluno mesmo sem contratos_aluno
- [x] ContratoInfoReadonly: mostra dados inline do aluno (período, sessões, tipo mentoria) como fallback em todas as telas

## Ampliar textos da Meta de Certificação LÍDER NÍVEL I
- [x] Evidências: "Comprovar através de cases reais de aplicabilidade de cada jornada"
- [x] Engajamento: "Engajamento mínimo de 80% com a participação nos webinares, mentorias, cursos e tarefas"
- [x] Desafios: "Cumprimento das metas desafiadoras que foram assumidas no início da jornada"

## BUG - getAllAlunosForAdmin não retornava totalSessoesContratadas e tipoMentoria
- [x] Adicionados campos totalSessoesContratadas e tipoMentoria ao select de getAllAlunosForAdmin

## Textos descritivos da Meta de Certificação no Portal do Aluno
- [x] Adicionar abaixo dos cards de indicadores (Webinars, Avaliações, Competências, Tarefas, Engajamento, Case) os textos:
  - Evidências: "Comprovar através de cases reais de aplicabilidade de cada jornada"
  - Engajamento: "Engajamento mínimo de 80% com a participação nos webinares, mentorias, cursos e tarefas"
  - Desafios: "Cumprimento das metas desafiadoras que foram assumidas no início da jornada"

## Aba Cursos no Portal do Aluno - redirecionar para link externo
- [x] Aba "Cursos" no Portal do Aluno deve redirecionar para https://sebraeto.competenciasdobem.com.br/auth/signin

## Renomear aba Cursos para Mini_Cursos
- [x] Trocar label "Cursos" para "Mini_Cursos" no header (AlunoLayout) e na aba de tabs (DashboardMeuPerfil)

## Correção - Menu header Cursos deve permanecer original
- [x] Reverter AlunoLayout: aba "Cursos" no menu header volta ao original (label "Cursos", sem externalUrl, navega para /meus-cursos)

## Indicador 6 - Aplicabilidade Prática (nova funcionalidade)
- [x] Schema: adicionar campos notaAlunoAplicabilidade (int 0-10), textoAplicabilidade (text) na tabela de tarefas do aluno
- [x] Schema: adicionar campos notaAlunoAplicabilidade (int 0-10), notaMentoraAplicabilidade (int 0-10) na tabela cases_sucesso
- [x] Schema: adicionar campo notaMentoraAplicabilidade (int 0-10) na tabela de tarefas/entregas do aluno
- [x] Backend: procedure para salvar aplicabilidade na conclusão de tarefa
- [x] Backend: procedure para mentora avaliar aplicabilidade ao fechar sessão
- [x] Backend: procedure para calcular Indicador 6 (média 60% mentora + 40% aluno)4/2026)
- [x] Frontend aluno: formulário de aplicabilidade na conclusão de tarefa (texto + nota 0-10, obrigatório)
- [x] Frontend aluno: formulário de aplicabilidade no case (nota 0-10)
- [x] Frontend mentora: avaliação obrigatória de aplicabilidade ao fechar sessão de mentoria
- [x] Frontend Portal do Aluno: card "Aplicabilidade Prática" ao lado de Engajamento e Desenvolvimento
- [x] Cores do card: verde (>=80%), amarelo (60-79%), vermelho (<60%)
- [x] Bônus +10% engajamento se Ind. 6 entre 8-10
- [x] Corte temporal: só tarefas e cases a partir de 01/04/2026
- [x] Nota provisória do aluno com badge "Pendente de avaliação da mentora"
- [x] Renomear Ind. 6 de "Case (Bônus)" para "Aplicabilidade Prática"
- [x] Enviar e-mail para aluna do case existente (alunoId 30098) pedindo para preencher novo formulário

## Instruções para mentora na seção Atividade Prática / Tarefa
- [x] Mostrar no "Status da Tarefa" qual foi a tarefa solicitada na sessão anterior (ou se não houve)
- [x] Adicionar texto instrucional claro na seção "Atividade Prática / Tarefa" orientando que é para definir tarefa para o PRÓXIMO encontro

## Reorganização do formulário de Registro de Sessão de Mentoria
- [x] Separar formulário em PARTE 1 (Registro da Sessão Atual) e PARTE 2 (Tarefa para o Próximo Encontro)
- [x] Na Parte 1: mostrar qual era a tarefa da sessão anterior (se houve) antes do Status da Tarefa
- [x] Na Parte 2: mover TaskSelector para baixo com título "Tarefa para o Próximo Encontro" e instruções claras
- [x] Aplicar mesma reorganização no formulário de edição de sessão

## Exibir registro de aplicabilidade do aluno na seção de Avaliação da mentora
- [x] Mostrar na seção "Avaliação de Aplicabilidade Prática" o texto que o aluno registrou (aplicabilidade prática)
- [x] Mostrar a nota que o aluno se deu (0-10) para sua própria aplicação
- [x] Indicar visualmente se o aluno já preencheu ou não o registro de aplicabilidade
- [x] Aplicar tanto no formulário de nova sessão quanto no de edição

## Melhorias na Aplicabilidade Prática (Sessão de Mentoria)
- [x] Tornar avaliação da mentora obrigatória quando aluno entregou tarefa com registro de aplicabilidade (impedir salvar sem nota)
- [x] E-mail automático 48h antes da sessão agendada lembrando o aluno de registrar aplicabilidade prática
- [x] Comparativo visual nota do aluno vs nota da mentora lado a lado na visualização da sessão

## Exibir evidência de entrega do aluno na Avaliação da Tarefa
- [x] Mostrar na seção "Avaliação da Tarefa da Sessão Anterior" se o aluno já enviou evidência de entrega
- [x] Exibir link de evidência, imagem, relato do aluno e data/hora de submissão
- [x] Aplicar tanto no formulário de nova sessão quanto no de edição

## Adicionar envio de comprovação nas Tarefas Práticas Atribuídas (Portal do Aluno)
- [x] Adicionar botão "Enviar Comprovação" dentro de cada tarefa expandida na seção "Tarefas Práticas Atribuídas" (aba Mentorias) [JÁ EXISTIA - corrigido taskStatus no backend]
- [x] Incluir campos: link de evidência, imagem (upload), relato, aplicabilidade prática (texto + nota 0-10) [JÁ EXISTIA]
- [x] Conectar ao backend existente (submitEvidence, submitRelato, submitAplicabilidade) [JÁ EXISTIA]
- [x] Mostrar status de envio (já enviado vs pendente) dentro da tarefa expandida [CORRIGIDO: taskStatus agora é nao_entregue quando tarefa é atribuída]

## Remoção de seção obsoleta
- [x] Remover seção "Como enviar suas atividades" da aba Tarefas do Portal do Aluno (instrução de salvar na nuvem e compartilhar por e-mail é desnecessária)

## Correção de texto do card Aplicabilidade
- [ ] Corrigir texto e tooltip do card Aplicabilidade no dashboard do aluno para dizer que é o cálculo da aplicabilidade das tarefas e dos cases entregues

## Melhorias Solicitadas (23/03/2026)
- [x] Unificar cadastro admin + onboarding: admin deve ver e editar TODOS os campos do aluno (incluindo telefone, cargo, área de atuação, minicurrículo, quem é você)
- [x] Dados visíveis para admin, mentor e aluno devem ser os mesmos (consistência)
- [x] Mentora ver nome completo, email e telefone de quem agendou na página de agendamento
