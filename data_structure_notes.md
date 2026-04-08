# Estrutura de Dados - Sistema de Mentorias CKM Talents

## Visão Geral
O sistema gerencia programas de mentoria/tutoria para diferentes organizações:
- SEBRAE Acre
- SEBRAE Tocantins  
- EMBRAPII

## Formulários de Acompanhamento (Google Forms)

### Campos Comuns:
- **Email** - Email do consultor
- **Nome do Consultor** - Lista de consultores (Ana Carolina, Deborah Franco, Giovanna, etc.)
- **Id Usuário** - Identificador do usuário
- **Nome do aluno** - Lista de alunos/tutorados
- **Id Turma** - Identificador da turma
- **Grupo/Turma** - Ex: [2025] SEBRAE Acre - B.E.M. | Básicas, Essenciais, Masters
- **Id Trilha** - Identificador da trilha
- **Trilha** - Opções de trilha
- **Ciclo** - Ciclo I, II, III, IV
- **Data da Mentoria** - Data do encontro
- **Mentoria** - Presente/Ausente
- **Atividade proposta** - Status da tarefa por sessão (1ª a 15ª):
  - TAREFA ENTREGUE
  - TAREFA NÃO ENTREGUE
  - NÃO TEM TAREFA
- **Evolução/Engajamento** - Escala 0-10
- **Breve parecer sobre o Aluno** - Texto descritivo com 3 pontos:
  1. Posicionamento sobre desenvolvimento
  2. Empenho nas tarefas
  3. Percepções profissionais

## Planilha de Eventos (SEBRAE TO)

### Abas:
1. **PARTICIPAÇÃO_EVENTOS** - Registro de participação
2. **LISTA DE ALUNOS** - Cadastro de alunos
3. **ID TURMAS** - Identificadores de turmas
4. **ID TRILHA** - Identificadores de trilhas

### Colunas da aba PARTICIPAÇÃO_EVENTOS:
- **ID** - Ex: 667257
- **Nome do aluno** - Ex: Admary Monteiro Bau...
- **Turma/Grupo** - Ex: 103111, [2025] SEBRAE
- **Ciclo/Trilha** - Ex: Ciclo IV/1
- **TRILHA** - Ex: 01JQ7P5YM3 Mindset Visionário
- **Tipo do evento** - Webinar, Aula
- **Título do Evento** - Ex: "2025/06 - Liderança Tóxica", "2025/07 - Habilidades da..."
- **Data do evento** - Ex: 02/04/2025, 23/04/2025
- **Status** - Presente, Ausente

## Métricas Importantes para Dashboards

### Dashboard Administrativo:
- Total de alunos por programa
- Taxa de presença geral
- Taxa de entrega de tarefas
- Média de engajamento por turma
- Comparativo entre programas (SEBRAE Acre, SEBRAE TO, EMBRAPII)

### Dashboard Gerencial (por Consultor/Turma):
- Alunos sob responsabilidade
- Taxa de presença da turma
- Evolução do engajamento ao longo dos ciclos
- Tarefas pendentes vs entregues

### Dashboard Individual (por Aluno):
- Histórico de presenças
- Evolução do engajamento (0-10)
- Status de tarefas por sessão
- Pareceres dos consultores
- Participação em eventos/webinars
