const CASES_INFO_TEXT = "Espaço para conhecer cases de sucesso da empresa e, caso tenha interesse, entrar em contato para saber mais.";

function injectStyles() {
  if (document.getElementById("mural-presentation-enhancements-styles")) return;

  const style = document.createElement("style");
  style.id = "mural-presentation-enhancements-styles";
  style.textContent = `
    .mural-standard-cta {
      font-size: 0 !important;
      gap: 0 !important;
    }

    .mural-standard-cta > svg {
      display: block !important;
      width: 1rem !important;
      height: 1rem !important;
      margin-right: 0.35rem !important;
      flex-shrink: 0;
    }

    .mural-standard-cta::after {
      content: attr(data-mural-cta);
      font-size: 0.875rem;
      font-weight: 700;
      line-height: 1.25rem;
      white-space: nowrap;
    }

    .mural-cases-heading {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .mural-cases-info {
      position: relative;
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
      z-index: 20;
    }

    .mural-cases-info:hover,
    .mural-cases-info:focus-visible {
      color: #0A1E3E;
      border-color: #0A1E3E;
      outline: none;
    }

    .mural-cases-info::after {
      content: attr(data-mural-tooltip);
      position: absolute;
      left: 50%;
      bottom: calc(100% + 10px);
      transform: translateX(-50%) translateY(4px);
      width: min(320px, 75vw);
      padding: 10px 12px;
      border-radius: 8px;
      background: #0A1E3E;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.45;
      text-align: left;
      text-transform: none;
      letter-spacing: normal;
      white-space: normal;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 150ms ease, transform 150ms ease, visibility 150ms ease;
      z-index: 9999;
    }

    .mural-cases-info:hover::after,
    .mural-cases-info:focus-visible::after {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }

    /* Sidebar administrativa/gestor: melhora contraste do módulo ativo */
    [data-sidebar="sidebar"] button.text-primary {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.11) !important;
      border: 1px solid rgba(255, 255, 255, 0.10);
    }

    [data-sidebar="sidebar"] button.text-primary:hover {
      background: rgba(255, 255, 255, 0.16) !important;
    }

    [data-sidebar="sidebar"] button.text-primary svg,
    [data-sidebar="sidebar"] button.text-primary span {
      color: #ffffff !important;
    }

    /* Marca no topo da sidebar: cabe sem invadir o sino */
    .sidebar-brand-label-enhanced {
      color: #ffffff !important;
      font-size: 0.72rem !important;
      line-height: 1rem !important;
      letter-spacing: 0.01em !important;
      white-space: nowrap !important;
      max-width: 7.4rem;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 1;
    }

    /* Selo de papel do usuário com contraste alto */
    .sidebar-role-badge-enhanced {
      background: rgba(255, 255, 255, 0.15) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.24) !important;
      font-weight: 700 !important;
    }

    /* Notificações da sidebar abrem para dentro da tela */
    .sidebar-notification-popover-enhanced {
      right: auto !important;
      left: 0 !important;
      width: min(24rem, calc(100vw - 1rem)) !important;
      max-width: calc(100vw - 1rem) !important;
      z-index: 9999 !important;
    }
  `;

  document.head.appendChild(style);
}

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function applyBrandingAdjustments() {
  const loginTitles = Array.from(document.querySelectorAll<HTMLElement>("h2")).filter((element) =>
    normalizeText(element.textContent).startsWith("Ecossistema de Desenvolvimento do B.E.M")
  );

  loginTitles.forEach((element) => {
    element.style.display = "none";
  });

  const loginTaglines = Array.from(document.querySelectorAll<HTMLElement>("p")).filter(
    (element) => normalizeText(element.textContent) === "Líderes Sucessores"
  );

  loginTaglines.forEach((element) => {
    element.style.display = "none";
  });

  const headerLabels = Array.from(document.querySelectorAll<HTMLElement>("header span")).filter(
    (element) => normalizeText(element.textContent) === "ECOSSISTEMA DO BEM"
  );

  headerLabels.forEach((element) => {
    element.textContent = "Ecossistema do B.E.M.";
  });
}

function applySidebarEnhancements() {
  const sidebarRoots = Array.from(document.querySelectorAll<HTMLElement>('[data-sidebar="sidebar"]'));

  sidebarRoots.forEach((sidebar) => {
    const brandLabels = Array.from(sidebar.querySelectorAll<HTMLElement>("span")).filter((element) => {
      const text = normalizeText(element.textContent);
      return text === "ECOSSISTEMA DO BEM" || text === "Ecossistema do B.E.M.";
    });

    brandLabels.forEach((element) => {
      element.textContent = "Ecossistema do B.E.M.";
      element.classList.add("sidebar-brand-label-enhanced");
    });

    const roleLabels = new Set(["Admin", "Admin N2", "Gerente", "Mentor", "Aluno"]);
    Array.from(sidebar.querySelectorAll<HTMLElement>("span")).forEach((element) => {
      if (roleLabels.has(normalizeText(element.textContent))) {
        element.classList.add("sidebar-role-badge-enhanced");
      }
    });

    Array.from(sidebar.querySelectorAll<HTMLElement>("div.absolute.right-0.top-full")).forEach((element) => {
      element.classList.add("sidebar-notification-popover-enhanced");
    });
  });
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
    (element) => element.textContent?.trim().startsWith("Cases de Sucesso da Comunidade")
  );

  headings.forEach((heading) => {
    heading.classList.add("mural-cases-heading");
    if (heading.querySelector(".mural-cases-info")) return;

    const info = document.createElement("span");
    info.className = "mural-cases-info";
    info.textContent = "i";
    info.dataset.muralTooltip = CASES_INFO_TEXT;
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

function applyPresentationEnhancements() {
  applyBrandingAdjustments();
  applySidebarEnhancements();
  applyMuralEnhancements();
}

export function initMuralPresentationEnhancements() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  injectStyles();
  applyPresentationEnhancements();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(applyPresentationEnhancements);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
