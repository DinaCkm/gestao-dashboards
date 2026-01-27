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
- [ ] Implementar 3 níveis de visão: Geral, Por Empresa, Por Aluno
- [ ] Atualizar dashboards com filtros por empresa
- [x] Configurar upload para aceitar os 7 arquivos: SEBRAEACRE-Mentorias, SEBRAEACRE-Eventos, EMBRAPII-Mentorias, EMBRAPII-Eventos, BS2SEBRAETO-Mentorias, BS2SEBRAETO-Eventos, relatorio-de-performance
- [ ] Usar Id Usuário como chave principal para cruzar planilhas
- [ ] Implementar hierarquia: Empresa → Turma → Aluno → Trilha/Competências
- [ ] Adicionar visão por Turma nos dashboards
- [ ] Implementar regra de aprovação (nota ≥7 = aprovado)
