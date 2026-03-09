# Itens Pendentes — Sistema Gestão Dashboards

Total: **249 itens pendentes** organizados por categoria/prioridade.

---

## 1. Bugs Conhecidos (Correções Urgentes)

- Bug: Ao criar nova tarefa na Biblioteca, a tarefa anterior da mesma competência pode ser substituída
- Bug: Header do Portal do Aluno mostra "Usuário" em vez de "Aluno"
- Bug de importação: campos mediaAvaliacoesFinais e avaliacoesRespondidas importados como 0
- Investigar discrepância no cálculo do Ind. 4: Tarefas da Joseane (87,5% vs 50%)
- Investigar por que Vanessa Bertholdo Vargas não aparece no dropdown de seleção
- Investigar por que Vanessa aparece com 0% em todos os indicadores
- Divergência Portal vs Mural em "Decisões Ágeis" e "Arquitetura de Mudanças"
- Corrigir ordem dos ciclos dentro de cada trilha (do mais recente ao mais antigo)

---

## 2. Portal do Aluno — Dados Reais (Remover Dados Fake)

- Retirar dados fake de webinários (usar dados reais do banco)
- Retirar dados fake de tarefas práticas
- Retirar dados fake de cursos
- Retirar dados fake de sessões de mentoria
- Retirar dados fake de trilha/competências
- Retirar dados fake de mentoras do OnboardingAluno
- Criar procedures tRPC para portal do aluno com dados reais
- Mostrar estados vazios quando não houver dados
- Conectar OnboardingAluno.tsx ao banco (substituir dados fake)

---

## 3. Portal do Aluno — Visual e Layout

- Corrigir fundo escuro para fundo claro em AlunoLayout
- Corrigir cards dos indicadores: fundo cinza ilegível → fundo branco
- Corrigir abas (Trilha, Competências): fundo escuro → fundo claro
- Corrigir textos cinza claro ilegíveis → textos escuros
- Corrigir gráfico radar: labels ilegíveis
- Remover card "Gravações Disponíveis" do Mural do Aluno
- Criar navegação por abas/seções no Portal do Aluno

---

## 4. Área da Mentora

- Definir competências da trilha e metas por competência
- Tela de acompanhamento mensal: mentora marca cumprida/não cumprida
- Aba/seção de tarefas por sessão na visão do mentor ao visualizar um aluno
- Mostrar número da sessão, data, status de entrega para cada aluno
- Resumo de entregas por aluno (X de Y atividades entregues)
- Investigar por que área de cadastro do mentor (currículo, foto, agenda) não aparece
- Aba Relatórios: gerar relatório com suas mentorias
- Aba Avisos: visualizar avisos do administrador

---

## 5. Sistema de Metas

- Criar tabelas no banco: metas (vinculadas a competência/aluno), acompanhamento_metas
- Endpoint tRPC para CRUD de metas
- Card de metas no Portal do Aluno e no Mural do aluno
- Cálculo automático: % atingida por competência e % total do aluno
- Exibição do progresso de metas no Dashboard do Gestor

---

## 6. Papel do Gerente de Empresa

- Analisar estrutura para papel duplo (Aluno + Gerente)
- Backend: schema, role gerente, routers e lógica de acesso
- Frontend: dashboard do Gerente com visão da empresa e empregados
- Alternância de papel (Aluno ↔ Gerente) na interface
- Criar página DemonstrativoMentorias com filtros e tabela detalhada

---

## 7. Dashboard do Gestor

- Adicionar tooltip com explicação do cálculo em cada card de indicador
- Garantir mesma lógica de cálculo do DashboardAluno (ciclos finalizados)
- Filtro por turma independente de trilha
- Exibir mentor(a) de cada aluno na área do administrador

---

## 8. Cálculos e Indicadores

- Atualizar AdminDashboard para usar cálculo dinâmico V2 (remover hardcoded 81.8%)
- Alterar Ind. 4 (Tarefas) para calcular pelo macrociclo
- Alterar Ind. 1 (Webinars) para calcular pelo macrociclo
- Ciclos de execução: finalizado, em andamento, futuro — lógica de cálculo

---

## 9. Webinars e Eventos — Presença

- Criar tabela webinar_attendance (presença + reflexão do aluno)
- Interface no Mural do Aluno para marcar presença e escrever reflexão
- Fluxo: aluno deve assistir o vídeo antes de marcar presença
- Unificar Eventos Disponíveis + Histórico em lista única
- Adicionar campo videoLink na tabela events

---

## 10. Upload e Importação de Dados

- Implementar parser para SEBRAEACRE-Eventos.xlsx
- Implementar parser para BS2SEBRAETO-Eventos.xlsx
- Implementar parser para EMBRAPII-Eventos.xlsx
- Implementar parser para relatorio-de-performance.xlsx
- Simplificar Upload: remover cards mentorias/eventos/desempenho, manter só performance
- Guardar as 3 últimas versões de cada tipo de planilha

---

## 11. Identidade Visual

- Extrair cores exatas da marca (azul marinho + laranja âmbar)
- Atualizar CSS global com paleta B.E.M.
- Aplicar cores nos componentes: sidebar admin, navbar aluno, cards, botões

---

## 12. Email (ADIADO)

- Configurar Resend API e DNS (aguardando configuração DNS)
- Integrar envio de email no endpoint createAluno

---

## 13. Outros

- Validar CPF duplicado no backend e frontend
- Regra: novos alunos com CPF participam dos dois programas (Ecossistema + Evoluir)
- Permitir admin cadastrar/editar CPF dos alunos
- Seção Definições Contratuais no cadastro do aluno
- Confirmar remoção de "Registro de Mentoria" e "Relatório de Desempenho" do admin
- Buscar mentor pelas sessões de mentoria quando consultorId for NULL
