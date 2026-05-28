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
  cc?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Envio habilitado quando SMTP_USER e SMTP_PASS estiverem configurados
  // EMAIL_ENABLED=false desativa explicitamente (ex: ambiente de desenvolvimento sem SMTP)
  const smtpConfigurado = !!(ENV.smtpUser && ENV.smtpPass);
  if (!ENV.emailEnabled && !smtpConfigurado) {
    console.log(`[Email] Envio desativado: EMAIL_ENABLED=false e sem credenciais SMTP. Destinatário: ${options.to}`);
    return { success: false, error: "Envio de e-mails temporariamente desativado." };
  }
  if (!ENV.emailEnabled && smtpConfigurado) {
    console.log(`[Email] EMAIL_ENABLED=false ignorado pois SMTP está configurado. Prosseguindo envio para: ${options.to}`);
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"ECOSSISTEMA DO BEM" <${ENV.smtpUser}>`,
      to: options.to,
      cc: options.cc || undefined,
      subject: options.subject,
      html: options.html,
      text: options.text || "",
    });
    console.log(`[Email] Enviado para ${options.to}${options.cc ? ` (cc: ${options.cc})` : ''} - MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] Erro ao enviar para ${options.to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ============ VERIFY SMTP CONNECTION ============

export async function verifySmtpConnection(): Promise<boolean> {
  if (!ENV.emailEnabled) {
    console.log("[Email] Verificação SMTP ignorada: envio desativado.");
    return false;
  }

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

// ============ MENTORING ALERT EMAIL ============

export function buildMentoringAlertEmail(data: {
  alunoName: string;
  mentorName: string;
  diasSemSessao: number;
  ultimaSessaoDate: string | null;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Alerta: ${data.diasSemSessao} dias sem sessão de mentoria — ${data.alunoName}`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const ultimaSessaoStr = data.ultimaSessaoDate
    ? new Date(data.ultimaSessaoDate).toLocaleDateString('pt-BR')
    : 'Nenhuma sessão registrada';

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
          
          <!-- Header com Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 12px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">
                Programa de Desenvolvimento e Mentoria
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 2px solid #e8a838; margin: 0;" />
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background-color: #fef3c7; padding: 20px 40px; text-align: center;">
              <p style="color: #92400e; font-size: 18px; font-weight: 700; margin: 0;">
                Alerta de Acompanhamento
              </p>
              <p style="color: #b45309; font-size: 14px; margin: 8px 0 0;">
                ${data.diasSemSessao} dias sem sessão de mentoria
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 20px;">
                Olá, ${data.alunoName}!
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Identificamos que já faz <strong>${data.diasSemSessao} dias</strong> desde a sua última sessão de mentoria. 
                A continuidade das mentorias é fundamental para o seu desenvolvimento no programa.
              </p>

              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td style="background-color: #f0f7fa; border: 1px solid #d1e5ed; border-radius: 8px; padding: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Mentor(a):</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.mentorName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Última sessão:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${ultimaSessaoStr}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Dias sem sessão:</td>
                        <td style="color: #dc2626; font-size: 14px; font-weight: 700; padding: 4px 0;">${data.diasSemSessao} dias</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 25px;">
                Recomendamos que entre em contato com seu(sua) mentor(a) <strong>${data.mentorName}</strong> 
                para agendar a próxima sessão o mais breve possível.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.<br>
                      Mentor(a) e administração estão em cópia neste e-mail.<br>
                      &copy; ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Alerta de Acompanhamento - ECOSSISTEMA DO BEM

Olá, ${data.alunoName}!

Identificamos que já faz ${data.diasSemSessao} dias desde a sua última sessão de mentoria.

Mentor(a): ${data.mentorName}
Última sessão: ${ultimaSessaoStr}
Dias sem sessão: ${data.diasSemSessao} dias

Recomendamos que entre em contato com seu(sua) mentor(a) ${data.mentorName} para agendar a próxima sessão.

Acesse a plataforma: ${data.loginUrl}

Este e-mail foi enviado automaticamente. Mentor(a) e administração estão em cópia.
&copy; ${new Date().getFullYear()} CKM Talents`;

  return { subject, html, text };
}

// ============ ONBOARDING INVITE EMAIL ============

export function buildOnboardingInviteEmail(data: {
  alunoName: string;
  alunoEmail: string;
  alunoId: string;
  empresaName?: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `🎉 Parabéns! Sua jornada no ECOSSISTEMA DO BEM começa agora!`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

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
          
          <!-- Header com Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 12px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">
                Programa de Desenvolvimento e Mentoria
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 2px solid #e8a838; margin: 0;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 22px;">
                🎉 Parabéns, ${data.alunoName}!
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                É com muita alegria que informamos que você foi selecionado(a) para participar do <strong>ECOSSISTEMA DO BEM</strong>${data.empresaName ? ` pela empresa <strong>${data.empresaName}</strong>` : ""}! 🌟
              </p>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Este é o início de uma <strong>jornada transformadora de desenvolvimento profissional e pessoal</strong>. Você terá acesso a mentorias exclusivas, trilhas de competências e ferramentas que vão impulsionar sua carreira! 🚀
              </p>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 25px;">
                Para dar o primeiro passo, acesse a plataforma e complete o seu <strong>Onboarding</strong>. Estamos ansiosos para acompanhar sua evolução! 💪
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="background-color: #f0f7fa; border: 1px solid #d1e5ed; border-radius: 8px; padding: 20px;">
                    <p style="color: #0f2b3c; font-size: 14px; font-weight: 600; margin: 0 0 12px;">
                      🔑 Seus dados de acesso:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 80px;">📧 Email:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.alunoEmail}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 80px;">🆔 ID:</td>
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
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      ✨ Iniciar Minha Jornada
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

          <!-- Motivational Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #e8a838 0%, #f0c060 100%); padding: 20px 40px; text-align: center;">
              <p style="color: #0f2b3c; font-size: 15px; font-weight: 600; margin: 0; line-height: 1.6;">
                🌱 "O desenvolvimento é uma jornada, não um destino. Cada passo conta!" 🌱
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="60" style="opacity: 0.7;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      Este é um email automático do ECOSSISTEMA DO BEM.<br>
                      Em caso de dúvidas, entre em contato com a administração do programa.<br>
                      © ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `🎉 Parabéns, ${data.alunoName}!

É com muita alegria que informamos que você foi selecionado(a) para participar do ECOSSISTEMA DO BEM${data.empresaName ? ` pela empresa ${data.empresaName}` : ""}! 🌟

Este é o início de uma jornada transformadora de desenvolvimento profissional e pessoal. Você terá acesso a mentorias exclusivas, trilhas de competências e ferramentas que vão impulsionar sua carreira! 🚀

Para dar o primeiro passo, acesse a plataforma e complete o seu Onboarding. 💪

🔑 Seus dados de acesso:
- 📧 Email: ${data.alunoEmail}
- 🆔 ID: ${data.alunoId}

✨ Acesse: ${data.loginUrl}

🌱 "O desenvolvimento é uma jornada, não um destino. Cada passo conta!" 🌱

Este é um email automático do ECOSSISTEMA DO BEM.
© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ WEBINAR REMINDER EMAIL ============

export function buildWebinarReminderEmail(data: {
  alunoName: string;
  webinarTitle: string;
  eventDate: string; // formatted date string (dd/mm/yyyy)
  eventTime: string; // formatted time string (HH:mm)
  meetingLink?: string | null;
  speaker?: string | null;
  theme?: string | null;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Lembrete: ${data.webinarTitle} - ${data.eventDate} às ${data.eventTime}`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

  const speakerRow = data.speaker ? `
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Palestrante:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.speaker}</td>
                      </tr>` : '';

  const themeRow = data.theme ? `
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Tema:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.theme}</td>
                      </tr>` : '';

  const meetingLinkSection = data.meetingLink ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td align="center">
                    <a href="${data.meetingLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">
                      Acessar Reunião
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <a href="${data.meetingLink}" style="color: #1a4a5e; font-size: 12px; word-break: break-all;">${data.meetingLink}</a>
                  </td>
                </tr>
              </table>` : '';

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
          
          <!-- Header com Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 12px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">
                Programa de Desenvolvimento e Mentoria
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 2px solid #e8a838; margin: 0;" />
            </td>
          </tr>

          <!-- Event Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A1E3E 0%, #2D5A87 100%); padding: 24px 40px; text-align: center;">
              <p style="color: #e8a838; font-size: 13px; font-weight: 600; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 1px;">
                Lembrete de Evento
              </p>
              <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; line-height: 1.4;">
                ${data.webinarTitle}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 18px;">
                Olá, ${data.alunoName}!
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Este é um lembrete do evento que está chegando. Não perca! Sua participação é muito importante para o seu desenvolvimento no programa.
              </p>

              <!-- Event Details Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td style="background-color: #f0f7fa; border: 1px solid #d1e5ed; border-radius: 8px; padding: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Evento:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.webinarTitle}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Data:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 4px 0;">${data.eventDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 4px 0; width: 140px;">Horário:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 700; padding: 4px 0;">${data.eventTime} (horário de Brasília)</td>
                      </tr>${speakerRow}${themeRow}
                    </table>
                  </td>
                </tr>
              </table>

              ${meetingLinkSection}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Marque na sua agenda e prepare-se para mais uma experiência de aprendizado!
              </p>
            </td>
          </tr>

          <!-- Motivational Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #e8a838 0%, #f0c060 100%); padding: 16px 40px; text-align: center;">
              <p style="color: #0f2b3c; font-size: 14px; font-weight: 600; margin: 0;">
                Sua presença faz a diferença! Nos vemos no evento.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.<br>
                      Em caso de dúvidas, entre em contato com a administração do programa.<br>
                      &copy; ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Lembrete de Evento - ECOSSISTEMA DO BEM

Olá, ${data.alunoName}!

Este é um lembrete do evento que está chegando:

Evento: ${data.webinarTitle}
Data: ${data.eventDate}
Horário: ${data.eventTime} (horário de Brasília)${data.speaker ? `\nPalestrante: ${data.speaker}` : ''}${data.theme ? `\nTema: ${data.theme}` : ''}${data.meetingLink ? `\nLink da reunião: ${data.meetingLink}` : ''}

Sua participação é muito importante para o seu desenvolvimento no programa.

Acesse a plataforma: ${data.loginUrl}

Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.
© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ ONBOARDING STEP ADVANCEMENT EMAIL (for admin + dina) ============

export function buildOnboardingStepEmail(data: {
  alunoName: string;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
}): { subject: string; html: string; text: string } {
  const subject = `${data.alunoName} avançou na trilha do onboarding — Etapa ${data.stepNumber}/${data.totalSteps}: ${data.stepName}`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

  const stepNames = [
    'Convite Enviado',
    'Cadastro Preenchido',
    'Teste Realizado',
    'Mentoria Agendada',
    'PDI Publicado',
    'Termo de Compromisso Assinado',
  ];

  const stepsHtml = stepNames.map((name, i) => {
    const num = i + 1;
    const isCompleted = num <= data.stepNumber;
    const isCurrent = num === data.stepNumber;
    const bgColor = isCompleted ? '#10b981' : '#e5e7eb';
    const textColor = isCompleted ? '#ffffff' : '#9ca3af';
    const border = isCurrent ? '3px solid #059669' : 'none';
    return `
      <td align="center" style="padding: 4px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background-color: ${bgColor}; border: ${border}; display: inline-flex; align-items: center; justify-content: center; line-height: 36px; text-align: center;">
          <span style="color: ${textColor}; font-size: 14px; font-weight: 700;">${isCompleted ? '✓' : num}</span>
        </div>
        <p style="color: ${isCompleted ? '#065f46' : '#9ca3af'}; font-size: 10px; margin: 4px 0 0; line-height: 1.2; max-width: 70px;">${name}</p>
      </td>`;
  }).join('');

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
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="140" style="display: block; margin: 0 auto 8px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 12px;">Acompanhamento de Onboarding</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;"><hr style="border: none; border-top: 2px solid #e8a838; margin: 0;" /></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 16px; font-size: 20px;">
                Progresso no Onboarding
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                <strong>${data.alunoName}</strong> avançou na sua trilha do onboarding e completou a etapa:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
                <tr>
                  <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px 20px; text-align: center;">
                    <p style="color: #065f46; font-size: 18px; font-weight: 700; margin: 0;">
                      Etapa ${data.stepNumber}: ${data.stepName}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Progress Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
                <tr>
                  ${stepsHtml}
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
                Progresso: <strong>${data.stepNumber} de ${data.totalSteps}</strong> etapas concluídas
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Este é um email automático do ECOSSISTEMA DO BEM.<br>
                © ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${data.alunoName} avançou na trilha do onboarding!

Etapa ${data.stepNumber}/${data.totalSteps}: ${data.stepName}

Este é um email automático do ECOSSISTEMA DO BEM.
© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ PDI PUBLISHED - INVITE STUDENT TO SIGN ============

export function buildPdiPublishedInviteEmail(data: {
  alunoName: string;
  mentorName: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Seu Plano de Desenvolvimento está pronto! Acesse e assine o Termo de Compromisso`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

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
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 12px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">Programa de Desenvolvimento e Mentoria</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;"><hr style="border: none; border-top: 2px solid #e8a838; margin: 0;" /></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 22px;">
                Seu Plano de Desenvolvimento está pronto!
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Olá, <strong>${data.alunoName}</strong>!
              </p>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Temos uma ótima notícia! Seu(sua) mentor(a) <strong>${data.mentorName}</strong> finalizou o seu <strong>Plano de Desenvolvimento Individual (PDI)</strong>. 🎯
              </p>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 25px;">
                Agora é a sua vez! Acesse a plataforma para visualizar o seu plano e assinar o <strong>Termo de Compromisso</strong> para dar início oficial à sua jornada de desenvolvimento.
              </p>

              <!-- What to do box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="background-color: #f0f7fa; border: 1px solid #d1e5ed; border-radius: 8px; padding: 20px;">
                    <p style="color: #0f2b3c; font-size: 14px; font-weight: 600; margin: 0 0 12px;">
                      O que você precisa fazer:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #4a5568; font-size: 14px; padding: 6px 0;">1. Acesse a plataforma pelo botão abaixo</td>
                      </tr>
                      <tr>
                        <td style="color: #4a5568; font-size: 14px; padding: 6px 0;">2. Visualize o seu Plano de Desenvolvimento (PDI)</td>
                      </tr>
                      <tr>
                        <td style="color: #4a5568; font-size: 14px; padding: 6px 0;">3. Assine o Termo de Compromisso (Aceite)</td>
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
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Acessar Meu PDI
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

          <!-- Motivational Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #e8a838 0%, #f0c060 100%); padding: 20px 40px; text-align: center;">
              <p style="color: #0f2b3c; font-size: 15px; font-weight: 600; margin: 0; line-height: 1.6;">
                "O primeiro passo para a transformação é o compromisso com o seu desenvolvimento!"
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="60" style="opacity: 0.7;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      Este é um email automático do ECOSSISTEMA DO BEM.<br>
                      Em caso de dúvidas, entre em contato com a administração do programa.<br>
                      © ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Olá, ${data.alunoName}!

Seu(sua) mentor(a) ${data.mentorName} finalizou o seu Plano de Desenvolvimento Individual (PDI)!

Agora é a sua vez! Acesse a plataforma para visualizar o seu plano e assinar o Termo de Compromisso.

O que você precisa fazer:
1. Acesse a plataforma: ${data.loginUrl}
2. Visualize o seu Plano de Desenvolvimento (PDI)
3. Assine o Termo de Compromisso (Aceite)

"O primeiro passo para a transformação é o compromisso com o seu desenvolvimento!"

Este é um email automático do ECOSSISTEMA DO BEM.
© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ ONBOARDING REMINDER EMAIL (24h) ============

export function buildOnboardingReminderEmail(data: {
  alunoName: string;
  etapaPendente: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `🌟 Estamos te esperando, ${data.alunoName}! — ECOSSISTEMA DO BEM`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f2b3c 0%,#1a4a6e 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">ECOSSISTEMA DO BEM</h1>
            <p style="color:#e8913a;margin:8px 0 0;font-size:13px;letter-spacing:1px;">TRILHA DE ONBOARDING</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#0f2b3c;margin:0 0 16px;font-size:20px;">Olá, ${data.alunoName}! 👋</h2>
            <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 20px;">
              Estamos te esperando para realizar o <strong style="color:#e8913a;">${data.etapaPendente}</strong>.
            </p>
            <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 24px;">
              Seguir na trilha é uma <strong>grande conquista</strong> para o seu desenvolvimento. 
              Cada etapa concluída te aproxima de alcançar todo o seu potencial!
            </p>
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 24px;">
                <a href="${data.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#e8913a,#d4782e);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.5px;">
                  Acessar a Plataforma
                </a>
              </td></tr>
            </table>
            <!-- Motivational quote -->
            <div style="background:#f0f7ff;border-left:4px solid #1a4a6e;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 16px;">
              <p style="color:#1a4a6e;font-size:14px;margin:0;font-style:italic;">
                "O caminho do desenvolvimento é feito de pequenos passos consistentes. Cada etapa concluída é uma vitória!"
              </p>
            </div>
            <p style="color:#888;font-size:12px;margin:16px 0 0;">
              Sua próxima etapa: <strong>${data.etapaPendente}</strong>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#999;font-size:11px;margin:0;">
              Este é um lembrete automático do ECOSSISTEMA DO BEM.<br>
              © ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Olá, ${data.alunoName}!

Estamos te esperando para realizar o ${data.etapaPendente}.

Seguir na trilha é uma grande conquista para o seu desenvolvimento. Cada etapa concluída te aproxima de alcançar todo o seu potencial!

Acesse a plataforma: ${data.loginUrl}

"O caminho do desenvolvimento é feito de pequenos passos consistentes. Cada etapa concluída é uma vitória!"

Este é um lembrete automático do ECOSSISTEMA DO BEM.
© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ CYCLE DEADLINE ALERT EMAIL ============

export function buildCycleDeadlineAlertEmail(data: {
  alunoName: string;
  mentorName: string;
  trilhaNome: string;
  programaNome: string;
  macroTermino: string;
  diasRestantes: number;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const urgencyLabel = data.diasRestantes <= 7 ? 'URGENTE' : data.diasRestantes <= 15 ? 'ATENÇÃO' : 'AVISO';
  const subject = `${urgencyLabel}: Ciclo de ${data.alunoName} vence em ${data.diasRestantes} dias — ${data.trilhaNome}`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const macroTerminoFormatted = new Date(data.macroTermino + 'T12:00:00').toLocaleDateString('pt-BR');

  // Color scheme based on urgency
  const bannerBg = data.diasRestantes <= 7 ? '#fef2f2' : data.diasRestantes <= 15 ? '#fef3c7' : '#f0f7fa';
  const bannerTextColor = data.diasRestantes <= 7 ? '#991b1b' : data.diasRestantes <= 15 ? '#92400e' : '#0f2b3c';
  const bannerSubColor = data.diasRestantes <= 7 ? '#dc2626' : data.diasRestantes <= 15 ? '#b45309' : '#1e6a8a';
  const daysColor = data.diasRestantes <= 7 ? '#dc2626' : data.diasRestantes <= 15 ? '#d97706' : '#2563eb';

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
          
          <!-- Header com Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 12px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">
                Programa de Desenvolvimento e Mentoria
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 2px solid #e8a838; margin: 0;" />
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background-color: ${bannerBg}; padding: 20px 40px; text-align: center;">
              <p style="color: ${bannerTextColor}; font-size: 18px; font-weight: 700; margin: 0;">
                ${urgencyLabel}: Vencimento de Ciclo Próximo
              </p>
              <p style="color: ${bannerSubColor}; font-size: 14px; margin: 8px 0 0;">
                Faltam <strong>${data.diasRestantes} dias</strong> para o encerramento do macrociclo
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 20px;">
                Olá, ${data.alunoName}!
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Este é um alerta automático para informar que o seu macrociclo de desenvolvimento está 
                próximo de encerrar. Aproveite o tempo restante para concluir suas atividades e metas pendentes.
              </p>

              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td style="background-color: #f0f7fa; border: 1px solid #d1e5ed; border-radius: 8px; padding: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 6px 0; width: 160px;">Aluno(a):</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 6px 0;">${data.alunoName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 6px 0; width: 160px;">Programa:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 6px 0;">${data.programaNome}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 6px 0; width: 160px;">Trilha:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 6px 0;">${data.trilhaNome}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 6px 0; width: 160px;">Mentor(a):</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 6px 0;">${data.mentorName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 6px 0; width: 160px;">Data de término:</td>
                        <td style="color: #0f2b3c; font-size: 14px; font-weight: 600; padding: 6px 0;">${macroTerminoFormatted}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 6px 0; width: 160px;">Dias restantes:</td>
                        <td style="color: ${daysColor}; font-size: 16px; font-weight: 700; padding: 6px 0;">${data.diasRestantes} dias</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 15px;">
                <strong>Recomendações:</strong>
              </p>
              <ul style="color: #4a5568; font-size: 14px; line-height: 2; margin: 0 0 25px; padding-left: 20px;">
                <li>Verifique suas metas e atividades pendentes no PDI</li>
                <li>Agende sessões de mentoria com <strong>${data.mentorName}</strong> se necessário</li>
                <li>Conclua as atividades práticas em aberto</li>
                <li>Prepare o case de sucesso do macrociclo, se aplicável</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.<br>
                      Mentor(a), administração e coordenação estão em cópia neste e-mail.<br>
                      &copy; ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${urgencyLabel}: Vencimento de Ciclo Próximo - ECOSSISTEMA DO BEM

Olá, ${data.alunoName}!

Seu macrociclo de desenvolvimento está próximo de encerrar.

Aluno(a): ${data.alunoName}
Programa: ${data.programaNome}
Trilha: ${data.trilhaNome}
Mentor(a): ${data.mentorName}
Data de término: ${macroTerminoFormatted}
Dias restantes: ${data.diasRestantes} dias

Recomendações:
- Verifique suas metas e atividades pendentes no PDI
- Agende sessões de mentoria com ${data.mentorName} se necessário
- Conclua as atividades práticas em aberto
- Prepare o case de sucesso do macrociclo, se aplicável

Acesse a plataforma: ${data.loginUrl}

Este e-mail foi enviado automaticamente. Mentor(a), administração e coordenação estão em cópia.
© ${new Date().getFullYear()} CKM Talents`;

  return { subject, html, text };
}


// ============ EMAIL DE PARABÉNS - ACEITE DO ONBOARDING ============

export function buildAceiteParabensEmail(data: {
  alunoName: string;
  mentorName: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `🎉 Parabéns, ${data.alunoName}! Bem-vindo(a) à sua Jornada de Desenvolvimento!`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

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
          
          <!-- Header com gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A1E3E 0%, #1a3a6a 50%, #F5991F 100%); padding: 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 16px;" />
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px; font-weight: 800;">🎉 Parabéns!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Sua jornada de desenvolvimento começa agora!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #0A1E3E; font-size: 18px; font-weight: 700; margin: 0 0 16px;">
                Olá, ${data.alunoName}! 🌟
              </p>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Você acaba de dar o passo mais importante: <strong>assinou o Termo de Compromisso</strong> e se comprometeu com o seu próprio crescimento profissional e pessoal.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: #065f46; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
                      ✅ Onboarding Concluído com Sucesso!
                    </p>
                    <p style="color: #047857; font-size: 14px; margin: 0;">
                      Todas as etapas foram finalizadas. Seu portal está liberado!
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                <strong>O que vem agora:</strong>
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f0f9ff; border-left: 4px solid #0A1E3E; border-radius: 0 8px 8px 0; margin-bottom: 8px;">
                    <p style="color: #0A1E3E; font-size: 14px; margin: 0;"><strong>📚 Cursos e Webinars</strong> — Acesse os conteúdos disponíveis no seu portal</p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #fff7ed; border-left: 4px solid #F5991F; border-radius: 0 8px 8px 0;">
                    <p style="color: #0A1E3E; font-size: 14px; margin: 0;"><strong>🎯 Metas e Atividades</strong> — Acompanhe suas metas de desenvolvimento</p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 0 8px 8px 0;">
                    <p style="color: #0A1E3E; font-size: 14px; margin: 0;"><strong>🤝 Mentoria com ${data.mentorName}</strong> — Sua mentora está pronta para te guiar</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #0A1E3E, #F5991F); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 700;">
                      Acessar Meu Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0; text-align: center; font-style: italic;">
                "O sucesso é a soma de pequenos esforços repetidos dia após dia." — Robert Collier
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A1E3E; padding: 24px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="100" style="display: block; margin: 0 auto 8px; opacity: 0.7;" />
              <p style="color: rgba(255,255,255,0.5); font-size: 11px; line-height: 1.5; margin: 0;">
                Este é um email automático do ECOSSISTEMA DO BEM.<br>
                © ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `🎉 Parabéns, ${data.alunoName}! Bem-vindo(a) à sua Jornada de Desenvolvimento!

Você acaba de assinar o Termo de Compromisso e se comprometeu com o seu próprio crescimento.

✅ Onboarding Concluído com Sucesso!

O que vem agora:
- 📚 Cursos e Webinars — Acesse os conteúdos disponíveis no seu portal
- 🎯 Metas e Atividades — Acompanhe suas metas de desenvolvimento
- 🤝 Mentoria com ${data.mentorName} — Sua mentora está pronta para te guiar

Acesse seu portal: ${data.loginUrl}

© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ EMAIL DE ACEITE REALIZADO - NOTIFICAÇÃO PARA MENTORA E ADMIN ============

export function buildAceiteNotificacaoEmail(data: {
  alunoName: string;
  mentorName: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `✅ ${data.alunoName} assinou o Termo de Compromisso — Onboarding Concluído!`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="140" style="display: block; margin: 0 auto 8px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 12px;">Notificação de Onboarding</p>
            </td>
          </tr>
          <tr><td style="padding: 0 40px;"><hr style="border: none; border-top: 2px solid #10b981; margin: 0;" /></td></tr>
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="color: #065f46; margin: 0 0 16px; font-size: 20px;">✅ Aceite Realizado com Sucesso!</h2>
              <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                <strong>${data.alunoName}</strong> assinou o Termo de Compromisso e concluiu todas as etapas do onboarding. O portal de desenvolvimento está agora totalmente liberado para este aluno.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
                <tr>
                  <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px 20px;">
                    <p style="color: #065f46; font-size: 14px; margin: 0;"><strong>Aluno:</strong> ${data.alunoName}</p>
                    <p style="color: #065f46; font-size: 14px; margin: 4px 0 0;"><strong>Mentora:</strong> ${data.mentorName}</p>
                    <p style="color: #065f46; font-size: 14px; margin: 4px 0 0;"><strong>Status:</strong> Onboarding 100% concluído</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Este é um email automático do ECOSSISTEMA DO BEM.<br>
                © ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `✅ ${data.alunoName} assinou o Termo de Compromisso — Onboarding Concluído!

Aluno: ${data.alunoName}
Mentora: ${data.mentorName}
Status: Onboarding 100% concluído

O portal de desenvolvimento está agora totalmente liberado.

© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ EMAIL DE SOLICITAÇÃO DE REVISÃO DO ACEITE - NOTIFICAÇÃO PARA MENTORA E ADMIN ============

export function buildRevisaoAceiteEmail(data: {
  alunoName: string;
  alunoEmail: string;
  mentorName: string;
  justificativa: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `📝 ${data.alunoName} gostaria de rever o Plano de Desenvolvimento — Solicitação de Revisão`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="140" style="display: block; margin: 0 auto 8px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 12px;">Notificação de Onboarding — Solicitação de Revisão</p>
            </td>
          </tr>
          <tr><td style="padding: 0 40px;"><hr style="border: none; border-top: 2px solid #f59e0b; margin: 0;" /></td></tr>
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="color: #92400e; margin: 0 0 16px; font-size: 20px;">📝 Solicitação de Revisão</h2>
              <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                <strong>${data.alunoName}</strong> gostaria de <strong>rever alguns pontos</strong> do seu Plano de Desenvolvimento antes de dar o aceite no Termo de Compromisso. Segue a justificativa:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
                <tr>
                  <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                    <p style="color: #92400e; font-size: 12px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase;">O que o aluno gostaria de rever:</p>
                    <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0; font-style: italic;">
                      "${data.justificativa}"
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px;">
                    <p style="color: #334155; font-size: 14px; margin: 0;"><strong>Aluno:</strong> ${data.alunoName}</p>
                    <p style="color: #334155; font-size: 14px; margin: 4px 0 0;"><strong>Email:</strong> ${data.alunoEmail}</p>
                    <p style="color: #334155; font-size: 14px; margin: 4px 0 0;"><strong>Mentora:</strong> ${data.mentorName}</p>
                  </td>
                </tr>
              </table>

              <p style="color: #4a5568; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
                <strong>Próximos passos:</strong> Entre em contato com o aluno para conversar sobre os pontos levantados e, se necessário, ajustar o plano de desenvolvimento.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" style="display: inline-block; background-color: #0A1E3E; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 700;">
                      Acessar Plataforma →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Este é um email automático do ECOSSISTEMA DO BEM.<br>
                © ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `📝 ${data.alunoName} gostaria de rever o Plano de Desenvolvimento — Solicitação de Revisão

Aluno: ${data.alunoName}
Email: ${data.alunoEmail}
Mentora: ${data.mentorName}

O que o aluno gostaria de rever:
"${data.justificativa}"

Próximos passos: Entre em contato com o aluno para conversar sobre os pontos levantados e, se necessário, ajustar o plano de desenvolvimento.

Acesse a plataforma: ${data.loginUrl}

© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}


// ============ LEMBRETE DE APLICABILIDADE PRÁTICA (48h antes da sessão) ============

export function buildLembreteAplicabilidadeEmail(data: {
  alunoName: string;
  mentorName: string;
  appointmentDate: string; // "2026-03-15"
  appointmentTime: string; // "09:00"
  tarefaTitulo: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const dateParts = data.appointmentDate.split('-');
  const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : data.appointmentDate;

  const subject = `Lembrete: registre sua aplicabilidade prática antes da mentoria de ${dateFormatted}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A1E3E 0%, #1a3a5c 100%); padding: 30px 40px; text-align: center;">
              <h1 style="color: #e8a838; font-size: 22px; margin: 0; font-weight: 700;">ECOSSISTEMA DO BEM</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0;">Programa de Mentoria</p>
            </td>
          </tr>
          <!-- Reminder Banner -->
          <tr>
            <td style="background-color: #eff6ff; padding: 20px 40px; text-align: center; border-bottom: 2px solid #bfdbfe;">
              <p style="color: #1e40af; font-size: 18px; font-weight: 700; margin: 0;">
                Lembrete: Registre sua Aplicabilidade Prática
              </p>
              <p style="color: #3b82f6; font-size: 14px; margin: 8px 0 0;">
                Sua mentoria está agendada para <strong>${dateFormatted}</strong> às <strong>${data.appointmentTime}</strong>
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 20px;">
                Olá, ${data.alunoName}!
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Sua próxima sessão de mentoria com <strong>${data.mentorName}</strong> está chegando! 
                Antes do encontro, é muito importante que você registre como aplicou na prática o conhecimento da tarefa anterior.
              </p>

              <!-- Task Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 20px;">
                    <p style="color: #92400e; font-size: 14px; font-weight: 700; margin: 0 0 8px;">Tarefa pendente:</p>
                    <p style="color: #78350f; font-size: 15px; margin: 0; font-weight: 600;">${data.tarefaTitulo}</p>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="color: #0f2b3c; font-size: 15px; font-weight: 700; margin: 0 0 12px;">O que você precisa fazer:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #0A1E3E; color: #e8a838; width: 28px; height: 28px; border-radius: 50%; text-align: center; font-size: 14px; font-weight: 700; vertical-align: middle;">1</td>
                        <td style="padding-left: 12px; color: #4a5568; font-size: 14px;">Acesse o seu portal na plataforma</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #0A1E3E; color: #e8a838; width: 28px; height: 28px; border-radius: 50%; text-align: center; font-size: 14px; font-weight: 700; vertical-align: middle;">2</td>
                        <td style="padding-left: 12px; color: #4a5568; font-size: 14px;">Vá até a tarefa pendente da última sessão</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #0A1E3E; color: #e8a838; width: 28px; height: 28px; border-radius: 50%; text-align: center; font-size: 14px; font-weight: 700; vertical-align: middle;">3</td>
                        <td style="padding-left: 12px; color: #4a5568; font-size: 14px;">Descreva como aplicou o conhecimento na prática</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #0A1E3E; color: #e8a838; width: 28px; height: 28px; border-radius: 50%; text-align: center; font-size: 14px; font-weight: 700; vertical-align: middle;">4</td>
                        <td style="padding-left: 12px; color: #4a5568; font-size: 14px;">Dê uma nota de 0 a 10 para sua aplicação</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Why Important Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px;">
                    <p style="color: #166534; font-size: 14px; font-weight: 700; margin: 0 0 8px;">Por que isso é importante?</p>
                    <p style="color: #15803d; font-size: 14px; line-height: 1.6; margin: 0;">
                      Sua autoavaliação será comparada com a avaliação da mentora e juntas formam o 
                      <strong>Indicador de Aplicabilidade Prática</strong>. Se você atingir nota entre 8 e 10, 
                      ganha um <strong>bônus de +10% no engajamento final</strong> — um passo a mais rumo à certificação!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Registrar Minha Aplicabilidade
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Nos vemos em breve! Boa preparação.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.<br>
                &copy; ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Lembrete: Registre sua Aplicabilidade Prática - ECOSSISTEMA DO BEM

Olá, ${data.alunoName}!

Sua próxima sessão de mentoria com ${data.mentorName} está agendada para ${dateFormatted} às ${data.appointmentTime}.

Antes do encontro, registre como você aplicou na prática o conhecimento da tarefa anterior:
- Tarefa: ${data.tarefaTitulo}

O que você precisa fazer:
1. Acesse o seu portal na plataforma
2. Vá até a tarefa pendente da última sessão
3. Descreva como aplicou o conhecimento na prática
4. Dê uma nota de 0 a 10 para sua aplicação

Por que isso é importante?
Sua autoavaliação será comparada com a avaliação da mentora e juntas formam o Indicador de Aplicabilidade Prática. Se você atingir nota entre 8 e 10, ganha um bônus de +10% no engajamento final!

Acesse a plataforma: ${data.loginUrl}

© ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.`;

  return { subject, html, text };
}

// ============ LEMBRETE DE ACESSO - RANKING GERAL DE ENGAJAMENTO ============
export function buildLembreteEngajamentoEmail(data: {
  nomeAluno: string;
  turma: string;
  posicao: number;
  ind1Webinars: number;
  ind2Avaliacoes: number;
  ind3Competencias: number;
  ind4Tarefas: number;
  ind5Engajamento: number;
  engajamentoFinal: number;
}): { subject: string; html: string; text: string } {
  const fmt = (v: number) => `${Math.round(v)}%`;
  const subject = "Performance de Engajamento — Ecossistema do Bem";
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; margin: 0; padding: 24px; color: #1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
    <!-- Header com logo -->
    <tr>
      <td style="padding: 28px 24px 16px; text-align: center; border-bottom: 1px solid #e5e7eb;">
        <img src="${logoUrl}" alt="Ecossistema do Bem" width="160" style="display:block;margin:0 auto 12px;" />
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #0A1E3E;">Performance de Engajamento</h1>
      </td>
    </tr>
    <!-- Corpo -->
    <tr>
      <td style="padding: 24px;">
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #374151;">
          Olá, <strong>${data.nomeAluno}</strong>! Confira abaixo o resumo da sua performance na plataforma.
        </p>
        <!-- Tabela de indicadores -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #0A1E3E; color: #ffffff;">
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a5f;">Posição</th>
              <th style="padding: 10px 8px; text-align: left; border: 1px solid #1e3a5f;">Pessoa</th>
              <th style="padding: 10px 8px; text-align: left; border: 1px solid #1e3a5f;">Turma</th>
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a5f;">Ind. 1: Webinars</th>
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a5f;">Ind. 2: Avaliações</th>
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a5f;">Ind. 3: Competências</th>
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a5f;">Ind. 4: Tarefas</th>
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a5f;">Ind. 5: Engajamento</th>
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #1e3a5f;">Ind. Média: Engajamento Final</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f0fdf4;">
              <td style="padding: 10px 8px; text-align: center; border: 1px solid #d1d5db; font-weight: 700; color: #0A1E3E;">${data.posicao}º</td>
              <td style="padding: 10px 8px; text-align: left; border: 1px solid #d1d5db; font-weight: 600;">${data.nomeAluno}</td>
              <td style="padding: 10px 8px; text-align: left; border: 1px solid #d1d5db; color: #6b7280; font-size: 12px;">${data.turma}</td>
              <td style="padding: 10px 8px; text-align: center; border: 1px solid #d1d5db;">${fmt(data.ind1Webinars)}</td>
              <td style="padding: 10px 8px; text-align: center; border: 1px solid #d1d5db;">${fmt(data.ind2Avaliacoes)}</td>
              <td style="padding: 10px 8px; text-align: center; border: 1px solid #d1d5db;">${fmt(data.ind3Competencias)}</td>
              <td style="padding: 10px 8px; text-align: center; border: 1px solid #d1d5db;">${fmt(data.ind4Tarefas)}</td>
              <td style="padding: 10px 8px; text-align: center; border: 1px solid #d1d5db;">${fmt(data.ind5Engajamento)}</td>
              <td style="padding: 10px 8px; text-align: center; border: 1px solid #d1d5db; font-weight: 700; color: #059669;">${fmt(data.engajamentoFinal)}</td>
            </tr>
          </tbody>
        </table>
        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.7; color: #374151;">
          Acesse a plataforma e continue evoluindo: <a href="http://ecolider.ecodobem.com" style="color: #1d4ed8; text-decoration: none;">ecolider.ecodobem.com</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
        Ecossistema do Bem &mdash; Este é um e-mail automático, por favor não responda.
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Performance de Engajamento\n\nOlá, ${data.nomeAluno}!\n\nPosição: ${data.posicao}º\nTurma: ${data.turma}\nInd. 1 Webinars: ${fmt(data.ind1Webinars)}\nInd. 2 Avaliações: ${fmt(data.ind2Avaliacoes)}\nInd. 3 Competências: ${fmt(data.ind3Competencias)}\nInd. 4 Tarefas: ${fmt(data.ind4Tarefas)}\nInd. 5 Engajamento: ${fmt(data.ind5Engajamento)}\nEngajamento Final: ${fmt(data.engajamentoFinal)}\n\nAcesse: http://ecolider.ecodobem.com`;

  return { subject, html, text };
}

export function buildSolicitacaoAlteracaoMentoraEmail(data: {
  alunoName: string;
  alunoEmail: string;
  mentoraAtualNome: string;
  justificativa: string;
}): { subject: string; html: string; text: string } {
  const subject = `Solicitação de alteração de mentora — ${data.alunoName}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
    <tr>
      <td style="padding: 24px;">
        <h2 style="margin: 0 0 16px; color: #0A1E3E;">Solicitação de alteração de mentora</h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">Um aluno enviou solicitação de alteração de mentora durante o onboarding.</p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Aluno:</strong> ${data.alunoName}</p>
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>E-mail:</strong> ${data.alunoEmail}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Mentora atual:</strong> ${data.mentoraAtualNome}</p>
        </div>
        <p style="margin: 0 0 6px; font-size: 14px;"><strong>Justificativa:</strong></p>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.justificativa}</div>
        <p style="margin: 18px 0 0; font-size: 13px; line-height: 1.6; color: #374151;">
          Para efetivar a alteração, acesse <strong>Cadastros &gt; Alunos</strong> e edite o campo da mentora (<strong>consultorId</strong>) no cadastro do aluno.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Solicitação de alteração de mentora

Aluno: ${data.alunoName}
E-mail: ${data.alunoEmail}
Mentora atual: ${data.mentoraAtualNome}

Justificativa:
${data.justificativa}

Para efetivar a alteração, acesse Cadastros > Alunos e edite o campo da mentora (consultorId) no cadastro do aluno.`;

  return { subject, html, text };
}

// ============ NOVO CASE EMAIL ============

export function buildNovoCaseEmail(data: {
  alunoNome: string;
  empresaNome: string;
  caseTitulo: string;
  caseResumoPublico: string;
  muralUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Novo Case de Sucesso: ${data.caseTitulo}`;

  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

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
          
          <!-- Header com Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 12px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">
                Programa de Desenvolvimento e Mentoria
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 2px solid #e8a838; margin: 0;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0f2b3c; margin: 0 0 20px; font-size: 20px;">
                Hoje temos novidades!
              </h2>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                <strong>${data.alunoNome}</strong> da Empresa <strong>${data.empresaNome}</strong> publicou um novo Case de Aplicabilidade Prática do seu aprendizado com o Título <strong>${data.caseTitulo}</strong>.
              </p>

              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px;">
                <tr>
                  <td style="background-color: #f0f7fa; border: 1px solid #d1e5ed; border-radius: 8px; padding: 20px;">
                    <p style="color: #0f2b3c; font-size: 14px; font-style: italic; margin: 0; line-height: 1.6;">
                      "${data.caseResumoPublico}"
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 25px;">
                Não deixe de interagir com ele(a) para saber como foi esta conquista. Sempre temos muito pra aprender com os nossos colegas de formação!!!
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.muralUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Ver no Mural de Cases
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.<br>
                      &copy; ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hoje temos novidades!

${data.alunoNome} da Empresa ${data.empresaNome} publicou um novo Case de Aplicabilidade Prática do seu aprendizado com o Título "${data.caseTitulo}".

Resumo:
"${data.caseResumoPublico}"

Não deixe de interagir com ele(a) para saber como foi esta conquista. Sempre temos muito pra aprender com os nossos colegas de formação!!!

Acesse o Mural de Cases: ${data.muralUrl}

Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.
&copy; ${new Date().getFullYear()} CKM Talents`;

  return { subject, html, text };
}

export function buildTarefaEmAbertoEmail(data: {
  mentorName: string;
  alunoName: string;
  taskTitle: string;
  dataSolicitacao: string;
  taskDeadline: string | null;
  diasEmAberto: number;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Atenção: Tarefa de ${data.alunoName} está em aberto há ${data.diasEmAberto} dias`;
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

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
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; text-align: center;">
              <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display: block; margin: 0 auto 12px;" />
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">Programa de Desenvolvimento e Mentoria</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fef3c7; padding: 20px 40px; border-top: 3px solid #d97706;">
              <p style="color: #92400e; font-size: 13px; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Tarefa em Aberto</p>
              <p style="color: #78350f; font-size: 22px; font-weight: 800; margin: 0;">${data.diasEmAberto} dias sem atualização</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá, <strong>${data.mentorName}</strong>!
              </p>
              <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                Identificamos que há uma tarefa do(a) aluno(a) <strong>${data.alunoName}</strong> que foi demandada em <strong>${data.dataSolicitacao}</strong> e que, até o momento, consta como <strong style="color: #d97706;">não entregue</strong> no sistema.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 6px 0;">
                          <p style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 3px;">Aluno(a)</p>
                          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">${data.alunoName}</p>
                        </td>
                        <td width="50%" style="padding: 6px 0;">
                          <p style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 3px;">Tarefa</p>
                          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">${data.taskTitle}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 6px 0;">
                          <p style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 3px;">Data da Solicitação</p>
                          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">${data.dataSolicitacao}</p>
                        </td>
                        <td width="50%" style="padding: 6px 0;">
                          <p style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 3px;">Prazo de Entrega</p>
                          <p style="color: ${data.taskDeadline ? '#dc2626' : '#6b7280'}; font-size: 14px; font-weight: 600; margin: 0;">${data.taskDeadline || 'Não definido'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 28px;">
                <p style="color: #7c2d12; font-size: 14px; font-weight: 700; margin: 0 0 8px;">O que fazer:</p>
                <ul style="color: #9a3412; font-size: 13px; line-height: 1.9; margin: 0; padding-left: 18px;">
                  <li>Verifique com o(a) aluno(a) se a tarefa foi realizada fora da plataforma</li>
                  <li>Caso o(a) aluno(a) tenha entregado, solicite que registre a entrega na plataforma</li>
                  <li>Caso o prazo já tenha se encerrado e a tarefa <strong>não foi entregue</strong>, atualize o status no sistema como "Não Entregue"</li>
                </ul>
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 10px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #e8a838 0%, #d4922e 100%); color: #0f2b3c; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      Acessar Plataforma
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Este e-mail foi enviado automaticamente pelo ECOSSISTEMA DO BEM.<br>
                Administração e coordenação estão em cópia neste e-mail.<br>
                &copy; ${new Date().getFullYear()} CKM Talents — Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Atenção: Tarefa em Aberto — ECOSSISTEMA DO BEM

Olá, ${data.mentorName}!

Identificamos que há uma tarefa do(a) aluno(a) ${data.alunoName} que foi demandada em ${data.dataSolicitacao} e que, até o momento, consta como não entregue no sistema.

Detalhes da Tarefa:
- Aluno(a): ${data.alunoName}
- Tarefa: ${data.taskTitle}
- Data da Solicitação: ${data.dataSolicitacao}
- Prazo de Entrega: ${data.taskDeadline || 'Não definido'}
- Dias em aberto: ${data.diasEmAberto} dias

O que fazer:
- Verifique com o(a) aluno(a) se a tarefa foi realizada fora da plataforma
- Caso o(a) aluno(a) tenha entregado, solicite que registre a entrega na plataforma
- Caso o prazo já tenha se encerrado e a tarefa não foi entregue, atualize o status no sistema como "Não Entregue"

Acesse a plataforma: ${data.loginUrl}

Este e-mail foi enviado automaticamente. Administração e coordenação estão em cópia.
© ${new Date().getFullYear()} CKM Talents`;

  return { subject, html, text };
}


// ============ TROCA DE MENTORA PELO ADMIN ============
export function buildNovaAlunaEmail(data: {
  mentoraNovaName: string;
  alunoName: string;
  alunoEmail?: string;
  mentoraAntigaName: string;
  adminName: string;
}): { subject: string; html: string; text: string } {
  const subject = `Você tem uma nova aluna — ${data.alunoName}`;
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#111827;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;"><tr><td style="background:linear-gradient(135deg,#0A1E3E,#2D5A87);padding:24px;border-radius:12px 12px 0 0;text-align:center;"><h2 style="margin:0;color:#ffffff;font-size:22px;">Você tem uma nova aluna!</h2></td></tr><tr><td style="padding:24px;"><p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Olá, <strong>${data.mentoraNovaName}</strong>!</p><p style="font-size:15px;line-height:1.6;margin:0 0 16px;">A administração transferiu o(a) aluno(a) <strong>${data.alunoName}</strong> para a sua carteira.</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-bottom:16px;"><p style="margin:0 0 6px;font-size:14px;"><strong>Aluno(a):</strong> ${data.alunoName}</p>${data.alunoEmail ? `<p style="margin:0 0 6px;font-size:14px;"><strong>E-mail:</strong> ${data.alunoEmail}</p>` : ''}<p style="margin:0;font-size:14px;"><strong>Mentora anterior:</strong> ${data.mentoraAntigaName}</p></div><div style="text-align:center;margin:24px 0;"><a href="https://ecolider.ecodobem.com/" style="display:inline-block;background:#0A1E3E;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Acessar a Plataforma</a></div><p style="margin-top:20px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">Ação realizada por: ${data.adminName}.</p></td></tr></table></body></html>`;
  const text = `Você tem uma nova aluna — ${data.alunoName}\n\nOlá, ${data.mentoraNovaName}!\n\nA administração transferiu o(a) aluno(a) ${data.alunoName} para a sua carteira.\nMentora anterior: ${data.mentoraAntigaName}\nAção realizada por: ${data.adminName}.`;
  return { subject, html, text };
}

export function buildAlunoRemovidoEmail(data: {
  mentoraAntigaName: string;
  alunoName: string;
  mentoraNovaName: string;
  adminName: string;
}): { subject: string; html: string; text: string } {
  const subject = `Aluno(a) ${data.alunoName} foi transferido(a) para outra mentora`;
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#111827;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;"><tr><td style="background:#f9fafb;padding:24px;border-radius:12px 12px 0 0;border-bottom:1px solid #e5e7eb;"><h2 style="margin:0;color:#0A1E3E;font-size:20px;">Atualização na sua carteira de mentorados</h2></td></tr><tr><td style="padding:24px;"><p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Olá, <strong>${data.mentoraAntigaName}</strong>!</p><p style="font-size:15px;line-height:1.6;margin:0 0 16px;">O(a) aluno(a) <strong>${data.alunoName}</strong> foi transferido(a) da sua carteira para outra mentora.</p><div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-bottom:16px;"><p style="margin:0 0 6px;font-size:14px;"><strong>Aluno(a):</strong> ${data.alunoName}</p><p style="margin:0;font-size:14px;"><strong>Nova mentora:</strong> ${data.mentoraNovaName}</p></div><p style="margin-top:20px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">Ação realizada por: ${data.adminName}.</p></td></tr></table></body></html>`;
  const text = `Aluno(a) ${data.alunoName} foi transferido(a) para outra mentora\n\nOlá, ${data.mentoraAntigaName}!\n\nO(a) aluno(a) ${data.alunoName} foi transferido(a) da sua carteira para a mentora ${data.mentoraNovaName}.\nAção realizada por: ${data.adminName}.`;
  return { subject, html, text };
}


// ============================================================
// Template: Confirmação de Agendamento de Sessão (para o aluno)
// ============================================================
export function buildConfirmacaoAgendamentoEmail(data: {
  alunoName: string;
  mentorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Sessão de mentoria confirmada — ${data.scheduledDate} às ${data.startTime}`;
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const meetSection = data.meetLink
    ? `<tr><td style="padding:0 40px 20px;"><div style="text-align:center;"><a href="${data.meetLink}" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:700;">Acessar Reunião Google Meet</a><p style="margin:8px 0 0;font-size:11px;color:#6b7280;word-break:break-all;">${data.meetLink}</p></div></td></tr>`
    : '';
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td style="background:#fff;padding:30px 40px;text-align:center;"><img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display:block;margin:0 auto 12px;"/><p style="color:#6b7280;margin:4px 0 0;font-size:13px;">Programa de Desenvolvimento e Mentoria</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #e8a838;margin:0;"/></td></tr><tr><td style="padding:30px 40px 20px;"><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;"><p style="margin:0;font-size:18px;font-weight:700;color:#15803d;">Sessao Confirmada!</p></div><p style="font-size:15px;color:#374151;margin:0 0 16px;">Ola, <strong>${data.alunoName}</strong>!</p><p style="font-size:15px;color:#374151;margin:0 0 20px;">Sua sessao de mentoria foi agendada com sucesso. Confira os detalhes abaixo:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;"><tr><td style="padding:6px 12px;font-size:14px;color:#6b7280;width:140px;">Mentora:</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#0A1E3E;">${data.mentorName}</td></tr><tr><td style="padding:6px 12px;font-size:14px;color:#6b7280;">Data:</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#0A1E3E;">${data.scheduledDate}</td></tr><tr><td style="padding:6px 12px;font-size:14px;color:#6b7280;">Horario:</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#0A1E3E;">${data.startTime} - ${data.endTime}</td></tr></table></td></tr>${meetSection}<tr><td style="padding:0 40px 20px;"><p style="font-size:13px;color:#6b7280;margin:0;">Caso precise cancelar ou reagendar, acesse a plataforma com antecedencia.</p><div style="text-align:center;margin-top:16px;"><a href="${data.loginUrl}" style="display:inline-block;background:#0A1E3E;color:#fff;text-decoration:none;padding:10px 28px;border-radius:8px;font-size:13px;font-weight:600;">Acessar a Plataforma</a></div></td></tr><tr><td style="padding:16px 40px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">ECOSSISTEMA DO BEM - Programa de Desenvolvimento e Mentoria</p></td></tr></table></td></tr></table></body></html>`;
  const text = `Sessao de mentoria confirmada!\n\nOla, ${data.alunoName}!\nSua sessao foi agendada com sucesso.\n\nMentora: ${data.mentorName}\nData: ${data.scheduledDate}\nHorario: ${data.startTime} - ${data.endTime}${data.meetLink ? `\nLink: ${data.meetLink}` : ''}\n\nAcesse a plataforma: ${data.loginUrl}`;
  return { subject, html, text };
}

// ============================================================
// Template: Lembrete de Ausencia em Webinar (para o aluno)
// ============================================================
export function buildAusenciaWebinarEmail(data: {
  alunoName: string;
  webinarTitle: string;
  eventDate: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Voce perdeu o webinar "${data.webinarTitle}" - fique de olho nos proximos`;
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td style="background:#fff;padding:30px 40px;text-align:center;"><img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display:block;margin:0 auto 12px;"/><p style="color:#6b7280;margin:4px 0 0;font-size:13px;">Programa de Desenvolvimento e Mentoria</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #e8a838;margin:0;"/></td></tr><tr><td style="padding:30px 40px 24px;"><div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;"><p style="margin:0;font-size:16px;font-weight:700;color:#c2410c;">Voce perdeu um webinar</p></div><p style="font-size:15px;color:#374151;margin:0 0 16px;">Ola, <strong>${data.alunoName}</strong>!</p><p style="font-size:15px;color:#374151;margin:0 0 16px;">Notamos que voce nao participou do webinar <strong>"${data.webinarTitle}"</strong> realizado em <strong>${data.eventDate}</strong>.</p><p style="font-size:15px;color:#374151;margin:0 0 20px;">A participacao nos webinares e parte importante da sua jornada de desenvolvimento. Fique de olho na agenda para nao perder os proximos!</p><div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:20px;"><p style="margin:0;font-size:14px;color:#374151;"><strong>Dica:</strong> Acesse a plataforma para ver os proximos webinares agendados e garantir sua participacao.</p></div><div style="text-align:center;margin-top:16px;"><a href="${data.loginUrl}" style="display:inline-block;background:#0A1E3E;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Ver Proximos Webinares</a></div></td></tr><tr><td style="padding:16px 40px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">ECOSSISTEMA DO BEM - Programa de Desenvolvimento e Mentoria</p></td></tr></table></td></tr></table></body></html>`;
  const text = `Voce perdeu o webinar "${data.webinarTitle}"\n\nOla, ${data.alunoName}!\n\nNotamos que voce nao participou do webinar "${data.webinarTitle}" realizado em ${data.eventDate}.\n\nFique de olho na agenda para nao perder os proximos!\n\nAcesse a plataforma: ${data.loginUrl}`;
  return { subject, html, text };
}

// ============================================================
// Template: Lembrete de Tarefa Pendente + Proxima Mentoria (para o aluno)
// ============================================================
export function buildLembreteTarefaMentoriaEmail(data: {
  alunoName: string;
  mentorName: string;
  taskTitle: string;
  taskDeadline?: string | null;
  proximaSessaoDate?: string | null;
  proximaSessaoTime?: string | null;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Lembrete: tarefa pendente e proxima sessao de mentoria`;
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const proximaSessaoSection = data.proximaSessaoDate
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:16px;"><p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1d4ed8;">Proxima Sessao de Mentoria</p><p style="margin:0;font-size:14px;color:#374151;">Data: <strong>${data.proximaSessaoDate}</strong>${data.proximaSessaoTime ? ` as <strong>${data.proximaSessaoTime}</strong>` : ''}</p><p style="margin:4px 0 0;font-size:14px;color:#374151;">Mentora: <strong>${data.mentorName}</strong></p></div>`
    : '';
  const deadlineStr = data.taskDeadline ? ` (prazo: ${data.taskDeadline})` : '';
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td style="background:#fff;padding:30px 40px;text-align:center;"><img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display:block;margin:0 auto 12px;"/><p style="color:#6b7280;margin:4px 0 0;font-size:13px;">Programa de Desenvolvimento e Mentoria</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #e8a838;margin:0;"/></td></tr><tr><td style="padding:30px 40px 24px;"><p style="font-size:15px;color:#374151;margin:0 0 20px;">Ola, <strong>${data.alunoName}</strong>! Aqui esta um lembrete importante sobre sua jornada de desenvolvimento:</p><div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:16px;"><p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e;">Tarefa Pendente</p><p style="margin:0;font-size:14px;color:#374151;"><strong>${data.taskTitle}</strong>${deadlineStr}</p><p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Entregue sua tarefa antes da proxima sessao para aproveitar melhor o encontro com sua mentora.</p></div>${proximaSessaoSection}<div style="text-align:center;margin-top:20px;"><a href="${data.loginUrl}" style="display:inline-block;background:#0A1E3E;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Acessar a Plataforma</a></div></td></tr><tr><td style="padding:16px 40px;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">ECOSSISTEMA DO BEM - Programa de Desenvolvimento e Mentoria</p></td></tr></table></td></tr></table></body></html>`;
  const text = `Lembrete: tarefa pendente e proxima sessao de mentoria\n\nOla, ${data.alunoName}!\n\nTarefa pendente: ${data.taskTitle}${deadlineStr}\n${data.proximaSessaoDate ? `\nProxima sessao: ${data.proximaSessaoDate}${data.proximaSessaoTime ? ` as ${data.proximaSessaoTime}` : ''} com ${data.mentorName}` : ''}\n\nAcesse a plataforma: ${data.loginUrl}`;
  return { subject, html, text };
}

// ============================================================
// RELATÓRIO DE MENTORIAS POR MENTORA
// ============================================================

export function buildRelatorioMentoriasEmail(data: {
  mentoraNome: string;
  periodoInicio: string;
  periodoFim: string;
  isFinal: boolean;
  sessoes: Array<{
    data: string | null;
    aluno: string;
    empresa: string;
    tipo: string;
    registroFeito: boolean;
    valor: number;
  }>;
  agendadosSemRegistro: Array<{
    data: string;
    aluno: string;
    empresa: string;
    tipo: string;
  }>;
  totalRealizado: number;
  totalAgendado: number;
  totalValor: number;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const tipoRelatorio = data.isFinal ? 'Definitivo' : 'Previa';
  const corBanner = data.isFinal ? '#065f46' : '#92400e';
  const bgBanner = data.isFinal ? '#d1fae5' : '#fef3c7';
  const subject = `${data.isFinal ? 'Relatorio Definitivo' : 'Previa do Relatorio'} de Mentorias - ${data.mentoraNome} - ${data.periodoInicio} a ${data.periodoFim}`;

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    const parts = d.slice(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatTipo = (t: string) => {
    const map: Record<string, string> = {
      individual_normal: 'Individual',
      individual_assessment: 'Assessment',
      grupo_normal: 'Grupo',
      grupo_assessment: 'Grupo Assessment',
    };
    return map[t] || t;
  };

  const sessoesRows = data.sessoes.map(s =>
    `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px 8px;font-size:13px;color:#374151;">${formatDate(s.data)}</td><td style="padding:10px 8px;font-size:13px;color:#374151;">${s.aluno}</td><td style="padding:10px 8px;font-size:13px;color:#374151;">${s.empresa}</td><td style="padding:10px 8px;font-size:13px;color:#374151;">${formatTipo(s.tipo)}</td><td style="padding:10px 8px;font-size:13px;text-align:center;">${s.registroFeito ? '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">Registrada</span>' : '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">Sem registro</span>'}</td><td style="padding:10px 8px;font-size:13px;color:#374151;text-align:right;font-weight:600;">R$ ${s.valor.toFixed(2).replace('.', ',')}</td></tr>`
  ).join('');

  const agendadosSection = data.agendadosSemRegistro.length > 0
    ? `<tr><td colspan="6" style="padding:20px 0 8px;"><p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 6px;">Agendamentos sem registro de sessao (${data.agendadosSemRegistro.length})</p><p style="color:#b45309;font-size:13px;margin:0 0 8px;">Os agendamentos abaixo constam na agenda mas nao tem ficha de sessao preenchida. Verifique e registre se a sessao foi realizada.</p></td></tr>${data.agendadosSemRegistro.map(a => `<tr style="border-bottom:1px solid #fde68a;background-color:#fffbeb;"><td style="padding:10px 8px;font-size:13px;color:#92400e;">${formatDate(a.data)}</td><td style="padding:10px 8px;font-size:13px;color:#92400e;">${a.aluno}</td><td style="padding:10px 8px;font-size:13px;color:#92400e;">${a.empresa}</td><td style="padding:10px 8px;font-size:13px;color:#92400e;">${formatTipo(a.tipo)}</td><td style="padding:10px 8px;font-size:13px;text-align:center;"><span style="background:#fde68a;color:#92400e;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;">Pendente</span></td><td style="padding:10px 8px;font-size:13px;color:#92400e;text-align:right;">-</td></tr>`).join('')}`
    : '';

  const avisoBox = !data.isFinal
    ? `<tr><td style="padding:20px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px 20px;"><p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 6px;">Esta e uma PREVIA - nao e o relatorio definitivo</p><p style="color:#b45309;font-size:13px;margin:0;line-height:1.6;">Este relatorio e uma previa do periodo <strong>${data.periodoInicio} a ${data.periodoFim}</strong>. Verifique as informacoes e nos informe qualquer ajuste necessario. No dia <strong>30</strong>, sera enviado o <strong>relatorio definitivo</strong> seguindo o mesmo processo.</p></td></tr></table></td></tr>`
    : `<tr><td style="padding:20px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:16px 20px;"><p style="color:#065f46;font-size:14px;font-weight:700;margin:0 0 6px;">Este e o RELATORIO DEFINITIVO</p><p style="color:#047857;font-size:13px;margin:0;line-height:1.6;">Este e o relatorio definitivo do periodo <strong>${data.periodoInicio} a ${data.periodoFim}</strong>. Confirme as informacoes e nos informe qualquer divergencia em ate 3 dias uteis.</p></td></tr></table></td></tr>`;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;"><tr><td align="center"><table role="presentation" width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td style="padding:30px 40px;text-align:center;"><img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display:block;margin:0 auto 12px;"/><p style="color:#6b7280;margin:4px 0 0;font-size:13px;">Programa de Desenvolvimento e Mentoria</p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #e8a838;margin:0;"/></td></tr><tr><td style="background:${bgBanner};padding:20px 40px;text-align:center;"><p style="color:${corBanner};font-size:18px;font-weight:700;margin:0;">Relatorio ${tipoRelatorio} de Mentorias</p><p style="color:${corBanner};font-size:14px;margin:8px 0 0;">Periodo: ${data.periodoInicio} a ${data.periodoFim}</p></td></tr>${avisoBox}<tr><td style="padding:30px 40px 10px;"><h2 style="color:#0f2b3c;margin:0 0 12px;font-size:20px;">Ola, ${data.mentoraNome}!</h2><p style="color:#4a5568;font-size:15px;line-height:1.8;margin:0;">Segue abaixo o relatorio das suas sessoes de mentoria no periodo indicado. Por favor, <strong>confira todas as informacoes</strong> e nos informe caso haja qualquer divergencia ou ajuste necessario.</p></td></tr><tr><td style="padding:20px 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="width:32%;text-align:center;background:#f0f7fa;border-radius:8px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Sessoes Realizadas</p><p style="color:#0f2b3c;font-size:28px;font-weight:700;margin:0;">${data.totalRealizado}</p></td><td style="width:4%;"></td><td style="width:32%;text-align:center;background:#fef3c7;border-radius:8px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Agendadas s/ Registro</p><p style="color:#92400e;font-size:28px;font-weight:700;margin:0;">${data.totalAgendado}</p></td><td style="width:4%;"></td><td style="width:32%;text-align:center;background:#d1fae5;border-radius:8px;padding:16px;"><p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Valor Total</p><p style="color:#065f46;font-size:28px;font-weight:700;margin:0;">R$ ${data.totalValor.toFixed(2).replace('.', ',')}</p></td></tr></table></td></tr><tr><td style="padding:0 40px 30px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;"><thead><tr style="background:#f9fafb;"><th style="padding:12px 8px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Data</th><th style="padding:12px 8px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Aluno</th><th style="padding:12px 8px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Empresa</th><th style="padding:12px 8px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Tipo</th><th style="padding:12px 8px;font-size:12px;color:#6b7280;text-align:center;font-weight:600;text-transform:uppercase;">Registro</th><th style="padding:12px 8px;font-size:12px;color:#6b7280;text-align:right;font-weight:600;text-transform:uppercase;">Valor</th></tr></thead><tbody>${sessoesRows}${agendadosSection}</tbody></table></td></tr><tr><td style="padding:0 40px 30px;text-align:center;"><a href="${data.loginUrl}" style="display:inline-block;background-color:#e8a838;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Acessar o Sistema</a><p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">Em caso de duvidas ou divergencias, responda este e-mail ou acesse o sistema.</p></td></tr><tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;">Ecossistema do Bem - Programa de Desenvolvimento e Mentoria</p></td></tr></table></td></tr></table></body></html>`;

  const text = `Relatorio ${tipoRelatorio} de Mentorias - ${data.mentoraNome}\nPeriodo: ${data.periodoInicio} a ${data.periodoFim}\n\nSessoes Realizadas: ${data.totalRealizado}\nAgendadas sem Registro: ${data.totalAgendado}\nValor Total: R$ ${data.totalValor.toFixed(2).replace('.', ',')}\n\n${!data.isFinal ? 'ATENCAO: Esta e uma PREVIA. No dia 30 sera enviado o relatorio definitivo.' : 'Este e o RELATORIO DEFINITIVO. Confirme as informacoes em ate 3 dias uteis.'}\n\nAcesse o sistema em: ${data.loginUrl}`;

  return { subject, html, text };
}

export function buildRelatorioMentoriasFinanceiroEmail(data: {
  periodoInicio: string;
  periodoFim: string;
  isFinal: boolean;
  mentoras: Array<{
    nome: string;
    totalRealizado: number;
    totalAgendadoSemRegistro: number;
    totalValor: number;
    sessoes: Array<{
      data: string | null;
      aluno: string;
      empresa: string;
      tipo: string;
      valor: number;
    }>;
    agendadosSemRegistro: Array<{
      data: string;
      aluno: string;
      empresa: string;
      tipo: string;
    }>;
  }>;
  totalGeralValor: number;
  totalGeralSessoes: number;
}): { subject: string; html: string; text: string } {
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const tipoRelatorio = data.isFinal ? 'Definitivo' : 'Previa';
  const subject = `[COPIA FINANCEIRO] Relatorio ${tipoRelatorio} de Mentorias - ${data.periodoInicio} a ${data.periodoFim}`;

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    const parts = d.slice(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatTipo = (t: string) => {
    const map: Record<string, string> = {
      individual_normal: 'Individual',
      individual_assessment: 'Assessment',
      grupo_normal: 'Grupo',
      grupo_assessment: 'Grupo Assessment',
    };
    return map[t] || t;
  };

  const avisoPrevia = !data.isFinal
    ? `<tr><td style="padding:20px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;"><p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 4px;">Esta e uma PREVIA - nao e o relatorio definitivo</p><p style="color:#b45309;font-size:13px;margin:0;">No dia 30 sera enviado o relatorio definitivo seguindo o mesmo processo.</p></td></tr></table></td></tr>`
    : '';

  // Resumo geral (tabela de mentoras)
  const linhasMentorasResumo = data.mentoras.map(m =>
    `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:10px 12px;font-size:13px;color:#374151;font-weight:600;">${m.nome}</td><td style="padding:10px 12px;font-size:13px;color:#374151;text-align:center;">${m.totalRealizado}</td><td style="padding:10px 12px;font-size:13px;color:${m.totalAgendadoSemRegistro > 0 ? '#92400e' : '#374151'};text-align:center;font-weight:${m.totalAgendadoSemRegistro > 0 ? '700' : '400'};">${m.totalAgendadoSemRegistro > 0 ? m.totalAgendadoSemRegistro : '-'}</td><td style="padding:10px 12px;font-size:13px;color:#065f46;text-align:right;font-weight:600;">R$ ${m.totalValor.toFixed(2).replace('.', ',')}</td></tr>`
  ).join('');

  // Detalhe por mentora: sessoes agrupadas por empresa
  const detalhesMentoras = data.mentoras.map(m => {
    // Agrupar sessoes por empresa
    const empresaMap = new Map<string, { sessoes: typeof m.sessoes; subtotal: number }>();
    for (const s of m.sessoes) {
      const emp = s.empresa || 'N/A';
      if (!empresaMap.has(emp)) empresaMap.set(emp, { sessoes: [], subtotal: 0 });
      const entry = empresaMap.get(emp)!;
      entry.sessoes.push(s);
      entry.subtotal += s.valor;
    }

    const empresaBlocks = Array.from(empresaMap.entries()).map(([empresa, { sessoes: eSessoes, subtotal }]) => {
      const rows = eSessoes.map(s =>
        `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 10px;font-size:12px;color:#374151;">${formatDate(s.data)}</td><td style="padding:8px 10px;font-size:12px;color:#374151;">${s.aluno}</td><td style="padding:8px 10px;font-size:12px;color:#374151;">${formatTipo(s.tipo)}</td><td style="padding:8px 10px;font-size:12px;color:#374151;text-align:right;">R$ ${s.valor.toFixed(2).replace('.', ',')}</td></tr>`
      ).join('');
      return `<tr><td colspan="4" style="padding:10px 10px 4px;background:#f0f7fa;"><span style="font-size:12px;font-weight:700;color:#0f2b3c;text-transform:uppercase;letter-spacing:0.5px;">${empresa}</span></td></tr>${rows}<tr style="background:#e8f4f0;"><td colspan="3" style="padding:8px 10px;font-size:12px;font-weight:700;color:#065f46;">Subtotal ${empresa}</td><td style="padding:8px 10px;font-size:12px;font-weight:700;color:#065f46;text-align:right;">R$ ${subtotal.toFixed(2).replace('.', ',')}</td></tr>`;
    }).join('');

    const agendadosRows = m.agendadosSemRegistro.length > 0
      ? `<tr><td colspan="4" style="padding:10px 10px 4px;background:#fef3c7;"><span style="font-size:12px;font-weight:700;color:#92400e;">Agendamentos SEM REGISTRO (${m.agendadosSemRegistro.length})</span></td></tr>${m.agendadosSemRegistro.map(a => `<tr style="background:#fffbeb;border-bottom:1px solid #fde68a;"><td style="padding:8px 10px;font-size:12px;color:#92400e;">${formatDate(a.data)}</td><td style="padding:8px 10px;font-size:12px;color:#92400e;">${a.aluno}</td><td style="padding:8px 10px;font-size:12px;color:#92400e;">${a.empresa} — ${formatTipo(a.tipo)}</td><td style="padding:8px 10px;font-size:12px;color:#92400e;text-align:right;">-</td></tr>`).join('')}`
      : '';

    return `<tr><td style="padding:24px 40px 8px;"><p style="color:#0f2b3c;font-size:15px;font-weight:700;margin:0 0 2px;">${m.nome}</p><p style="color:#6b7280;font-size:12px;margin:0;">${m.totalRealizado} sessao(s) realizadas — R$ ${m.totalValor.toFixed(2).replace('.', ',')}</p></td></tr><tr><td style="padding:0 40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;"><thead><tr style="background:#f9fafb;"><th style="padding:10px;font-size:11px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Data</th><th style="padding:10px;font-size:11px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Aluno</th><th style="padding:10px;font-size:11px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Tipo</th><th style="padding:10px;font-size:11px;color:#6b7280;text-align:right;font-weight:600;text-transform:uppercase;">Valor</th></tr></thead><tbody>${empresaBlocks}${agendadosRows}<tr style="background:#f9fafb;"><td colspan="3" style="padding:10px;font-size:13px;font-weight:700;color:#0f2b3c;">TOTAL ${m.nome}</td><td style="padding:10px;font-size:13px;font-weight:700;color:#065f46;text-align:right;">R$ ${m.totalValor.toFixed(2).replace('.', ',')}</td></tr></tbody></table></td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;"><tr><td align="center"><table role="presentation" width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td style="padding:30px 40px;text-align:center;"><img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display:block;margin:0 auto 12px;"/></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #e8a838;margin:0;"/></td></tr><tr><td style="background:#f0f7fa;padding:20px 40px;text-align:center;"><p style="color:#0f2b3c;font-size:18px;font-weight:700;margin:0;">[COPIA FINANCEIRO] Relatorio ${tipoRelatorio} de Mentorias</p><p style="color:#4a5568;font-size:14px;margin:8px 0 0;">Periodo: ${data.periodoInicio} a ${data.periodoFim}</p></td></tr>${avisoPrevia}<tr><td style="padding:30px 40px 16px;"><p style="color:#0f2b3c;font-size:15px;font-weight:700;margin:0 0 12px;">Resumo Geral</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:8px;"><thead><tr style="background:#f9fafb;"><th style="padding:12px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Mentora</th><th style="padding:12px;font-size:12px;color:#6b7280;text-align:center;font-weight:600;text-transform:uppercase;">Realizadas</th><th style="padding:12px;font-size:12px;color:#6b7280;text-align:center;font-weight:600;text-transform:uppercase;">Sem Registro</th><th style="padding:12px;font-size:12px;color:#6b7280;text-align:right;font-weight:600;text-transform:uppercase;">Valor</th></tr></thead><tbody>${linhasMentorasResumo}<tr style="background:#f9fafb;font-weight:700;"><td style="padding:12px;font-size:14px;color:#0f2b3c;">TOTAL GERAL</td><td style="padding:12px;font-size:14px;color:#0f2b3c;text-align:center;">${data.totalGeralSessoes}</td><td style="padding:12px;font-size:14px;color:#0f2b3c;text-align:center;">-</td><td style="padding:12px;font-size:14px;color:#065f46;text-align:right;">R$ ${data.totalGeralValor.toFixed(2).replace('.', ',')}</td></tr></tbody></table></td></tr><tr><td style="padding:0 40px 8px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 8px;"/><p style="color:#0f2b3c;font-size:15px;font-weight:700;margin:0;">Detalhamento por Mentora</p></td></tr>${detalhesMentoras}<tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;">Ecossistema do Bem - Programa de Desenvolvimento e Mentoria</p></td></tr></table></td></tr></table></body></html>`;

  const textLines: string[] = [
    `[COPIA FINANCEIRO] Relatorio ${tipoRelatorio} de Mentorias - ${data.periodoInicio} a ${data.periodoFim}`,
    '',
    'RESUMO GERAL',
    ...data.mentoras.map(m => `  ${m.nome}: ${m.totalRealizado} sessoes - R$ ${m.totalValor.toFixed(2).replace('.', ',')}`),
    `  TOTAL: ${data.totalGeralSessoes} sessoes - R$ ${data.totalGeralValor.toFixed(2).replace('.', ',')}`,
    '',
    'DETALHAMENTO',
    ...data.mentoras.flatMap(m => {
      const empresaMap2 = new Map<string, { sessoes: typeof m.sessoes; subtotal: number }>();
      for (const s of m.sessoes) {
        const emp = s.empresa || 'N/A';
        if (!empresaMap2.has(emp)) empresaMap2.set(emp, { sessoes: [], subtotal: 0 });
        const entry = empresaMap2.get(emp)!;
        entry.sessoes.push(s);
        entry.subtotal += s.valor;
      }
      const lines: string[] = [`\n${m.nome} (${m.totalRealizado} sessoes - R$ ${m.totalValor.toFixed(2).replace('.', ',')}):`];
      for (const [empresa, { sessoes: eSessoes, subtotal }] of Array.from(empresaMap2.entries())) {
        lines.push(`  [${empresa}]`);
        for (const s of eSessoes) {
          lines.push(`    ${formatDate(s.data)} - ${s.aluno} - ${formatTipo(s.tipo)} - R$ ${s.valor.toFixed(2).replace('.', ',')}`);
        }
        lines.push(`    Subtotal ${empresa}: R$ ${subtotal.toFixed(2).replace('.', ',')}`);
      }
      if (m.agendadosSemRegistro.length > 0) {
        lines.push(`  [SEM REGISTRO: ${m.agendadosSemRegistro.length}]`);
        for (const a of m.agendadosSemRegistro) {
          lines.push(`    ${formatDate(a.data)} - ${a.aluno} - ${a.empresa}`);
        }
      }
      return lines;
    }),
  ];
  const text = textLines.join('\n');

  return { subject, html, text };
}

// ============================================================
// E-mail de convite cancelado (5º envio — aluno não acessou)
// ============================================================
export function buildConviteCanceladoEmail(data: {
  alunoName: string;
  alunoEmail: string;
}): { subject: string; html: string; text: string } {
  const subject = `Que pena! Seu convite para o ECOSSISTEMA DO BEM sera cancelado`;
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';
  const contatoEmail = 'relacionamento@ckmtalents.net';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#ffffff;padding:30px 40px;text-align:center;">
          <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display:block;margin:0 auto 12px;" />
          <p style="color:#6b7280;margin:4px 0 0;font-size:13px;">Programa de Desenvolvimento e Mentoria</p>
        </td></tr>
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #e8a838;margin:0;" /></td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">Que pena, ${data.alunoName}!</h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Enviamos varios convites para voce acessar o <strong>ECOSSISTEMA DO BEM</strong>, mas infelizmente nao identificamos nenhum acesso a plataforma ate o momento.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Por esse motivo, <strong>seu convite sera cancelado</strong>. Sabemos que imprevistos acontecem, e lamentamos muito nao ter podido acompanhar sua jornada de desenvolvimento.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Caso queira reverter essa situacao ou tenha alguma duvida, entre em contato conosco pelo e-mail:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0;font-size:14px;color:#6b7280;">E-mail de contato:</p>
              <p style="margin:6px 0 0;font-size:16px;font-weight:600;color:#1a1a2e;">
                <a href="mailto:${contatoEmail}" style="color:#e8a838;text-decoration:none;">${contatoEmail}</a>
              </p>
            </td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Esperamos poder contar com voce em uma proxima oportunidade. Cuide-se!</p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© ECOSSISTEMA DO BEM — Todos os direitos reservados</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Que pena, ${data.alunoName}!\n\nEnviamos varios convites mas nao identificamos acesso a plataforma. Seu convite sera cancelado.\n\nCaso queira reverter, entre em contato: ${contatoEmail}`;

  return { subject, html, text };
}

// ============================================================
// E-mail de alerta ao admin — aluno sem acesso apos 15 dias
// ============================================================
export function buildAdminAlunoSemAcessoEmail(data: {
  alunoName: string;
  alunoEmail: string;
  diasSemAcesso: number;
  programaNome?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Aluno sem acesso apos ${data.diasSemAcesso} dias: ${data.alunoName}`;
  const logoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#ffffff;padding:30px 40px;text-align:center;">
          <img src="${logoUrl}" alt="ECOSSISTEMA DO BEM" width="160" style="display:block;margin:0 auto 12px;" />
        </td></tr>
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:2px solid #ef4444;margin:0;" /></td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="color:#dc2626;font-size:20px;margin:0 0 16px;">Aluno sem acesso — acao necessaria</h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
            O aluno abaixo recebeu todos os e-mails de convite mas <strong>nao acessou a plataforma</strong> nos ultimos <strong>${data.diasSemAcesso} dias</strong>. A situacao deve ser analisada.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:8px;border:1px solid #fecaca;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6b7280;width:140px;">Aluno(a):</td>
                  <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1a1a2e;">${data.alunoName}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6b7280;">E-mail:</td>
                  <td style="padding:4px 0;font-size:14px;color:#1a1a2e;">${data.alunoEmail}</td>
                </tr>
                ${data.programaNome ? `<tr>
                  <td style="padding:4px 0;font-size:14px;color:#6b7280;">Programa:</td>
                  <td style="padding:4px 0;font-size:14px;color:#1a1a2e;">${data.programaNome}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6b7280;">Dias sem acesso:</td>
                  <td style="padding:4px 0;font-size:14px;font-weight:700;color:#dc2626;">${data.diasSemAcesso} dias</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">
            Por favor, entre em contato com o aluno diretamente ou verifique se ha algum impedimento tecnico ou pessoal que esteja dificultando o acesso.
          </p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© ECOSSISTEMA DO BEM — Alerta automatico do sistema</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `ALUNO SEM ACESSO — ACAO NECESSARIA\n\nAluno: ${data.alunoName}\nE-mail: ${data.alunoEmail}\n${data.programaNome ? `Programa: ${data.programaNome}\n` : ''}Dias sem acesso: ${data.diasSemAcesso} dias\n\nPor favor, analise a situacao e entre em contato com o aluno.`;

  return { subject, html, text };
}

// ============ PROCESSO SELETIVO — CONFIRMAÇÃO DE AGENDAMENTO ============

export function buildPsConfirmacaoAgendamentoEmail(data: {
  candidatoNome: string;
  processoNome: string;
  clienteNome: string;
  dataEntrevista: string; // ex: "02/06/2025"
  horaInicio: string;     // ex: "14:00"
  horaFim: string;        // ex: "14:30"
  linkEntrevista: string | null;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Entrevista confirmada — ${data.processoNome}`;

  const linkBlock = data.linkEntrevista
    ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Link da entrevista:</td>
       <td style="padding:4px 0;font-size:14px;"><a href="${data.linkEntrevista}" style="color:#1d4ed8;">${data.linkEntrevista}</a></td></tr>`
    : "";

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr><td style="padding:30px 40px;text-align:center;background:#0f2b3c;">
        <p style="color:#e8a838;font-size:20px;font-weight:700;margin:0;">ECOSSISTEMA DO BEM</p>
        <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Processo Seletivo</p>
      </td></tr>
      <tr><td style="background:#10b981;padding:16px 40px;text-align:center;">
        <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Entrevista Confirmada!</p>
      </td></tr>
      <tr><td style="padding:30px 40px;">
        <h2 style="color:#0f2b3c;margin:0 0 12px;font-size:18px;">Olá, ${data.candidatoNome}!</h2>
        <p style="color:#4a5568;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Sua entrevista para o processo seletivo <strong>${data.processoNome}</strong> — ${data.clienteNome} foi confirmada com sucesso.
        </p>
        <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;width:100%;">
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Data:</td>
              <td style="padding:4px 0;font-size:14px;font-weight:700;color:#0f2b3c;">${data.dataEntrevista}</td></tr>
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Horário:</td>
              <td style="padding:4px 0;font-size:14px;font-weight:700;color:#0f2b3c;">${data.horaInicio} – ${data.horaFim}</td></tr>
          ${linkBlock}
        </table>
        <p style="color:#4a5568;font-size:14px;line-height:1.7;margin:20px 0 0;">
          Você receberá um lembrete no dia anterior à entrevista. Caso precise reagendar, entre em contato com a equipe.
        </p>
      </td></tr>
      <tr><td style="padding:0 40px 30px;text-align:center;">
        <a href="${data.loginUrl}" style="display:inline-block;background:#e8a838;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">
          Acessar o Portal
        </a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">Ecossistema do Bem — Processo Seletivo</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = `Entrevista Confirmada!\n\nOlá, ${data.candidatoNome}!\n\nSua entrevista para o processo seletivo "${data.processoNome}" — ${data.clienteNome} foi confirmada.\n\nData: ${data.dataEntrevista}\nHorário: ${data.horaInicio} – ${data.horaFim}\n${data.linkEntrevista ? `Link: ${data.linkEntrevista}\n` : ""}\nVocê receberá um lembrete no dia anterior.`;

  return { subject, html, text };
}

// ============ PROCESSO SELETIVO — LEMBRETE D-1 ============

export function buildPsLembreteD1Email(data: {
  candidatoNome: string;
  processoNome: string;
  clienteNome: string;
  dataEntrevista: string;
  horaInicio: string;
  horaFim: string;
  linkEntrevista: string | null;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Lembrete: sua entrevista é amanhã — ${data.processoNome}`;

  const linkBlock = data.linkEntrevista
    ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Link da entrevista:</td>
       <td style="padding:4px 0;font-size:14px;"><a href="${data.linkEntrevista}" style="color:#1d4ed8;">${data.linkEntrevista}</a></td></tr>`
    : "";

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr><td style="padding:30px 40px;text-align:center;background:#0f2b3c;">
        <p style="color:#e8a838;font-size:20px;font-weight:700;margin:0;">ECOSSISTEMA DO BEM</p>
        <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Processo Seletivo</p>
      </td></tr>
      <tr><td style="background:#f59e0b;padding:16px 40px;text-align:center;">
        <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Lembrete: sua entrevista é amanhã!</p>
      </td></tr>
      <tr><td style="padding:30px 40px;">
        <h2 style="color:#0f2b3c;margin:0 0 12px;font-size:18px;">Olá, ${data.candidatoNome}!</h2>
        <p style="color:#4a5568;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Este é um lembrete de que sua entrevista para o processo seletivo <strong>${data.processoNome}</strong> — ${data.clienteNome} acontece <strong>amanhã</strong>.
        </p>
        <table cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;width:100%;">
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Data:</td>
              <td style="padding:4px 0;font-size:14px;font-weight:700;color:#0f2b3c;">${data.dataEntrevista}</td></tr>
          <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Horário:</td>
              <td style="padding:4px 0;font-size:14px;font-weight:700;color:#0f2b3c;">${data.horaInicio} – ${data.horaFim}</td></tr>
          ${linkBlock}
        </table>
        <p style="color:#4a5568;font-size:14px;line-height:1.7;margin:20px 0 0;">
          Prepare-se bem e boa sorte! Caso tenha alguma dúvida, entre em contato com a equipe.
        </p>
      </td></tr>
      <tr><td style="padding:0 40px 30px;text-align:center;">
        <a href="${data.loginUrl}" style="display:inline-block;background:#e8a838;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">
          Acessar o Portal
        </a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">Ecossistema do Bem — Processo Seletivo</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = `Lembrete: sua entrevista é amanhã!\n\nOlá, ${data.candidatoNome}!\n\nSua entrevista para o processo seletivo "${data.processoNome}" — ${data.clienteNome} acontece amanhã.\n\nData: ${data.dataEntrevista}\nHorário: ${data.horaInicio} – ${data.horaFim}\n${data.linkEntrevista ? `Link: ${data.linkEntrevista}\n` : ""}\nBoa sorte!`;

  return { subject, html, text };
}
