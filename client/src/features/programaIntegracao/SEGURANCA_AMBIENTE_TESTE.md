# Segurança — ambientes Railway para validação da reconstrução

Levantamento realizado somente em leitura no projeto Railway `EcoLíder`.

## Ambientes encontrados

- `production`
- `Ecolider_teste`
- `staging`
- `Modulo Processo Seletivo`

O serviço `gestao-dashboards` de `Ecolider_teste` está atualmente ligado à branch `staging`, e o serviço do ambiente `staging` está ligado a outra branch específica. Nenhum deles aponta para `reconstrucao-integracao-completa-20260916`.

## Risco de banco compartilhado

A configuração do serviço MySQL foi conferida em modo somente leitura.

Tanto `production` quanto `Ecolider_teste` apresentam:

- mesmo serviço MySQL do projeto;
- mesmo volume Railway: `a385c1f6-208d-4a92-bf35-fe1be0148dd0`;
- mesmo ponto de montagem: `/var/lib/mysql`.

O ambiente `staging` também havia apresentado o mesmo identificador de volume no status do projeto.

## Consequência de segurança

Até existir comprovação de isolamento, **não considerar `Ecolider_teste` nem `staging` ambientes seguros para testes de gravação** do Programa de Integração.

Não executar nesses ambientes, sem isolamento comprovado e autorização específica:

- criação/edição/reordenação/encerramento/reabertura/remoção de processos;
- processo de demonstração;
- importação ou edição de respostas;
- envio de formulários de teste que gravem no banco;
- restauração de backup;
- qualquer teste destrutivo ou de persistência.

O fato de um ambiente se chamar “teste” não garante isolamento dos dados.

## O que pode ser feito sem risco de dados

- inspeção de configuração em modo leitura;
- auditoria estática de código;
- comparação com o HTML histórico;
- build em ambiente separado que não compartilhe banco, quando houver;
- testes locais sem acesso ao banco real.

## Condição para testes reais

Antes de iniciar os testes de persistência do checklist, usar um ambiente com:

1. aplicação apontando para a branch `reconstrucao-integracao-completa-20260916`;
2. banco/volume fisicamente isolado de produção;
3. dados exclusivamente fictícios ou cópia sanitizada destinada a teste;
4. rollback definido;
5. autorização explícita da Dina para criar/alterar/deployar esse ambiente de teste.

Produção continua fora da reconstrução até a autorização específica prevista no checklist final.
