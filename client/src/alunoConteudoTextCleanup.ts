const TEXTO_TECNICO =
  "O conteúdo é exibido internamente por iframe. Se o provedor bloquear a incorporação, use o botão de fallback para abrir em nova aba.";

function removerTextoTecnico() {
  if (!window.location.pathname.startsWith("/aluno/competencias-comp-tec/conteudo")) return;

  document
    .querySelectorAll<HTMLElement>('[data-slot="card-description"]')
    .forEach((elemento) => {
      if (elemento.textContent?.trim() === TEXTO_TECNICO) {
        elemento.remove();
      }
    });
}

export function initAlunoConteudoTextCleanup() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  removerTextoTecnico();

  const observer = new MutationObserver(() => {
    removerTextoTecnico();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
