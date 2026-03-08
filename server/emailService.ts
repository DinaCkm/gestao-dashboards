import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

// ============ GMAIL SMTP TRANSPORTER ============

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!ENV.smtpUser || !ENV.smtpPass) {
      throw new Error("SMTP_USER e SMTP_PASS não configurados. Configure as credenciais do Gmail.");
    }
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
  }
  return transporter;
}

// ============ SEND EMAIL HELPER ============

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"ECOSSISTEMA DO BEM" <${ENV.smtpUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || "",
    });
    console.log(`[Email] Enviado para ${options.to} - MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] Erro ao enviar para ${options.to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ============ VERIFY SMTP CONNECTION ============

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log("[Email] Conexão SMTP verificada com sucesso.");
    return true;
  } catch (error: any) {
    console.error("[Email] Falha na verificação SMTP:", error.message);
    return false;
  }
}

// ============ EMAIL TEMPLATES ============

export function buildOnboardingInviteEmail(data: {
  alunoName: string;
  alunoEmail: string;
  alunoId: string;
  empresaName?: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Bem-vindo(a) ao ECOSSISTEMA DO BEM — Seu acesso está pronto!`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f2b3c 0%, #1a4a5e 100%); padding: 30px 40px; text-align: center;">
              <h1 style="color: #e8a838; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">
                ECOSSISTEMA DO BEM
              </h1>
              <p style="color: #a0c4d4; margin: 8px 0 0; font-size: 14px;">
                Programa de Desenvolvimento e Mentoria
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 20px;">
                Olá, ${data.alunoName}! 👋
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                Você foi cadastrado(a) no <strong>ECOSSISTEMA DO BEM</strong>${data.empresaName ? ` pela empresa <strong>${data.empresaName}</strong>` : ""}. 
                Estamos muito felizes em ter você conosco!
              </p>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 25px;">
                Para iniciar sua jornada de desenvolvimento, acesse a plataforma e complete o seu <strong>Onboarding</strong>.
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="background-color: #f0f7fa; border: 1px solid #d1e5ed; border-radius: 8px; padding: 20px;">
                    <p style="color: #0f2b3c; font-size: 14px; font-weight: 600; margin: 0 0 12px;">
                      📋 Seus dados de acesso:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 80px;">Email:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.alunoEmail}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 80px;">ID:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.alunoId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Acessar a Plataforma
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Caso o botão não funcione, copie e cole este link no seu navegador:<br>
                <a href="${data.loginUrl}" style="color: #1a4a5e; word-break: break-all;">${data.loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Este é um email automático do ECOSSISTEMA DO BEM.<br>
                Em caso de dúvidas, entre em contato com a administração do programa.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Olá, ${data.alunoName}!

Você foi cadastrado(a) no ECOSSISTEMA DO BEM${data.empresaName ? ` pela empresa ${data.empresaName}` : ""}.

Para iniciar sua jornada de desenvolvimento, acesse a plataforma e complete o seu Onboarding.

Seus dados de acesso:
- Email: ${data.alunoEmail}
- ID: ${data.alunoId}

Acesse: ${data.loginUrl}

Este é um email automático do ECOSSISTEMA DO BEM.`;

  return { subject, html, text };
}
