# Relatório: Sistema de Alertas por E-mail de Mentoria

## 1. Para quem os e-mails são enviados?

| Campo | Destinatário |
|-------|-------------|
| **TO (Para)** | E-mail do **aluno** |
| **CC (Cópia)** | E-mail do **mentor** + e-mail do **administrador** (SMTP_USER) |

O e-mail é enviado diretamente para o aluno, com cópia para o mentor responsável e para o administrador do sistema.

## 2. O sistema considera alunos inativos?

**Não, alunos inativos NÃO recebem alertas.** A função `getAlunos()` que alimenta tanto o cron automático quanto o envio manual já filtra por `isActive = 1`. Apenas alunos ativos são considerados.

| Categoria | Quantidade |
|-----------|-----------|
| Alunos ativos | 243 |
| Alunos inativos | 2 (Usuário Teste, Maria Dinamar) |
| Ativos COM e-mail | 242 |
| Ativos SEM e-mail | 1 (Katilee Siqueira Maia - ignorada) |

## 3. Problema identificado: Alunos sem `consultorId`

Existe um problema importante no sistema atual. O código faz a seguinte verificação:

> Se o aluno não tem `consultorId` preenchido, ele é **ignorado silenciosamente** (não recebe alerta).

Na prática, isso significa que **53 alunos ativos** que não têm `consultorId` atribuído diretamente no cadastro estão sendo excluídos dos alertas, mesmo que tenham sessões de mentoria registradas com um mentor.

| Situação | Quantidade |
|----------|-----------|
| Ativos COM consultorId | 190 (recebem alertas normalmente) |
| Ativos SEM consultorId | 53 (NÃO recebem alertas) |
| Desses 53, com sessões registradas | 26 (deveriam receber, mas não recebem) |
| Desses 53, sem nenhuma sessão | 27 (não têm mentor identificável) |

## 4. Resumo

O sistema está correto em **excluir alunos inativos**. Porém, está **deixando de enviar alertas para 26 alunos** que têm sessões de mentoria registradas mas não têm o campo `consultorId` preenchido no cadastro. Para esses alunos, seria necessário buscar o mentor da última sessão de mentoria (assim como já foi feito na tabela de Sessões por Aluno).

## 5. Correção necessária

Tanto no cron automático (`cronAlertasMentoria.ts`) quanto no envio manual (`routers.ts > enviarAlertas`), quando o aluno não tem `consultorId`, o sistema deveria buscar o mentor da última sessão de mentoria registrada, em vez de simplesmente ignorar o aluno.
