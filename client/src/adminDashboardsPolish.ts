const HOME_PATH = "/";
const ADMIN_DASHBOARD_PATH = "/dashboard/admin";

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function markHome() {
  if (window.location.pathname !== HOME_PATH) return;

  const description = Array.from(document.querySelectorAll<HTMLElement>("p")).find(
    (element) => normalizeText(element.textContent) === "Visão administrativa completa do sistema"
  );
  if (!description) return;

  const root = description.closest<HTMLElement>("div.space-y-8");
  if (!root) return;

  root.classList.add("admin-home-polished");

  const hero = description.parentElement;
  if (hero) hero.classList.add("admin-home-hero");

  root.querySelectorAll<HTMLElement>('[data-slot="card"]').forEach((card) => {
    const text = normalizeText(card.textContent);

    if (["Total de Alunos", "Mentores", "Sessões de Mentoria", "Empresas"].some((title) => text.startsWith(title))) {
      card.classList.add("admin-home-stat-card");
    }

    if (text.includes("Último Upload")) {
      card.classList.add("admin-home-upload-card");
    }

    if (text.includes("Acesso Administrativo")) {
      card.classList.add("admin-home-access-card");
    }
  });

  const quickTitle = Array.from(root.querySelectorAll<HTMLHeadingElement>("h2")).find(
    (element) => normalizeText(element.textContent) === "Ações Rápidas"
  );
  const quickSection = quickTitle?.parentElement;
  if (quickSection) {
    quickSection.classList.add("admin-home-quick-section");
    quickSection.querySelectorAll<HTMLElement>('[data-slot="card"]').forEach((card) => {
      card.classList.add("admin-home-quick-card");
    });
  }
}

function markAdminDashboard() {
  if (window.location.pathname !== ADMIN_DASHBOARD_PATH) return;

  const title = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1")).find(
    (element) => normalizeText(element.textContent) === "Dashboard Administrativo"
  );
  if (!title) return;

  const root = title.closest<HTMLElement>("div.space-y-6");
  if (!root) return;

  root.classList.add("admin-dashboard-polished");

  const header = title.closest<HTMLElement>("div.flex.flex-col");
  if (header) header.classList.add("admin-dashboard-hero");

  const directChildren = Array.from(root.children).filter((element): element is HTMLElement => element instanceof HTMLElement);
  const kpiGrid = directChildren.find((element) =>
    element.classList.contains("grid") && element.className.includes("lg:grid-cols-5")
  );

  if (kpiGrid) {
    kpiGrid.classList.add("admin-dashboard-kpi-grid");
    kpiGrid.querySelectorAll<HTMLElement>(':scope > [data-slot="card"]').forEach((card) => {
      card.classList.add("admin-dashboard-kpi-card");
    });
  }

  root.querySelectorAll<HTMLElement>('[data-slot="card"]').forEach((card) => {
    if (!card.classList.contains("admin-dashboard-kpi-card")) {
      card.classList.add("admin-dashboard-panel-card");
    }
  });
}

function applyAdminDashboardsPolish() {
  markHome();
  markAdminDashboard();
}

export function initAdminDashboardsPolish() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  applyAdminDashboardsPolish();
  window.addEventListener("popstate", applyAdminDashboardsPolish);

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      applyAdminDashboardsPolish();
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
