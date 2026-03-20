# Auditoria de Pendências - Verificação Antes de Agir

Data: 20/03/2026

## Metodologia
Para cada item, verificar no código/dados se já foi resolvido antes de fazer qualquer alteração.

## Items a Auditar

### 1. Header "Usuário" em vez de "Aluno"
- Status: **JÁ RESOLVIDO / NÃO EXISTE**
- Verificação: grep em todos os .tsx do portal do aluno (AlunoLayout, DashboardMeuPerfil, DashboardAluno, OnboardingAluno) retorna ZERO ocorrências. "Usuário" só aparece em páginas admin (Users.tsx, AdminCadastros.tsx) onde é correto.
- Ação: Nenhuma necessária

### 2. Sidebar "Painel Inicial" sobrepõe "Alunos"
- Status: **NÃO REPRODUZÍVEL NO CÓDIGO**
- Verificação: A sidebar usa SidebarMenu + Collapsible padrão do shadcn/ui. "Painel Inicial" (linha 496) é um item fixo no topo, e "Alunos" é um grupo colapsável abaixo. Não há CSS de sobreposição (position absolute/fixed). Pode ter sido um bug visual temporário em tela específica.
- Ação: Nenhuma necessária - layout está correto

### 3. Indicadores 4 e 5 mostram 0%
- Status: **PARCIALMENTE CORRIGIDO NESTA SESSÃO**
- Verificação: O bug era que 2 rotas (visaoGeral linha 1836 e performanceFiltrada linha 2460) não passavam `dataSessao` no MentoringRecord. Sem dataSessao, o filtro por macrociclo não funcionava corretamente (fallback incluía TODAS as sessões). Agora todas as 6 rotas passam dataSessao.
- Ação: Já corrigido nesta sessão. Precisa validar com dados reais.

### 4. Nota competência: mediaAvaliacoesRespondidas vs progressoTotal
- Status: **JÁ CORRETO NO V2**
- Verificação: O V2 calculator (indicatorsCalculatorV2.ts) usa `notaAvaliacao` dos PerformanceRecords (que vem de `mediaAvaliacoesRespondidas` via getStudentPerformanceAsRecords). O campo `progressoTotal` é usado apenas para barra de progresso visual, não para cálculo de indicadores.
- Ação: Nenhuma necessária

### 5. Conclusão competência: aulasConcluidas >= aulasDisponiveis
- Status: **JÁ CORRETO NO V2**
- Verificação: indicatorsCalculatorV2.ts linha 303: `const concluida = aulasDisponiveis > 0 && aulasConcluidas >= aulasDisponiveis;` - exatamente a lógica correta.
- Ação: Nenhuma necessária

### 6. Ind.4 e Ind.1 por macrociclo
- Status: **JÁ IMPLEMENTADO NO V2**
- Verificação: indicatorsCalculatorV2.ts linhas 443-498 calculam Ind.1, Ind.4 e Ind.5 pelo MACROCICLO (período da jornada), não pelo microciclo. Ind.2 e Ind.3 são por microciclo (correto, pois dependem de competências específicas).
- Ação: Nenhuma necessária

### 7. Discrepância Ind.4 Joseane
- Status: **CORRIGIDO INDIRETAMENTE**
- Verificação: Joseane tem 11 sessões, macrociclo 2025-04-20 a 2026-03-31. Todas as sessões caem dentro do período. Excluindo sem_tarefa (sessão 7): 10 com tarefa, 7 entregues = 70%. O fix de dataSessao garante que o filtro por macrociclo funcione corretamente agora.
- Ação: Já corrigido pelo fix de dataSessao

### 8. Tarefas zeradas Millena
- Status: **DADOS CORRETOS - BUG ERA DO dataSessao**
- Verificação: Millena tem 10 sessões, macrociclo 2025-04-20 a 2026-03-31. Todas caem no período. 5/10 entregues = 50%. Se antes mostrava 0%, era porque sem dataSessao o filtro não funcionava corretamente.
- Ação: Já corrigido pelo fix de dataSessao

