function obterPrimeiroNome(): string | null {
  try {
    const raw = localStorage.getItem("app-user-info");
    if (!raw) return null;

    const user = JSON.parse(raw);
    const nome = typeof user?.name === "string" ? user.name.trim() : "";
    if (!nome) return null;

    return nome.split(/\s+/)[0] || null;
  } catch {
    return null;
  }
}

function aplicarEstiloSaudacao(elemento: HTMLElement) {
  elemento.style.fontSize = "clamp(1.875rem, 3vw, 2.5rem)";
  elemento.style.fontWeight = "800";
  elemento.style.lineHeight = "1.12";
  elemento.style.letterSpacing = "-0.03em";
  elemento.style.margin = "0";

  const texto = elemento.querySelector<HTMLElement>("[data-personalized-welcome-gradient]");
  if (!texto) return;

  texto.style.background = "linear-gradient(90deg, #49306B 0%, #6D4BA6 48%, #F5991F 100%)";
  texto.style.backgroundClip = "text";
  texto.style.webkitBackgroundClip = "text";
  texto.style.color = "transparent";
  texto.style.webkitTextFillColor = "transparent";
}

function montarSaudacao(elemento: HTMLElement, primeiroNome: string) {
  elemento.replaceChildren();

  const texto = document.createElement("span");
  texto.dataset.personalizedWelcomeGradient = "true";
  texto.textContent = `${primeiroNome}, bem-vindo(a) ao Ecossistema do B.E.M.`;

  elemento.appendChild(texto);
  elemento.dataset.personalizedWelcomeApplied = primeiroNome;
  aplicarEstiloSaudacao(elemento);
}

function aplicarSaudacaoAdministrativa(primeiroNome: string) {
  if (window.location.pathname !== "/") return;

  const titulo = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((elemento) => {
    const texto = elemento.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return texto === "Bem-vindo ao ECOSSISTEMA DO BEM";
  });

  if (!titulo) return;
  montarSaudacao(titulo, primeiroNome);
}

function aplicarSaudacaoMentor(primeiroNome: string) {
  if (window.location.pathname !== "/dashboard/mentor") return;

  const titulo = Array.from(document.querySelectorAll<HTMLElement>("h1")).find(
    (elemento) => elemento.textContent?.trim() === "Meu Dashboard"
  );

  // Quando o Admin acessa esta rota o título é "Dashboard dos Mentores".
  // Nesse caso nada é alterado.
  if (!titulo) return;

  montarSaudacao(titulo, primeiroNome);

  const container = titulo.parentElement;
  const descricao = container?.querySelector<HTMLElement>("p.text-muted-foreground");
  if (descricao && descricao.textContent?.trim().startsWith("Bem-vindo(a),")) {
    descricao.textContent = "Acompanhe seus mentorados, sessões e indicadores em um só lugar.";
    descricao.style.marginTop = "0.5rem";
  }
}

function aplicarSaudacaoPersonalizada() {
  const primeiroNome = obterPrimeiroNome();
  if (!primeiroNome) return;

  aplicarSaudacaoAdministrativa(primeiroNome);
  aplicarSaudacaoMentor(primeiroNome);
}

export function initPersonalizedWelcome() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  aplicarSaudacaoPersonalizada();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(aplicarSaudacaoPersonalizada);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
