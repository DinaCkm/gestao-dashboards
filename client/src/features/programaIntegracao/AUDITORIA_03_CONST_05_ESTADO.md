# Auditoria funcional — 03-const.js e 05-estado.js

Fonte funcional obrigatória: HTML histórico mais recente da Trilha de Integração.

## Objetivo

Verificar se as constantes, regras de estado e cálculos do sistema original permanecem presentes na reconstrução EcoLíder, distinguindo:

- paridade direta;
- adaptação arquitetural necessária;
- lacunas ainda previstas no checklist;
- diferenças que exigem correção.

## 03-const.js

### VAZIO
- Original: `PREENCHA AQUI`.
- Atual: `MARCADOR_EMAIL_VAZIO` / `VAZIO` mantém exatamente `PREENCHA AQUI`.
- Resultado: equivalente.

### LINKS_PADRAO
- Original: 7 links, sendo 5 formulários, EcoLíder e suporte CKM.
- Atual: 7 definições equivalentes em `emailLinksHelpers.ts`.
- Adaptação intencional: os 5 formulários não usam mais as URLs históricas do Microsoft Forms; usam as rotas públicas fixas do EcoLíder, seguindo a atualização já presente no próprio HTML histórico mais recente.
- EcoLíder e suporte permanecem configuráveis quando aplicável.
- Resultado: equivalente com adaptação arquitetural correta.

### Feriados
- Original: feriados fixos nacionais + Tocantins + Palmas, Carnaval, Sexta-feira Santa e Corpus Christi, anos 2025–2030.
- Atual: `configDefaults.ts` reproduz os mesmos feriados e o mesmo cálculo de Páscoa.
- Diferença encontrada e corrigida nesta auditoria: o original usa os feriados padrão quando `state.config.feriados` está ausente **ou vazio**. `cronogramaReal()` agora faz o mesmo fallback quando recebe lista vazia.
- Resultado: equivalente após correção.

### STATUS / STATUS_NOME / FECHADO
- Original: pendente, programado, em andamento, aguardando resposta, concluída, não se aplica e não será feita; estados fechados `ok`, `na`, `wont`.
- Atual: mesmos códigos preservados em `StatusAcaoLegado`; labels equivalentes na UI; conjunto fechado reproduzido onde a regra é usada.
- Resultado: equivalente.

### CURSOS_PADRAO
- Original: 8 cursos e respectivas cargas, incluindo `Trilha das Competências do Futuro` com 485h.
- Atual: `CURSOS_PADRAO_INTEGRACAO` mantém os 8 registros e cargas exatamente.
- Resultado: equivalente.

### CORES
- Original: paleta usada na criação de processo legado.
- Atual: a nova criação/edição de pessoas ainda está pendente no checklist; o campo `cor` é preservado pelo tipo/processo e pela persistência.
- Resultado: funcionalidade dependente do bloco `Gerenciar pessoas`; não considerada perda do 03-const enquanto esse bloco estiver pendente.

### LADO
- Original: CKM=`ckm`; UGP/Gestor/Anjo/Colaborador=`eles`.
- Atual: `LADO_RESPONSAVEL` reproduz exatamente esse mapeamento.
- Resultado: equivalente.

### PLANO
- Original: 19 etapas e 95 ações, com os mesmos IDs e metadados (`mail`, `mails`, `link`, `form`, `pdf`, `tut`, `ata`, `al`, `mais`, `off`, `ajuste`).
- Atual: `PLANO_REAL` foi transposto do original e é a fonte funcional usada pelo Painel/Ficha atual.
- Resultado: equivalente na base; auditorias específicas de telas/handlers continuam no fechamento.

## 05-estado.js

### Datas e dias úteis
- Original: cálculo UTC por data ISO, sábado/domingo não úteis, feriados configurados com fallback padrão, `prox` e `ant` com limite de 40 iterações.
- Atual: `cronogramaReal()` preserva UTC, fim de semana, feriados e limite de 40; fallback padrão corrigido nesta auditoria.
- Resultado: equivalente.

### Estado central / persistência
- Original: `state` local, `localStorage` e sincronização Firebase.
- Atual: bootstrap/backend EcoLíder, persistência segura por endpoint, leitura de volta após gravações críticas e backup local separado.
- Resultado: adaptação arquitetural necessária. Não deve ser copiado literalmente porque a arquitetura atual é multiusuário e servidor.

