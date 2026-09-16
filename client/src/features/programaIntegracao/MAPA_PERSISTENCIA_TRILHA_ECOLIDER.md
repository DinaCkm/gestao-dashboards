# Mapa de persistência — Trilha original x EcoLíder

Este documento pertence à Fase 1 do Plano Mestre. Ele existe para impedir que uma função da Trilha histórica seja ligada a uma gravação genérica que possa sobrescrever dados não relacionados.

## Estruturas atuais confirmadas

### Bootstrap administrativo

`GET /api/programa-integracao/bootstrap`

Entrega:

- `state.config`
- `state.config.ordem`
- `state.config.respostasPendentes` montado a partir da tabela de respostas
- `state.processos[legacyId]`
- respostas vinculadas colocadas em `processo.resp`

A fila de pendentes não é apenas um campo JSON comum: ela é reconstruída a partir de `programa_integracao_respostas`.

### Processo

`PUT /api/programa-integracao/processos/:legacyId`

Recebe processo completo e ordem. É adequado para estado de uma pessoa quando o objeto completo atual foi confirmado antes da gravação.

O cliente `atualizarEstadoProcesso` consulta o bootstrap antes de gravar para recuperar a posição atual. Isso evita sobrescrever a ordem com zero, mas aumenta o custo de cada escrita e torna gravação por tecla inadequada.

### Configuração global

`PUT /api/programa-integracao/config`

PERIGO conhecido: além de gravar a configuração geral, o endpoint também interpreta `respostasPendentes`. Pendências ausentes do payload podem ser marcadas como descartadas no banco.

Conclusão: este endpoint NÃO deve ser usado como mecanismo genérico para salvar uma única configuração a partir de uma tela parcial.

### Resposta pública

`POST /api/public/programa-integracao/forms/:slug/responses`

Já existe persistência real para os cinco formulários públicos. O servidor:

- verifica formulário ativo;
- valida identidade básica e perguntas obrigatórias;
- valida escala 0-5;
- procura processo por nome + e-mail + unidade + data de início;
- grava resposta vinculada ou pendente;
- gera protocolo;
- quando vinculada, marca a ação correspondente como concluída.

Gaps já identificados para paridade histórica:

- validação de CPF/telefone e textos longos precisa ser conferida/fechada no servidor;
- política de duplicidade ainda não respeita integralmente `bloquear / substituir / permitir adicional`;
- operações administrativas da fila de pendentes precisam de endpoints específicos, em vez de alteração indireta por Config.

## Mapa por dado do estado histórico

| Estado original | Persistência EcoLíder | Situação | Regra de implementação |
|---|---|---|---|
| `processos[id].nome/cpf/...` | `programa_integracao_processos` | EXISTE | gravar somente objeto completo atual |
| `processos[id].feito` | JSON `estado` do processo | EXISTE | salvar por processo, nunca por Config |
| `processos[id].alin` | JSON `estado` do processo | EXISTE | salvar por processo |
| `processos[id].bem` | JSON `estado` do processo | EXISTE | salvar por processo |
| `processos[id].teste` | JSON `estado` do processo | EXISTE | salvar por processo |
| `processos[id].resp` | `programa_integracao_respostas` | PARCIAL | NÃO gravar dentro do PUT do processo; usar operações próprias |
| `config.ordem` | config geral + coluna `ordem` dos processos | PARCIAL | criar operação específica antes de habilitar reordenação |
| `config.feriados` | config geral | EXISTE MAS RISCO | criar atualização específica/merge seguro |
| `config.emails` | config geral | EXISTE MAS RISCO | criar atualização específica por modelo |
| `config.aviso` | config geral | EXISTE MAS RISCO | criar atualização específica |
| `config.mentoras` | config geral | EXISTE MAS RISCO | criar CRUD específico/merge seguro |
| `config.cursos` | config geral | EXISTE MAS RISCO | criar atualização específica |
| `config.plataformaCursos` | config geral | EXISTE MAS RISCO | merge específico |
| `config.links` | config geral | EXISTE MAS RISCO | merge específico; links públicos oficiais não devem divergir |
| `config.formConfig` | config geral | EXISTE MAS RISCO | operação por formulário |
| `config.formTextos` | config geral | EXISTE MAS RISCO | operação por formulário/campo |
| `config.respostasPendentes` | tabela `programa_integracao_respostas` | NÃO É CONFIG REAL | criar endpoints vincular/corrigir/descartar |
| `config.protocoloSeq` histórico | protocolo atualmente derivado do id da resposta | ARQUITETURA NOVA | validar unicidade/paridade; não voltar contador sem necessidade |
| backups | ainda sem equivalente dedicado confirmado | PENDENTE | desenhar tabelas/endpoints antes da UI |

## Operações específicas necessárias antes das telas de escrita

1. **Resposta pendente**
   - corrigir identificação;
   - reprocessar candidatos;
   - vincular a processo existente;
   - criar processo conscientemente nos formulários permitidos;
   - descartar;
   - todas com auditoria.

2. **Respostas vinculadas**
   - editar metadados/campos;
   - recalcular média e alertas;
   - remover/arquivar sem destruir histórico de auditoria.

3. **Configuração**
   - atualização parcial/merge seguro por seção;
   - nunca exigir que a tela envie a configuração inteira;
   - nunca tocar na fila de respostas pendentes ao salvar e-mail, curso, feriado etc.

4. **Ordem das pessoas**
   - operação específica de reordenação;
   - atualizar ordem de forma transacional/coerente.

5. **Backup/restauração**
   - endpoints e armazenamento próprios;
   - restauração exige snapshot automático imediatamente antes;
   - não implementar restauração por `PUT /config` + vários PUTs sem transação/controle.

## Decisão de segurança para a próxima implementação

Antes de reconstruir as telas de Configuração, Registrar Respostas, Respostas Recebidas, Pendentes e Gerenciar Pessoas, criar primeiro a camada de operações específicas acima.

As telas somente poderão chamar operações cuja abrangência seja igual à intenção do botão. Exemplo: "salvar modelo de e-mail" não pode enviar ou modificar `respostasPendentes`.

## Próxima tarefa técnica

Criar uma API de atualização parcial de configuração com whitelist de seções e merge no servidor, sem aceitar `respostasPendentes` nem qualquer chave não relacionada. Depois criar o cliente correspondente. Nenhuma chamada dessa nova API será feita em produção enquanto a branch não for validada e publicada com autorização explícita.
