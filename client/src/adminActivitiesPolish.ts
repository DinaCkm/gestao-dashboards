const PAGE_PATH = "/admin/competencias-comp-tec/atividades";

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function applyPolish() {
  if (window.location.pathname !== PAGE_PATH) {
    document.body.classList.remove("admin-activities-active");
    return;
  }

  const title = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1")).find(
    (element) => normalizeText(element.textContent) === "Administração de Atividades"
  );
  if (!title) return;

  const root = title.closest<HTMLElement>("div.space-y-6.p-6");
  if (!root) return;

  document.body.classList.add("admin-activities-active");
  root.classList.add("admin-activities-page");

  const hero = title.closest<HTMLElement>("div.flex.items-center.justify-between");
  if (hero) hero.classList.add("admin-activities-hero");

  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="card"]'));
  cards.forEach((card) => {
    const cardTitle = normalizeText(
      card.querySelector<HTMLElement>('[data-slot="card-title"]')?.textContent ||
      card.querySelector<HTMLElement>("h3")?.textContent
    );

    card.classList.add("admin-activities-card");
    if (cardTitle === "Seleção") card.classList.add("admin-activities-card-selection");
    if (cardTitle === "Nova Atividade") card.classList.add("admin-activities-card-create");
    if (cardTitle === "Atividades") card.classList.add("admin-activities-card-list");
  });

  const grid = root.querySelector<HTMLElement>("div.grid.gap-4");
  if (grid) grid.classList.add("admin-activities-grid");

  root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    const text = normalizeText(button.textContent);
    const titleAttr = normalizeText(button.getAttribute("title"));

    if (text === "Criar Atividade" || text.startsWith("Enviando")) {
      button.classList.add("admin-activities-primary-action");
    }
    if (titleAttr === "Editar") button.classList.add("admin-activities-edit-action");
    if (titleAttr === "Excluir") button.classList.add("admin-activities-delete-action");
  });

  const listCard = root.querySelector<HTMLElement>(".admin-activities-card-list");
  if (listCard) {
    listCard.querySelectorAll<HTMLElement>("div.border.rounded.p-3.text-xs").forEach((item) => {
      item.classList.add("admin-activities-list-item");
    });
  }
}

export function initAdminActivitiesPolish() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  applyPolish();
  window.addEventListener("popstate", applyPolish);

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      applyPolish();
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}
