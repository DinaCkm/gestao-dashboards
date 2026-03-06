# AJUSTE2 - Requisitos da Página de Relatórios

## Problema 1: Falta filtro de aluno (JÁ IMPLEMENTADO no código atual)
- Quando tipo = "Individual", precisa ter filtro para selecionar o aluno
- ✅ Já implementado no Reports.tsx

## Problema 2: Texto incorreto na descrição do Relatório Individual
- Texto atual: "Suas métricas pessoais, histórico de evolução, conquistas e comparativo com as metas estabelecidas."
- Texto correto: "Relatório Individual, mostra a performance do aluno com indicadores por ciclo, engajamento e evolução."
- ✅ Já corrigido no Reports.tsx

## Problema 3: Botão Baixar não funciona
- O relatório gerado não libera para baixar o documento
- fileUrl fica null porque o backend não gerava o arquivo
- ✅ Backend agora gera arquivo Excel real e faz upload para S3

## Problema 4: Templates Rápidos não funcionam
- Cards "Relatório Semanal" e "Performance da Equipe" não geram relatórios
- Atualmente apenas preenchem o formulário, mas não geram automaticamente
- PRECISA: ao clicar no template, gerar o relatório automaticamente (para manager/admin)
  - Para "Relatório Semanal" (individual): preencher form + toast pedindo selecionar aluno
  - Para "Performance da Equipe" (manager): gerar automaticamente
  - Para "Relatório Executivo" (admin): gerar automaticamente
