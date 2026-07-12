import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { pdfRouter } from "../pdfRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { iniciarCronAlertasMentoria } from "../cronAlertasMentoria";
import { iniciarCronOnboardingReminders } from "../cronOnboardingReminders";
import { iniciarCronVencimentoCiclo } from "../cronVencimentoCiclo";
import { iniciarCronLembreteAplicabilidade } from "../cronLembreteAplicabilidade";
import { iniciarCronTarefasEmAberto } from "../cronTarefasEmAberto";
import { iniciarCronAusenciaWebinar } from "../cronAusenciaWebinar";
import { iniciarCronLembreteTarefaMentoria } from "../cronLembreteTarefaMentoria"; // mantido mas desativado
import { iniciarCronPreparacaoSessao } from "../cronPreparacaoSessao";
import { iniciarCronRelatorioMentorias } from "../cronRelatorioMentorias";
import { iniciarCronPsLembreteD1 } from "../cronPsLembreteD1";
import { iniciarCronLembreteChecklistWebinar } from "../cronLembreteChecklistWebinar";
import { iniciarCronDevolutivaLembreteD1 } from "../cronDevolutivaLembreteD1";
import { ENV } from "./env";
import { ensureBibliotecaPedagogicaTables, ensurePerfilProfissionalColumns, ensureHistoricoCiclosTable, ensureRelatorioMentoriasLogTable, ensureAuditoriaNotesMentoriaTable, ensureGoogleCalendarColumns, ensureProcessoSeletivoColumns, ensureRelatorioEntrevistaColumns, ensurePdfAtividadeSupport, ensureDevolutivasTables } from "../db";



async function startServer() {
  // Garantir que as tabelas da Biblioteca Pedagógica existam no banco
  await ensureBibliotecaPedagogicaTables();
  await ensurePerfilProfissionalColumns();
  await ensureHistoricoCiclosTable();
  await ensureRelatorioMentoriasLogTable();
  await ensureAuditoriaNotesMentoriaTable();
  await ensureGoogleCalendarColumns();
  await ensureProcessoSeletivoColumns(); // v2: garante coluna comunicado no banco
  await ensureRelatorioEntrevistaColumns(); // v3: garante colunas do relatório consolidado de entrevista
  await ensureDevolutivasTables(); // v4: garante tabela e colunas de devolutiva PS
  await ensurePdfAtividadeSupport(); // garante suporte a PDF nas atividades de curso

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Geracao de PDF server-side via Chromium headless (Puppeteer)
  app.use(pdfRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Endpoint de diagnóstico para verificar qual versão está rodando
  app.get("/api/build-info", (_req, res) => {
    res.json({
      environment: process.env.NODE_ENV || "unknown",
      port,
      timestamp: new Date().toISOString(),
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || "unknown",
    });
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Endpoint para verificar se o módulo EcoDISC 360 está disponível
  app.get("/api/disc360/status", (_req, res) => {
    res.json({ status: "available", module: "disc360", timestamp: new Date().toISOString() });
  });

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    if (ENV.emailEnabled) {
      // Iniciar cron job de alertas de mentoria (verifica diariamente alunos sem sessão há 30+ dias)
      iniciarCronAlertasMentoria();
      // Iniciar cron job de lembretes de onboarding (verifica a cada 1h alunos parados há 24h+)
      iniciarCronOnboardingReminders();
      // Iniciar cron job de alertas de vencimento de macrociclo (verifica diariamente PDIs próximos do vencimento)
      iniciarCronVencimentoCiclo();
      // Iniciar cron job de lembretes de aplicabilidade prática (verifica a cada 12h sessões agendadas nas próximas 48h)
      iniciarCronLembreteAplicabilidade();
      // Iniciar cron job de alertas de tarefas em aberto há 45+ dias (verifica diariamente)
      iniciarCronTarefasEmAberto();
      // Iniciar cron job de lembretes de ausência em webinar (verifica diariamente, cooldown 15 dias)
      iniciarCronAusenciaWebinar();
      // Iniciar cron job de lembretes de tarefa pendente + próxima mentoria (verifica diariamente, cooldown 15 dias)
      // iniciarCronLembreteTarefaMentoria(); // substituído por cronPreparacaoSessao
      iniciarCronPreparacaoSessao(); // lembrete D-1 com todas as pendências
      // Iniciar cron job de relatório de mentorias (dia 25 = prévia, dia 30 = definitivo)
      iniciarCronRelatorioMentorias();
      // Iniciar cron job de lembrete D-1 para entrevistas do Processo Seletivo
      iniciarCronPsLembreteD1();
      // Iniciar cron job de lembrete D-1 para devolutivas do Processo Seletivo
      iniciarCronDevolutivaLembreteD1();
      // Iniciar cron job de lembretes automáticos do checklist de webinar (diário, ignora status do webinar, cooldown 24h por tarefa)
      iniciarCronLembreteChecklistWebinar();
    } else {
      console.log("Cron jobs de e-mail desativados temporariamente.");
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
