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
