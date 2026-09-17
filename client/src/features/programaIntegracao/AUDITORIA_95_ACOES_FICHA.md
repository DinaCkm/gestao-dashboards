# Auditoria das 95 ações da ficha individual

Fonte funcional obrigatória: `trilha-integracao-codigo-completo_3.html`.

Objetivo desta auditoria: conferir se as 95 ações históricas continuam representadas na ficha individual do EcoLíder e se cada categoria de controle usada no HTML original possui equivalente funcional na reconstrução atual.

## 1. Inventário confirmado

O PLANO histórico contém exatamente 95 ações, todas com IDs únicos.

Distribuição por responsável:

- CKM: 56
- Gestor: 22
- Colaborador: 7
- UGP: 5
- Anjo: 5

Não foram encontrados IDs duplicados.

## 2. Categorias especiais encontradas no HTML histórico

- 27 ações com `mail`
- 3 ações com `mails`
- 25 ações com `link`
- 17 ações com `form`
- 1 ação com `pdf`: `d1-03`
- 4 ações com `tut`: `d3-01`, `d3-04`, `d3-02`, `pos3-12`
- 4 ações com `ata`: `pos1-01`, `pos2-01`, `pos3-01`, `pos4-01`
- 40 ações sem flag especial, que dependem apenas do fluxo comum de status, data, justificativa e observações.

## 3. Controles comuns das 95 ações

O HTML histórico aplicava a todas as ações o mesmo núcleo de controles: situação/conclusão, abertura da ficha, data, justificativa quando aplicável e observações.

Na reconstrução atual, `DetalheProcessoReal.tsx`, `itemStateHelpers.ts` e `ObservacoesAcao.tsx` fornecem o equivalente funcional comum para todos os itens do `PLANO_REAL`:

- situação da ação;
- data de conclusão/envio;
- programação quando a ação é e-mail;
- justificativa para `Não se aplica` e `Não será feita`;
- inclusão e remoção de observações com data/hora;
- persistência usando o salvamento real do processo.

Conclusão: as 40 ações sem flag especial e o núcleo comum das demais ações estão cobertos pelo componente genérico atual.

## 4. Ações de e-mail

As ações com `mail` ou `mails` são tratadas por `EmailActionButtons.tsx`, que usa as chaves históricas do plano e abre a prévia real pelo motor de modelos de e-mail.

A situação `enviado` é registrada usando a própria ação, preservando a equivalência do histórico.

Conclusão: mecanismo funcional presente. A conferência literal dos 31 textos continua sendo um item separado do checklist.

## 5. Links

As 25 ações com `link` são tratadas por `ControlesEspeciaisAcao.tsx` e `emailLinksHelpers.ts`.

Conclusão: mecanismo funcional presente.

## 6. Formulários e respostas

As 17 ações com `form` possuem integração com respostas registradas. Quando existe resposta, ela pode ser visualizada na própria ação; quando a resposta prevista ainda não existe e há processo identificado, a microimportação fica disponível.

Conclusão: mecanismo funcional presente.

## 7. Agenda PDF

A ação `d1-03`, única com `pdf:1`, possui o controle `Agenda PDF` ligado ao gerador real `gerarAgendaOnboardingPdf`.

Conclusão: mecanismo funcional presente.

## 8. Atas e relatórios

As ações `pos1-01`, `pos2-01`, `pos3-01` e `pos4-01`, todas com `ata`, abrem `AtaRelatorioPainel` para o alinhamento correspondente.

Conclusão: mecanismo funcional presente.

## 9. Tutorial

As quatro ações históricas com `tut:1` são:

- `d3-01`
- `d3-04`
- `d3-02`
- `pos3-12`

O PDF original foi localizado dentro do próprio HTML histórico em `TUTORIAL_B64`, extraído e validado separadamente. O arquivo exato possui 7 páginas, 1.167.592 bytes e SHA-256 `0224bc072ca801d96f64a767ed9e369b2c48c017f0a79d38b8824769bb9277fd`.

Neste momento, a lógica `tut` ainda não está conectada ao `ControlesEspeciaisAcao.tsx`. Este é o único desvio funcional identificado por esta auditoria no mecanismo genérico das 95 ações.

A pendência permanece explicitamente controlada pelo item `Tutorial nas ações aplicáveis` do checklist. Não deve ser considerada resolvida até o PDF histórico exato estar disponível no aplicativo e os quatro pontos exibirem o controle funcional.

## 10. Resultado da auditoria

A auditoria das 95 ações foi concluída quanto a inventário, categorias e equivalência do mecanismo da ficha individual.

Resultado:

- 95/95 ações identificadas;
- 95/95 IDs únicos;
- controles comuns presentes;
- e-mails, links, formulários/respostas, Agenda PDF e atas possuem equivalentes funcionais atuais;
- uma lacuna compartilhada permanece: tutorial nas quatro ações `tut:1`.

Esta auditoria não substitui build TypeScript, teste de persistência, teste visual nem o teste ponta a ponta. Esses itens continuam separados no checklist de fechamento.
