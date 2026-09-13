const COURSE_PAGE_PATH = "/competencias-comp-tec";
const FILTER_ATTR = "data-admin-course-catalog-filter";

function normalizeForSearch(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function findCourseCatalogCard() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="card"]'));

  return cards.find((card) => {
    const title = normalizeText(
      card.querySelector<HTMLElement>('[data-slot="card-title"]')?.textContent ||
      card.querySelector<HTMLElement>("h3")?.textContent
    );
    return title === "Todos os Cursos Criados";
  }) || null;
}

function getCourseRows(card: HTMLElement) {
  const tbody = card.querySelector<HTMLTableSectionElement>("tbody");
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll<HTMLTableRowElement>(":scope > tr"));
}

function getRowData(row: HTMLTableRowElement) {
  const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>(":scope > td"));
  return {
    competencia: (cells[0]?.textContent || "").trim(),
    titulo: (cells[1]?.textContent || "").trim(),
  };
}

function getDirectChildAncestor(parent: HTMLElement, element: HTMLElement) {
  let current: HTMLElement | null = element;

  while (current && current.parentElement && current.parentElement !== parent) {
    current = current.parentElement;
  }

  return current?.parentElement === parent ? current : null;
}

function createSearchIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("admin-course-filter-search-icon");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "11");
  circle.setAttribute("cy", "11");
  circle.setAttribute("r", "8");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", "m21 21-4.3-4.3");

  svg.append(circle, line);
  return svg;
}

function syncCompetencias(select: HTMLSelectElement, rows: HTMLTableRowElement[]) {
  const competencias = Array.from(
    new Set(
      rows
        .map((row) => getRowData(row).competencia)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

  const signature = competencias.join("\u0001");
  if (select.dataset.competenciasSignature === signature) return;

  const previousValue = select.value;
  select.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "Todas as competências";
  select.appendChild(allOption);

  competencias.forEach((competencia) => {
    const option = document.createElement("option");
    option.value = competencia;
    option.textContent = competencia;
    select.appendChild(option);
  });

  if (previousValue && competencias.includes(previousValue)) {
    select.value = previousValue;
  }

  select.dataset.competenciasSignature = signature;
}

function applyFilters(filter: HTMLElement, card: HTMLElement) {
  const input = filter.querySelector<HTMLInputElement>("input[type='search']");
  const select = filter.querySelector<HTMLSelectElement>("select");
  const count = filter.querySelector<HTMLElement>("[data-filter-count]");
  const emptyState = card.querySelector<HTMLElement>("[data-course-filter-empty]");
  const rows = getCourseRows(card);

  if (!input || !select) return;

  syncCompetencias(select, rows);

  const search = normalizeForSearch(input.value);
  const selectedCompetencia = normalizeForSearch(select.value);
  let visible = 0;

  rows.forEach((row) => {
    const data = getRowData(row);
    const competencia = normalizeForSearch(data.competencia);
    const titulo = normalizeForSearch(data.titulo);

    const matchesSearch = !search || titulo.includes(search) || competencia.includes(search);
    const matchesCompetencia = !selectedCompetencia || competencia === selectedCompetencia;
    const shouldShow = matchesSearch && matchesCompetencia;

    row.hidden = !shouldShow;
    if (shouldShow) visible += 1;
  });

  if (count) {
    count.textContent = visible === rows.length
      ? `${rows.length} curso${rows.length === 1 ? "" : "s"}`
      : `${visible} de ${rows.length} cursos`;
  }

  if (emptyState) {
    emptyState.hidden = visible > 0;
  }
}

function createFilter(card: HTMLElement) {
  const cardContent = card.querySelector<HTMLElement>('[data-slot="card-content"]');
  const table = card.querySelector<HTMLTableElement>("table");
  if (!cardContent || !table) return null;

  const tableRegion = getDirectChildAncestor(cardContent, table);
  if (!tableRegion) return null;

  card.querySelectorAll<HTMLElement>("[data-course-filter-empty]").forEach((element) => element.remove());

  const filter = document.createElement("div");
  filter.setAttribute(FILTER_ATTR, "true");
  filter.className = "admin-course-catalog-filter";

  const controls = document.createElement("div");
  controls.className = "admin-course-filter-controls";

  const searchField = document.createElement("div");
  searchField.className = "admin-course-filter-search";

  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "Buscar por título ou competência...";
  input.setAttribute("aria-label", "Buscar curso por título ou competência");
  input.autocomplete = "off";

  searchField.append(createSearchIcon(), input);

  const selectWrap = document.createElement("div");
  selectWrap.className = "admin-course-filter-select-wrap";

  const select = document.createElement("select");
  select.setAttribute("aria-label", "Filtrar cursos por competência");
  selectWrap.appendChild(select);

  controls.append(searchField, selectWrap);

  const footer = document.createElement("div");
  footer.className = "admin-course-filter-footer";

  const helper = document.createElement("span");
  helper.textContent = "Pesquise pelo nome do curso ou refine por competência.";

  const count = document.createElement("span");
  count.setAttribute("data-filter-count", "true");
  count.className = "admin-course-filter-count";

  footer.append(helper, count);
  filter.append(controls, footer);

  const emptyState = document.createElement("div");
  emptyState.setAttribute("data-course-filter-empty", "true");
  emptyState.className = "admin-course-filter-empty";
  emptyState.hidden = true;
  emptyState.innerHTML = `
    <strong>Nenhum curso encontrado.</strong>
    <span>Tente outro termo ou selecione uma competência diferente.</span>
  `;

  cardContent.insertBefore(filter, tableRegion);
  tableRegion.insertAdjacentElement("afterend", emptyState);

  input.addEventListener("input", () => applyFilters(filter, card));
  select.addEventListener("change", () => applyFilters(filter, card));

  applyFilters(filter, card);
  return filter;
}

function enhanceCourseCatalogFilter() {
  if (window.location.pathname !== COURSE_PAGE_PATH) return;

  const card = findCourseCatalogCard();
  if (!card) return;

  card.classList.add("admin-course-card-all");

  let filter = card.querySelector<HTMLElement>(`[${FILTER_ATTR}]`);
  if (!filter) {
    filter = createFilter(card);
  }

  if (filter) {
    applyFilters(filter, card);
  }
}

export function initAdminCourseCatalogFilter() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  enhanceCourseCatalogFilter();
  window.addEventListener("popstate", enhanceCourseCatalogFilter);

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      enhanceCourseCatalogFilter();
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}
