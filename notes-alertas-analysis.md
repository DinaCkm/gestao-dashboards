# Análise do Sistema de Alertas por E-mail

## Para quem os e-mails são enviados?

**Destinatário principal (TO):** E-mail do ALUNO
**CC:** E-mail do MENTOR + E-mail do ADMINISTRADOR (SMTP_USER)

## O sistema filtra alunos inativos?

**SIM** - A função `getAlunos()` (linha 564-571 do db.ts) já filtra por `isActive = 1`.
Portanto, alunos inativos NÃO recebem alertas.

## Dados atuais:
- 243 alunos ativos
- 2 alunos inativos (Usuário Teste e Maria Dinamar) - NÃO recebem alertas
- 242 ativos COM email
- 1 ativo SEM email (Katilee Siqueira Maia) - NÃO recebe alerta (filtrado por `if (!aluno.email) continue`)

## Problemas identificados:

### 1. Dependência do consultorId
Tanto o cron quanto o envio manual fazem:
```
const mentor = aluno.consultorId ? consultorMap.get(aluno.consultorId) : null;
if (!mentor) continue;
```
Isso significa que alunos SEM consultorId atribuído no PDI são IGNORADOS.
Como vimos antes, 220 de 225 PDIs não têm consultorId.
O sistema pula esses alunos silenciosamente.

### 2. Consequência
Na prática, POUCOS alertas são realmente enviados porque a maioria dos alunos
não tem consultorId preenchido. O cron mostra "88 alertas" mas provavelmente
muitos são ignorados por falta de mentor.

### 3. Solução necessária
Buscar o mentor da última sessão de mentoria quando o aluno não tem consultorId,
similar ao que já foi feito no getAllStudentsSessionProgress.
