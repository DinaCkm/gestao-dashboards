# Auditoria — anexos e Tutorial de Primeiro Acesso

Fonte funcional obrigatória: HTML histórico `trilha-integracao-codigo-completo_3.html`.

## Regra encontrada no HTML histórico

O diálogo de e-mail histórico (`abrirMailObj`) fazia duas coisas distintas:

1. mostrava o campo textual `Anexos` quando o modelo possuía `m.anexo`;
2. adicionava um botão real de download do Tutorial somente quando a chave do modelo era `m_primeiros_passos` ou `m_compliance_ugp`.

Os demais anexos (Agenda, atas e relatórios) eram listados no e-mail para conferência/anexação manual. O diálogo histórico não criava botões automáticos para gerar esses documentos a partir do campo `m.anexo`.

A exceção de geração dentro da prévia era o Relatório de Evolução dos e-mails de agendamento 2, 3 e 4, tratado separadamente por `abrirMail()` e não pelo campo `anexo`.

## Modelos efetivos com campo textual de anexo

Após expandir a função histórica `ciclo(2, ...)` e `ciclo(3, ...)`, existem 10 modelos efetivos que indicam anexo:

1. `m_agenda` — Agenda de Onboarding de {{COLABORADOR}}.
2. `m_primeiros_passos` — Tutorial de Primeiro Acesso (PDF).
3. `m_pos1_gestor` — Ata do 1º Alinhamento.
4. `m_pos1_ugp` — Ata do 1º Alinhamento; Relatório completo; Avaliação de Potencial consolidada.
5. `m_pos2_gestor` — Ata do 2º Alinhamento.
6. `m_pos3_gestor` — Ata do 3º Alinhamento.
7. `m_pos2_ugp` — Ata do 2º Alinhamento; Relatório completo de acompanhamento.
8. `m_pos3_ugp` — Ata do 3º Alinhamento; Relatório completo.
9. `m_pos4_gestor` — Ata de Encerramento.
10. `m_pos4_ugp` — Ata final de encerramento; Relatório completo final.

A reconstrução atual já preserva esses textos no campo `Anexos` da prévia de e-mail. Isso está alinhado ao comportamento do HTML histórico.

## Onde o botão de Tutorial deve existir

### 1. Quatro ações da linha do tempo com `tut:1`

- `d3-01`
- `d3-04`
- `d3-02`
- `pos3-12`

O HTML histórico renderiza `btnTutorial('sm ghost')` em qualquer ação com `it.tut`.

### 2. Duas prévias de e-mail

O HTML histórico contém explicitamente:

`(m.chave==='m_primeiros_passos'||m.chave==='m_compliance_ugp') ? btnTutorial('sm') : ''`

Portanto o botão de download do mesmo Tutorial deve existir nas prévias de:

- `m_primeiros_passos` — Primeiros passos · Plataforma do Ecossistema do B.E.M.;
- `m_compliance_ugp` — Jornada Compliance · UGP.

Observação importante: `m_compliance_ugp` não possui texto no campo `anexo`; mesmo assim o HTML histórico oferece o Tutorial como botão auxiliar na prévia. Essa regra precisa ser preservada.

### 3. Configurações → Links/arquivos

O HTML histórico também mostra o botão do Tutorial no bloco `Arquivos para enviar`, acompanhado do texto de que o PDF é o anexo do e-mail “Primeiros passos · Plataforma do Ecossistema do B.E.M.”.

## Arquivo histórico validado

Nome histórico:
`Tutorial - Primeiro Acesso - Plataforma Onboarding.pdf`

Arquivo extraído e conferido fora do repositório:
- tamanho: 1.167.592 bytes;
- 7 páginas;
- SHA-256: `0224bc072ca801d96f64a767ed9e369b2c48c017f0a79d38b8824769bb9277fd`.

O HTML original guarda esse mesmo documento como `TUTORIAL_B64` e o recompõe no navegador com `atob`, `Uint8Array` e `Blob` `application/pdf`. Portanto Base64 embutido é arquitetura histórica legítima, não uma solução improvisada.

## Estado atual da reconstrução

- os 10 textos de anexo estão preservados nas prévias;
- o Relatório de Evolução já possui gerador real nas prévias aplicáveis;
- o PDF histórico do Tutorial ainda não foi transportado integralmente para a branch;
- por segurança, nenhum botão falso de Tutorial foi criado sem o arquivo real;
- por isso `Tutorial nas ações aplicáveis` e `Anexos e tutorial em todos os casos previstos` permanecem pendentes.

## Critério para encerramento

Os dois itens só devem ser marcados como concluídos quando:

1. o PDF histórico exato estiver disponível no código/asset, com integridade comprovada;
2. o download funcionar nas quatro ações `tut:1`;
3. o download funcionar em `m_primeiros_passos`;
4. o download funcionar em `m_compliance_ugp`;
5. o download funcionar no bloco de Configurações;
6. os demais anexos continuarem sendo exibidos como no original, sem inventar automações inexistentes;
7. o PDF baixado for revalidado contra o hash histórico.
