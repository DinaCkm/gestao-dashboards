# Auditoria literal dos 32 modelos de e-mail

Fonte funcional obrigatória para o fechamento: `trilha-integracao-codigo-completo_4.html`.

Escopo: comparar os modelos atuais reconstruídos com `MODELOS_PADRAO`, `agend(...)`, `ciclo(...)` e `MAIL_ORDEM` do HTML histórico mais recente.

## Critérios conferidos

Para cada modelo foram conferidos:

- chave técnica;
- fase;
- nome do modelo;
- destinatário;
- cópia;
- assunto;
- corpo;
- indicação textual de anexo;
- posição em `MAIL_ORDEM`.

A auditoria não considera o arquivo físico do anexo como entregue. O transporte e a disponibilização real dos anexos continuam controlados por item separado do checklist.

## Grupos conferidos

### Antes da chegada e primeiros dias

- `m_ugp_controle`
- `m_gestor_inicio`
- `m_cobranca_bem`
- `m_anjo_inicio`
- `m_anjo_inicio_ugp`
- `m_agenda`
- `m_primeiros_passos`
- `m_confirma_acesso`
- `m_primeiros_registros`

Resultado: equivalência literal confirmada contra as chamadas `M(...)` históricas.

## Alteração específica do HTML v4

O HTML v4 acrescenta `m_confirma_acesso` entre `m_primeiros_passos` e `m_primeiros_registros`. A versão atual preserva a mesma chave, fase, destinatário, assunto, corpo e posição em `MAIL_ORDEM`. Esse é o único modelo adicional em relação à auditoria anterior de 31 modelos.

### Agendamentos

- `m_agendamento_1`
- `m_agendamento_2`
- `m_agendamento_3`
- `m_agendamento_4`

O helper atual `modeloAgendamento(n)` foi comparado com `agend(n,extra)` do HTML histórico.

Resultado: equivalência confirmada, incluindo:

- abertura específica do 1º alinhamento;
- abertura específica do 4º alinhamento;
- bloco genérico dos alinhamentos 2 e 3;
- `{{BLOCO_RELATORIO}}` somente a partir do 2º;
- despedida adicional do 4º alinhamento;
- assinatura histórica.

### Pós 1º alinhamento

- `m_pos1_colab`
- `m_pos1_gestor`
- `m_pos1_ugp`
- `m_pos1_anjo`

Resultado: equivalência literal confirmada.

Também foram conferidos os textos auxiliares históricos reutilizados:

- `TXT_PESQUISA`;
- `LEMBRETE_CURSOS`;
- assinatura `ASS`.

### Ciclos 2 e 3

- `m_pos2_colab`
- `m_pos2_gestor`
- `m_pos2_ugp`
- `m_pos2_anjo`
- `m_agradecimento_anjo`
- `m_pos3_colab`
- `m_pos3_gestor`
- `m_pos3_ugp`
- `m_pos3_anjo`
- `m_reconhecimento_anjo`
- `m_compliance_ugp`

O helper atual `ciclo(...)` foi comparado com a função histórica homônima.

Resultado: equivalência confirmada, incluindo aberturas e trechos específicos dos ciclos 2 e 3.

### Encerramento

- `m_pos4_colab`
- `m_pos4_gestor`
- `m_pos4_ugp`
- `m_pos4_anjo`

Resultado: equivalência literal confirmada.

## Ordem

A lista atual `ORDEM_EMAILS_INTEGRACAO` coincide com `MAIL_ORDEM` do HTML histórico e contém 32 chaves.

## Resultado final

- 31/32 modelos presentes;
- 31/32 modelos conferidos contra a fonte histórica;
- textos, assuntos, destinatários, cópias e indicações de anexos equivalentes;
- geradores de agendamento e ciclos comparados com as funções históricas correspondentes;
- nenhuma divergência textual encontrada nesta auditoria.

### Pendência propositalmente não encerrada aqui

A existência textual de um anexo no modelo não comprova que o arquivo esteja disponível para download ou envio. Em especial, o `Tutorial de Primeiro Acesso (PDF)` já foi recuperado do HTML histórico e validado, mas ainda precisa ser incorporado fisicamente ao aplicativo e ligado aos pontos previstos.

Por isso, esta auditoria fecha somente o item `Conferir todos os modelos texto a texto`. O item `Anexos e tutorial em todos os casos previstos` continua pendente.