### 9. Envio de Case de Sucesso não funciona
- Status: **JÁ IMPLEMENTADO E FUNCIONAL**
- Verificação: Rota `cases.enviar` (routers.ts linha 5679) está completa: recebe arquivo base64, faz upload para S3, cria/atualiza registro no banco, envia notificação por email. Frontend `DashboardMeuPerfil.tsx` tem dialog completo com upload de arquivo, título, descrição, botão de envio com loading state e tratamento de erro.
- Ação: Nenhuma necessária - funcionalidade já está operacional

### 10. Ciclo em Andamento não aparece
- Status: **JÁ IMPLEMENTADO E FUNCIONAL**
- Verificação: DashboardMeuPerfil.tsx tem lógica completa para exibir ciclos em andamento (ciclosEmAndamento). Usa `getCicloStatusColor('em_andamento')` e `getCicloStatusLabel('em_andamento')`. Os ciclos são ordenados com em_andamento primeiro. Se não aparece para um aluno específico, é porque os microciclos (datas) não cobrem a data atual.
- Ação: Nenhuma necessária - problema de dados/configuração, não de código

### 11. Wandemberg "Raciocínio Lógico" sem barra
- Status: **PROBLEMA DE DADOS, NÃO DE CÓDIGO**
- Verificação: Competência "Raciocínio Lógico e Espacial" (id 30010, codigoIntegracao=01J80994KE3S7A2T30QKV1MRV4) está no plano individual do Wandemberg, mas NÃO existe registro na tabela student_performance para essa competência. A plataforma de cursos não tem dados de progresso. O frontend já mostra "—" quando aulasDisponiveis=0.
- Ação: Nenhuma necessária no código. Dados precisam ser importados da plataforma de cursos.

### 12. Trilha Basic Julia no onboarding
- Status: **DADOS CORRETOS - VERIFICAR COM USUÁRIO**
- Verificação: Juliana (30082) tem 2 PDIs: Basic (8 comp.) e Essential (7 comp.). Julia Makiyama (660014) também tem Basic e Essential. A função getJornadaCompleta agrupa PDIs por trilha e retorna ambas como macroJornadas separadas. O onboarding exibe `allMacroJornadas` que inclui todas as trilhas. Se não aparece, pode ser cache do navegador ou a Julia específica não é nenhuma dessas.
- Ação: Nenhuma necessária no código. Pedir ao usuário para testar novamente e informar qual Julia exata.

### 13. PDI para aluno inativado
- Status: **BUG REAL - PRECISA CORRIGIR**
- Verificação: `assessment.criar` (routers.ts linha 4597) NÃO verifica se o aluno está ativo antes de criar o PDI. Qualquer mentor pode criar PDI para aluno inativo.
- Ação: Adicionar guard no início da mutação

### 14. Ativar aluno de empresa desativada
- Status: **BUG REAL - PRECISA CORRIGIR**
- Verificação: `toggleAlunoStatus` (db.ts linha 1150) simplesmente inverte o status sem verificar se a empresa/programa do aluno está ativo.
- Ação: Adicionar verificação de empresa ativa antes de ativar aluno

### 15. Campos importação zerados
- Status: **DADOS DA FONTE - NÃO É BUG DE CÓDIGO**
- Verificação: `mediaAvaliacoesFinais` é 0.00 em todos os registros, mas `avaliacoesRespondidas` e `mediaAvaliacoesRespondidas` têm valores corretos (80-96). O campo `mediaAvaliacoesFinais` vem da coluna "Média das avaliações finais" do CSV da plataforma. Se está zero, é porque a plataforma de cursos não preencheu esse campo. O código de importação usa `parseDecimalSafe` corretamente. O calculador V2 usa `mediaAvaliacoesRespondidas` (que tem valores) para o Ind.2, não `mediaAvaliacoesFinais`.
- Ação: Nenhuma necessária no código. Dados vem assim da plataforma de cursos.
