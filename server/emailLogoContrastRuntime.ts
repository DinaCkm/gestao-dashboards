import nodemailer from "nodemailer";

const OLD_LOGO_URL = "https://ecolider.ecodobem.com/eco_do_bem_logo_horizontal.png";
const COLOR_LOGO_URL = "https://ecolider.ecodobem.com/logo_colorido_horizontal.png";
const LIGHT_LOGO_URL = "https://ecolider.ecodobem.com/logo_claro_horizontal.png";

const DARK_COLORS = ["#0f2b3c", "#0a1e3e", "#061529", "#1a3a6a", "#1a3a6e"];

function hasDarkBackground(context: string): boolean {
  const normalized = context.toLowerCase().replace(/\s+/g, " ");

  return DARK_COLORS.some((color) => {
    const escapedColor = color.replace("#", "\\#");
    const directBackground = new RegExp(
      `background(?:-color)?\\s*:\\s*${escapedColor.replace("\\#", "#")}`,
      "i"
    );
    const gradientBackground = new RegExp(
      `background\\s*:[^;\"]*${escapedColor.replace("\\#", "#")}`,
      "i"
    );
    return directBackground.test(normalized) || gradientBackground.test(normalized);
  });
}

/**
 * Normaliza os logos dos e-mails sem alterar o restante do template:
 * - fundo claro -> logo colorido transparente;
 * - fundo escuro/gradiente -> logo claro;
 * - troca a URL antiga por uma URL nova para evitar cache de Gmail/Outlook.
 */
export function applyEmailLogoContrast(html: string): string {
  if (!html) return html;

  let output = html.split(OLD_LOGO_URL).join(COLOR_LOGO_URL);
  let cursor = 0;

  while (true) {
    const logoIndex = output.indexOf(COLOR_LOGO_URL, cursor);
    if (logoIndex === -1) break;

    // Primeiro considera o TD mais próximo, que é onde os templates definem
    // normalmente a cor de fundo do cabeçalho/rodapé.
    const before = output.slice(0, logoIndex);
    const lastTdIndex = before.toLowerCase().lastIndexOf("<td");
    const nearestTdContext = lastTdIndex >= 0 ? before.slice(lastTdIndex) : "";

    // Fallback limitado para casos em que a cor está no contêiner imediatamente
    // acima do TD que contém a imagem.
    const nearbyContext = before.slice(Math.max(0, before.length - 1200));
    const dark = hasDarkBackground(nearestTdContext) || hasDarkBackground(nearbyContext);

    if (dark) {
      output =
        output.slice(0, logoIndex) +
        LIGHT_LOGO_URL +
        output.slice(logoIndex + COLOR_LOGO_URL.length);
      cursor = logoIndex + LIGHT_LOGO_URL.length;
    } else {
      cursor = logoIndex + COLOR_LOGO_URL.length;
    }
  }

  return output;
}

function installEmailLogoContrastRuntime() {
  const mailer = nodemailer as any;
  if (mailer.__ecoBemLogoContrastInstalled) return;

  const originalCreateTransport = mailer.createTransport.bind(mailer);

  mailer.createTransport = (...args: any[]) => {
    const transport = originalCreateTransport(...args);
    const originalSendMail = transport.sendMail.bind(transport);

    transport.sendMail = (mailOptions: any, ...sendArgs: any[]) => {
      const normalizedOptions =
        mailOptions && typeof mailOptions.html === "string"
          ? { ...mailOptions, html: applyEmailLogoContrast(mailOptions.html) }
          : mailOptions;

      return originalSendMail(normalizedOptions, ...sendArgs);
    };

    return transport;
  };

  mailer.__ecoBemLogoContrastInstalled = true;
}

installEmailLogoContrastRuntime();
