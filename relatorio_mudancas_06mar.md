# Relatório de Mudanças - 06/03/2026

## 1. Ranking Unificado (V2)

**Problema**: O Portal do Aluno (meuDashboard) usava o calculador V1 para ranking e indicadores, enquanto o Dashboard Gestor usava V2. Isso causava discrepância (ex: Joseane aparecia 21º no Portal e 2º no Gestor).

**Causa raiz**: V1 calcula `notaFinal = média de 6 indicadores / 10`. V2 calcula `notaFinal = ind7_engajamentoFinal / 10` (média de 5 indicadores por ciclo). São fórmulas diferentes.

**Solução**: O endpoint `meuDashboard` agora usa `calcularIndicadoresTodosAlunos` (V2) para calcular o ranking de todos os colegas da empresa — exatamente a mesma função usada pelo Dashboard Gestor. Os indicadores individuais (notaFinal, classificação, performanceGeral) também são alimentados pelo V2.

## 2. Relatório Gerencial com Indicadores V2

**Antes**: O relatório gerencial Excel continha apenas 2 abas (Equipe com nome/email/empresa/turma/mentor, e Mentorias).

**Agora**: O relatório gerencial e administrativo Excel contém **3 abas**:

| Aba | Conteúdo |
|-----|----------|
| **Equipe** (ou Todos os Alunos) | Nome, Email, Empresa, Turma, Mentor, Ind.1 Webinars (%), Ind.2 Avaliações (%), Ind.3 Competências (%), Ind.4 Tarefas (%), Ind.5 Engajamento (%), Ind.6 Case (%), Ind.7 Engajamento Final (%), Classificação, Nota Final (0-10) |
| **Mentorias** | Aluno, Data, Presença, Atividade, Engajamento |
| **Indicadores por Ciclo** | Aluno, Ciclo, Status, Ind.1 a Ind.7, Classificação |

## 3. Limpeza de Dados de Teste

| Item | Quantidade |
|------|-----------|
| Alunos vitest removidos | 116 |
| Users vitest removidos | 241 |
| Relatórios de teste removidos | 9 |
| Student performance teste removidos | 14 |
| Alunos manuais mantidos | 3 (Usuário Teste, MARIA TESTE DA SILVA, maria teste3) |

**Total de alunos restantes**: 133 (reais)
**Total de users restantes**: 105

## 4. Validação

- **299 testes passando** em 23 arquivos
- **Zero erros TypeScript**
- Servidor rodando normalmente
