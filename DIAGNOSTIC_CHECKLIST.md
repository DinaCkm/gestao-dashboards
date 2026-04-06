# 📋 Checklist de Diagnóstico - Atividades Não Aparecem

## Passo 1: Confirmar Banco e Ambiente
- [ ] Verificar qual banco está em uso (dev/staging/prod)
- [ ] Confirmar DATABASE_URL
- [ ] Confirmar NODE_ENV

## Passo 2: Consultar atividades_curso
- [ ] Executar: `SELECT COUNT(*) FROM atividades_curso;`
- [ ] Resultado: ___________
- [ ] Executar: `SELECT id, "cursoId", titulo, "isActive" FROM atividades_curso ORDER BY id DESC LIMIT 20;`
- [ ] Resultado: ___________

## Passo 3: Validar Vínculo com Cursos
- [ ] Executar: `SELECT a.id, a."cursoId", a.titulo, a."isActive", c.id AS curso_existe FROM atividades_curso a LEFT JOIN cursos c ON c.id = a."cursoId" ORDER BY a.id DESC LIMIT 20;`
- [ ] Resultado: ___________

## Passo 4: Verificar Registros Inativos
- [ ] Executar: `SELECT "isActive", COUNT(*) FROM atividades_curso GROUP BY "isActive";`
- [ ] Resultado: ___________

## Passo 5: Confirmar cursoId da Tela
- [ ] Qual cursoId está sendo enviado pela tela?
- [ ] Resultado: ___________

## Passo 6: Verificar Railway
- [ ] Qual é o preDeployCommand?
- [ ] Resultado: ___________
- [ ] Há migrations automáticas?
- [ ] Resultado: ___________

## Diagnóstico Final
- [ ] Tabela vazia? SIM / NÃO
- [ ] Dados com cursoId órfão? SIM / NÃO
- [ ] Dados inativos? SIM / NÃO
- [ ] Problema identificado: ___________
