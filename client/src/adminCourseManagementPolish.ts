const PAGE_PATH = "/competencias-comp-tec";
const PAGE_CLASS = "admin-course-management-page";
const BODY_CLASS = "admin-course-management-active";

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function limparMarcacoes() {
  document.body.classList.remove(BODY_CLASS);
  document.querySelectorAll<HTMLElement>(`.${PAGE_CLASS}`).forEach((element) => {
    element.classList.remove(PAGE_CLASS);
  });
}

function marcarCard(card: HTMLElement, titulo: string) {
  card.classList.add("admin-course-card");

  const classesPorTitulo: Record<string, string> = {
    "Criar Novo Curso": "admin-course-card-create",
    "Cursos Cadastrados": "admin-course-card-list",
    "Gerenciar Atividades": "admin-course-card-activities",
    "Gerenciar Avaliações": "admin-course-card-evaluations",
    "Todos os Cursos": "admin-course-card-all",
    "Todos os Cursos Criados": "admin-course-card-all",
  };

  const classe = classesPorTitulo[titulo];
  if (classe) card.classList.add(classe);
}

function marcarModalVisualizacao() {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));

  dialogs.forEach((dialog) => {
    const descricao = normalizeText(dialog.textContent);
    const temVisualizacaoCompleta = descricao.includes("Visualização completa do curso com atividades e avaliações");
    if (!temVisualizacaoCompleta) return;

    dialog.classList.add("admin-course-preview-dialog");

    const header = dialog.querySelector<HTMLElement>('[data-slot="dialog-header"]');
    if (header) header.classList.add("admin-course-preview-header");

    dialog.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
      table.classList.add("admin-course-preview-table");
      table.classList.remove("admin-course-preview-table-activities", "admin-course-preview-table-evaluations");

      const cabecalho = normalizeText(table.querySelector("thead")?.textContent);
      if (cabecalho.includes("Título da Avaliação")) {
        table.classList.add("admin-course-preview-table-evaluations");
      } else if (cabecalho.includes("Título") && cabecalho.includes("Tipo")) {
        table.classList.add("admin-course-preview-table-activities");
      }

      const wrapper = table.parentElement;
      if (wrapper) wrapper.classList.add("admin-course-preview-table-wrap");
    });
  });
}

function aplicarPolimento() {
  if (window.location.pathname !== PAGE_PATH) {
    limparMarcacoes();
    return;
  }

  const tituloPagina = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1")).find(
    (element) => normalizeText(element.textContent) === "Criação e Gerenciamento de Cursos"
  );

  if (!tituloPagina) return;

  const root = tituloPagina.closest<HTMLElement>("div.space-y-6.p-6");
  if (!root) return;

  document.body.classList.add(BODY_CLASS);
  root.classList.add(PAGE_CLASS);

  const hero = tituloPagina.closest<HTMLElement>("div.flex.items-center.justify-between");
  if (hero) hero.classList.add("admin-course-hero");

  root.querySelectorAll<HTMLElement>('[data-slot="card"]').forEach((card) => {
    const titulo = normalizeText(
      card.querySelector<HTMLElement>('[data-slot="card-title"]')?.textContent ||
      card.querySelector<HTMLElement>("h3")?.textContent
    );
    marcarCard(card, titulo);
  });

  root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    const texto = normalizeText(button.textContent);
    button.classList.add("admin-course-button-polish");
    if (texto === "Criar Curso" || texto === "Criando...") {
      button.classList.add("admin-course-primary-action");
    }
  });

  root.querySelectorAll<HTMLElement>("div.bg-gray-50").forEach((row) => {
    if (row.closest(".admin-course-card-list")) {
      row.classList.add("admin-course-row");
    }
  });

  marcarModalVisualizacao();
}

export function initAdminCourseManagementPolish() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  aplicarPolimento();

  window.addEventListener("popstate", aplicarPolimento);

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(aplicarPolimento);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
