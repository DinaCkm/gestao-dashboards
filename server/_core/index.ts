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
import { ENV } from "./env";
import multer from "multer";
import { storagePut } from "../storage";

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
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Upload endpoint for images
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate file type
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" });
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File too large. Maximum size is 5MB" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = req.file.mimetype.split("/")[1];
      const fileName = `atividades/${timestamp}-${randomStr}.${fileExt}`;

      // Upload to S3
      const { url } = await storagePut(fileName, req.file.buffer, req.file.mimetype);

      res.json({ url, success: true });
    } catch (error: any) {
      console.error("[Upload] Error:", error);
      res.status(500).json({ error: "Upload failed", message: error?.message });
    }
  });

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
    } else {
      console.log("Cron jobs de e-mail desativados temporariamente.");
    }
  });
}

startServer().catch(console.error);
