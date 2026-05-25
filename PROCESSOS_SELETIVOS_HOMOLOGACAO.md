# Homologacao - Modulo Processos Seletivos

Este guia e para publicar e testar o modulo de Processos Seletivos no ambiente separado do Railway, sem tocar na producao.

## Premissas de seguranca

- O servico de teste no Railway deve apontar para a branch `feature/processos-seletivos`.
- A variavel `DATABASE_URL` deve apontar para o MySQL de teste do projeto `Modulo Processo Seletivo`.
- Nao use credenciais, banco ou dominio do ambiente de producao neste projeto de teste.
- Nao rode `pnpm db:push` em Railway. Use `pnpm db:migrate`, que aplica apenas as migracoes ja versionadas.
- Nao configure migracao automatica no ambiente de producao enquanto este modulo estiver em homologacao.

## Passo a passo no Railway de teste

1. Abra o projeto de teste `Modulo Processo Seletivo`.
2. No servico `gestao-dashboards`, confirme que o deploy esta conectado ao repositorio `DinaCkm/gestao-dashboards`.
3. Configure a branch de deploy como `feature/processos-seletivos`.
4. Em `Variables`, confirme pelo menos estas variaveis no ambiente de teste:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OAUTH_SERVER_URL`
   - `EMAIL_ENABLED`
   - variaveis R2/S3 usadas pelo sistema, se o fluxo precisar de arquivos
5. Depois do deploy concluir, rode a migracao no ambiente de teste:

```bash
pnpm db:migrate
```

6. Acesse a URL publica do Railway e teste a rota:

```text
/processos-seletivos
```

## Roteiro minimo de QA

- Entrar como admin ou admin2.
- Criar processo seletivo Banrisul de teste.
- Criar pelo menos uma vaga e uma regiao.
- Criar ou importar candidatos em `nome;email;telefone`.
- Criar uma agenda por grupo/regiao e conferir se os slots respeitam o intervalo.
- Registrar conclusao de teste para um candidato.
- Confirmar que o candidato vai para o primeiro slot disponivel ou fica como `aguardando_agenda` quando nao houver slot.
- Registrar aprovacao e conferir o resumo de aprovados por regiao.

## Sinais de que esta seguro

- O deploy esta na branch `feature/processos-seletivos`.
- A base conectada e a base MySQL do Railway de teste.
- A producao continua na branch/ambiente atual.
- A migracao aplicada foi `0084_processos_seletivos.sql`.
- O sistema antigo continua acessivel sem mudancas de fluxo.
