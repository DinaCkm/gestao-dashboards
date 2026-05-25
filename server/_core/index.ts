import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { iniciarCronAlertasMentoria } from "../cronAlertasMentoria";
import { iniciarCronOnboardingReminders } from "../cronOnboardingReminders";
import { iniciarCronVencimentoCiclo } from "../cronVencimentoCiclo";
import { iniciarCronLembreteAplicabilidade } from "../cronLembreteAplicabilidade";
import { iniciarCronTarefasEmAberto } from "../cronTarefasEmAberto";
import { iniciarCronAusenciaWebinar } from "../cronAusenciaWebinar";
import { iniciarCronLembreteTarefaMentoria } from "../cronLembreteTarefaMentoria";
import { iniciarCronRelatorioMentorias } from "../cronRelatorioMentorias";
import { ENV } from "./env";
import { ensureBibliotecaPedagogicaTables, ensurePerfilProfissionalColumns, ensureHistoricoCiclosTable, ensureRelatorioMentoriasLogTable, ensureAuditoriaNotesMentoriaTable, ensureGoogleCalendarColumns } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Garantir que as tabelas da Biblioteca Pedagógica existam no banco
  await ensureBibliotecaPedagogicaTables();
  await ensurePerfilProfissionalColumns();
  await ensureHistoricoCiclosTable();
  await ensureRelatorioMentoriasLogTable();
  await ensureAuditoriaNotesMentoriaTable();
  await ensureGoogleCalendarColumns();

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Rota de diagnóstico temporária para verificar variáveis de ambiente do Google Calendar
  app.get('/api/diag-calendar', (_req, res) => {
    const val = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!val) return res.json({ ok: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON nao definida' });
    try {
      const parsed = JSON.parse(val);
      return res.json({ ok: true, client_email: parsed.client_email, project_id: parsed.project_id, key_len: parsed.private_key?.length });
    } catch (e: any) {
      return res.json({ ok: false, error: 'JSON invalido: ' + e.message, preview: val.substring(0, 80) });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

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
      iniciarCronLembreteTarefaMentoria();
      // Iniciar cron job de relatório de mentorias (dia 25 = prévia, dia 30 = definitivo)
      iniciarCronRelatorioMentorias();
    } else {
      console.log("Cron jobs de e-mail desativados temporariamente.");
    }
  });
}

startServer().catch(console.error);
