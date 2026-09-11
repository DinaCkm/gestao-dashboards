const CASES_INFO_TEXT = "Espaço para conhecer cases de sucesso da empresa e, caso tenha interesse, entrar em contato para saber mais.";

function injectStyles() {
  if (document.getElementById("mural-presentation-enhancements-styles")) return;

  const style = document.createElement("style");
  style.id = "mural-presentation-enhancements-styles";
  style.textContent = `
    .mural-standard-cta {
      font-size: 0 !important;
    }

    .mural-standard-cta > svg {
      display: none !important;
    }

    .mural-standard-cta::after {
      content: attr(data-mural-cta);
      font-size: 0.875rem;
      font-weight: 700;
      line-height: 1.25rem;
    }

    .mural-cases-heading {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .mural-cases-info {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.05rem;
      height: 1.05rem;
      border-radius: 9999px;
      border: 1px solid #94a3b8;
      color: #64748b;
      background: #ffffff;
      font-size: 0.68rem;
      font-weight: 700;
      line-height: 1;
      text-transform: none;
      letter-spacing: normal;
      cursor: help;
      flex-shrink: 0;
    }

    .mural-cases-info:hover,
    .mural-cases-info:focus-visible {
      color: #0A1E3E;
      border-color: #0A1E3E;
      outline: none;
    }
  `;

  document.head.appendChild(style);
}

function stableLabelFromTitle(title: string) {
  const hash = Array.from(title || "").reduce((total, char) => total + char.charCodeAt(0), 0);
  return hash % 2 === 0 ? "Clique aqui para abrir!" : "Acessar!";
}

function enhanceDicaDaSemana() {
  const badges = Array.from(document.querySelectorAll("span")).filter(
    (element) => element.textContent?.trim() === "DICA DA SEMANA"
  );

  badges.forEach((badge) => {
    const card = badge.closest("div.relative.overflow-hidden.rounded-2xl");
    if (!card) return;

    const actionButton = card.querySelector<HTMLButtonElement>(
      "button.bg-gradient-to-r.from-orange-500.via-amber-500.to-red-500"
    );
    if (!actionButton) return;

    const counter = Array.from(card.querySelectorAll("span"))
      .map((element) => element.textContent?.trim() || "")
      .find((text) => /^\d+\s*\/\s*\d+$/.test(text));

    let label: string;
    if (counter) {
      const current = Number(counter.split("/")[0].trim());
      label = current % 2 === 1 ? "Clique aqui para abrir!" : "Acessar!";
    } else {
      const title = card.querySelector("h2")?.textContent?.trim() || "";
      label = stableLabelFromTitle(title);
    }

    actionButton.classList.add("mural-standard-cta");
    actionButton.dataset.muralCta = label;
    actionButton.setAttribute("aria-label", label);
  });
}

function enhanceCasesHeading() {
  const headings = Array.from(document.querySelectorAll("h2")).filter(
    (element) => element.textContent?.trim() === "Cases de Sucesso da Comunidade"
  );

  headings.forEach((heading) => {
    heading.classList.add("mural-cases-heading");
    if (heading.querySelector(".mural-cases-info")) return;

    const info = document.createElement("span");
    info.className = "mural-cases-info";
    info.textContent = "i";
    info.title = CASES_INFO_TEXT;
    info.setAttribute("aria-label", CASES_INFO_TEXT);
    info.setAttribute("role", "img");
    info.tabIndex = 0;
    heading.appendChild(info);
  });
}

function applyMuralEnhancements() {
  if (!window.location.pathname.startsWith("/mural")) return;
  enhanceDicaDaSemana();
  enhanceCasesHeading();
}

export function initMuralPresentationEnhancements() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  injectStyles();
  applyMuralEnhancements();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(applyMuralEnhancements);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
