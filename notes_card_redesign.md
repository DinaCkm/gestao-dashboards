# Redesenho do Card de Trilhas

## O que o usuário quer:
- Card organizado por TURMA (não por trilha)
- Cada turma mostra suas competências abaixo
- Cada competência mostra: nome, data início micro jornada, data fim micro jornada
- Botão de expansão para ver/esconder competências

## Dados do Fábio (exemplo da planilha):
- [2024] SEBRAE Acre - Turma 1.0: Gestão de Conflitos (10/10/2024-30/04/2025), Gestão de Equipes (10/10/2024-30/04/2025), Gestão do Tempo (10/10/2024-30/04/2025)
- [2025] Sebrae Acre - B.E.M. | Básicas: Atenção, Autopercepção, Disciplina, Empatia, Escuta Ativa, Memória, Raciocínio Lógico (10/04/2025-30/10/2025)
- [2025] Sebrae Acre - B.E.M. | Essenciais: Adaptabilidade, Comunicação Assertiva, etc. (10/07/2025-31/12/2025)
- [2025] Sebrae Acre - B.E.M. | Masters: Foco em Resultados, Presença Executiva, etc. (30/11/2025-10/05/2026)

## Dados disponíveis no backend:
- assessments = getAssessmentsByAluno(alunoId) retorna:
  - turmaNome (nome da turma)
  - trilhaNome (Basic, Essential, Master)
  - macroInicio, macroTermino (Date objects)
  - status (ativo/congelado)
  - competencias[]: competenciaNome, microInicio, microTermino, peso (obrigatoria/opcional)

## Implementação:
- No card, agrupar assessments por turmaNome
- Cada grupo mostra: turmaNome como cabeçalho
- Abaixo: lista de competências com microInicio e microTermino formatados
- Botão expand/collapse por turma
- Inicialmente colapsado, mostrando apenas nome da turma + contagem de competências