### novoProcesso / P / ordem / ativos / encerrados
- Original: inicializa defaults e organiza processos.
- Atual: bootstrap preserva ordem; ativos/encerrados são derivados na página principal; helper de novo processo existe, mas a UI completa de criar/editar/reordenar/encerrar/reabrir ainda está no bloco pendente `Gerenciar pessoas`.
- Resultado: parcialmente coberto por arquitetura atual; UI pendente explicitamente rastreada.

### reg / fichaDe / stItem / fechado / limpar
- Original: normaliza estado antigo, cria ficha da ação, preserva notas e elimina ficha totalmente vazia.
- Atual: `itemStateHelpers.ts` reproduz normalização, ficha, status, limpeza e migração de `obs` para `notas`.
- Resultado: equivalente.

### alinReg
- Original: defaults de agendamento, relatório, notas e ata.
- Atual: `alinhamentoStateHelpers.ts` cria e normaliza os mesmos campos, incluindo `men` usado na preparação da mentora.
- Resultado: equivalente.

### aplicarAutomacoes
- Original: conclui programações vencidas; sincroniza solicitação de horário/agendamento; marca preparação da mentora; marca reunião realizada na ação de alinhamento.
- Atual: `aplicarAutomacoesProcesso()` reproduz essas quatro regras sobre cópia imutável do processo.
- Resultado: equivalente.

### linkDefs / linkU / linkN
- Original mais recente: 5 formulários apontam para o link público fixo da própria plataforma; demais links podem usar configuração.
- Atual: `definicoesLinksIntegracao()` reproduz essa política.
- Resultado: equivalente.

### modelo
- Original: combina modelo padrão e override por campo, com flag `editado`.
- Atual: editor/modelo de e-mail mantém padrão + overrides por campo e restauração individual.
- Resultado: equivalente; conferência textual dos 31 modelos permanece item separado.

### sincronização / bannerSinc / erroDb
- Original: quando offline, mantém cópia local e mostra aviso explícito para não apagar/remover dados; oferece reconectar e baixar backup local.
- Atual: cliente falha fechado e possui backup local, porém a experiência completa de banner/reconexão offline ainda está pendente no checklist `Proteção equivalente para falha de conexão` e `Tela de erro com recuperação segura`.
- Resultado: lacuna real conhecida, não encerrada por esta auditoria.

### cronograma / alinData / dataEtapa
- Original: cálculo por dia da jornada, ajustes de dias úteis, data confirmada do alinhamento, pós-alinhamento e agendamento 7 dias antes.
- Atual: `cronogramaReal()` reproduz a regra; consumidores localizam as etapas/alinhamentos no cronograma.
- Resultado: equivalente.

### estado / PESO / estadoEtapa
- Original: mesmos estados `late/act/wait/ontime/ok/off`, incluindo programado ou aguardando que passam a atrasado quando o prazo vence.
- Atual: `calcularStatusItem()` e `estadoEtapaDetalhe()` reproduzem vocabulário, peso e transições.
- Resultado: equivalente.

### progresso / diaAtual / pendencias / sinal / proximaEtapa
- Original: progresso por 95 ações; dia 1 na data de início; pendências separadas CKM/eles; sinal olha apenas CKM; próxima etapa é a primeira ainda aberta.
- Atual: `painelProcessos.ts` reproduz essas regras usando `PLANO_REAL` e `cronogramaReal`.
- Resultado: equivalente.

### ultimoPDI / pctResp / statusPdiTxt / statusCursosTxt
- Original: usa o último formulário PDI, índices 14 e 17, com fallback para campos manuais.
- Atual: `emailValoresHelpers.ts` reproduz os mesmos índices, escolha do último ciclo e textos.
- Resultado: equivalente.

### pendenciasTexto
- Original: formulários vencidos, PDI, Jornada Compliance, cursos, outras ações abertas e pendência manual.
- Atual: `pendenciasTextoEmail()` reproduz a composição.
- Resultado: equivalente.

### faltamFormularios / blocoRelatorio
- Original: nos agendamentos 2–4, verifica formulários anteriores do gestor e inclui relatório ou aviso de ausência.
- Atual: `faltamFormulariosGestor()` / `blocoRelatorioEmail()` reproduzem a regra e os mesmos IDs de ações.
- Resultado: equivalente.

## Conclusão da auditoria

- `03-const.js`: auditado integralmente quanto às estruturas funcionais que ele define.
- `05-estado.js`: auditado integralmente quanto às funções e comportamentos públicos desse bloco.
- Correção necessária encontrada: fallback de feriados padrão quando a lista configurada está vazia — corrigido.
- Lacunas identificadas já permanecem em itens próprios do checklist, principalmente offline/recuperação e Gerenciar pessoas.
- Nenhuma outra alteração funcional foi feita nesta auditoria.
