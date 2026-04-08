# Auditoria de Nomenclatura - Resultado

## CÓDIGO-FONTE (Básica→Basic, Essencial→Essential, Mestre→Master, Outras→Opcionais)

### client/src/components/InfoTooltip.tsx
- L27: "Básicas, Essenciais, Master" → "Basic, Essential, Master"
- L28: "Trilha Básicas, Trilha Essenciais" → "Trilha Basic, Trilha Essential"

### client/src/pages/DashboardMeuPerfil.tsx
- L1122: "Outras competências" → "Competências Opcionais"
- L1574: "Básicas, Essenciais, Master" → "Basic, Essential, Master"

### client/src/pages/TrilhasCompetencias.tsx
- L137: "Básicas" → "Basic"
- L143: "Essenciais" → "Essential"
- L359: placeholder "Ex: Básicas" → "Ex: Basic"

### server/db.ts
- L2631: comentário "Básicas" → "Basic"

### server/routers.ts
- L482: regex "Essencial|Básica" → "Essential|Basic"

### TESTES
- server/planoIndividual.test.ts L36: 'Básicas' → 'Basic'
- server/indicatorsV2.test.ts L60,316,322,387: 'Básicas' → 'Basic'

## BANCO DE DADOS

### trilhas (tabela)
- id=1: "Básica" → "Basic"
- id=2: "Essencial" → "Essential"
- id=3: "Master" (já correto)

### turmas (tabela) - nomes contendo Básicas/Essenciais
- id=36: "[2024] Banrisul - B.E.M. | Básicas" → "... | Basic"
- id=37: "[2024] Banrisul - B.E.M. | Essenciais" → "... | Essential"
- id=30002: "[2025] Embrapii | Básicas" → "... | Basic"
- id=30004: "[2025] SEBRAE Acre - B.E.M. | Básicas" → "... | Basic"
- id=30005: "[2025] SEBRAE Tocantins - Básicas [BS1]" → "... Basic [BS1]"
- id=30006: "[2025] SEBRAE Acre - B.E.M. | Essenciais" → "... | Essential"
- id=30007: "[2025] SEBRAE Tocantins - Essenciais [BS1]" → "... Essential [BS1]"
- id=30008: "[2025] SEBRAE Tocantins - Básicas [BS3]" → "... Basic [BS3]"
- id=30010: "[2025] SEBRAE Acre - B.E.M. | Masters" (já correto)

### student_performance (tabela)
- turmaName: substituir "Básicas" → "Basic", "Essenciais" → "Essential"
- competenciaName: substituir "- Básica" → "- Basic", "- Essencial" → "- Essential"

### mentoring_sessions.feedback
- NÃO ALTERAR: são textos livres escritos por mentores, não devem ser modificados
