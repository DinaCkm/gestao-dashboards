# Análise de Pendências - Impacto nos Alunos

## 1. Header "Usuário" em vez de "Aluno" (todo linha 1462)
**Status: JÁ CORRIGIDO / NÃO EXISTE**
- Grep por "Usuário" no frontend encontrou apenas em AdminCadastros.tsx (toast de admin) e Departments.tsx (label de admin)
- AlunoLayout.tsx mostra "Aluno" corretamente (linha 70, 136)
- DashboardLayout.tsx getRoleBadge retorna "Aluno" para role user (linha 398)
- **Conclusão**: Este item já foi corrigido anteriormente ou era um falso positivo. Marcar como resolvido.

## 2. Bug sidebar: texto "Painel Inicial" sobrepõe "Alunos" (todo linha 2550)
**Precisa investigar**: Verificar se há sobreposição visual no DashboardLayout sidebar

## 3. Indicadores 4 e 5 mostram 0% - mediaAvaliacoesFinais é 0 (todo linha 1211)
**CRÍTICO**: Precisa investigar o cálculo no backend

## 4. Nota competência: usar mediaAvaliacoesRespondidas em vez de progressoTotal (todo linha 1214)
**CRÍTICO**: Precisa verificar o cálculo

## 5. Conclusão de competência: usar aulasConcluidas >= aulasDisponiveis (todo linha 1217)
**CRÍTICO**: Precisa verificar a lógica

## 6. Ind. 4 (Tarefas) calcular por macrociclo em vez de microciclo (todo linha 1931)
**CRÍTICO**: Precisa verificar

## 7. Ind. 1 (Webinars) calcular por macrociclo em vez de microciclo (todo linha 1932)
**CRÍTICO**: Precisa verificar

## 8. Discrepância Ind. 4 Joseane: 7/8 = 87,5% mas mostra 50% (todo linha 1927)
**CRÍTICO**: Provavelmente relacionado ao item 6

## 9. Tarefas zeradas da aluna Millena (todo linha 2263)
**CRÍTICO**: Provavelmente relacionado ao item 6

## 10. Envio de Case de Sucesso não funciona (todo linha 1307)
**Precisa investigar**

## 11. Seção Ciclo em Andamento não aparece (todo linha 1308)
**Precisa investigar**

## 12. Competência Wandemberg "Raciocínio Lógico e Espacial" sem barra de progresso (todo linha 2460)
**Precisa investigar**

## 13. Trilha Basic da Julia não aparece na Jornada no onboarding (todo linha 2793)
**Precisa investigar**

## 14. Bug: possível criar PDI para aluno inativado (todo linha 2542)
**Precisa corrigir**

## 15. Bug: possível ativar aluno vinculado a empresa desativada (todo linha 2543)
**Precisa corrigir**

## 16. Campos importação: mediaAvaliacoesFinais e avaliacoesRespondidas importados como 0 (todo linha 2066)
**CRÍTICO**: Causa raiz dos indicadores zerados
