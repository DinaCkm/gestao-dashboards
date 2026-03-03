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
