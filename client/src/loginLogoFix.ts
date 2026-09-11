const LOGIN_LOGO_SELECTOR = 'img[alt="B.E.M. - Competências do B.E.M."]';

function aplicarLogoDoLogin() {
  document.querySelectorAll<HTMLImageElement>(LOGIN_LOGO_SELECTOR).forEach((img) => {
    if (!img.closest(".gradient-bg")) return;

    // Usa o arquivo como src real do <img>, em vez da substituição por content:url().
    // Assim o navegador respeita object-fit, object-position e o padding do layout.
    if (img.getAttribute("src") !== "/logo_claro_vertical.png") {
      img.setAttribute("src", "/logo_claro_vertical.png");
    }

    img.style.setProperty("content", "normal", "important");
    img.style.setProperty("object-fit", "contain", "important");
    img.style.setProperty("object-position", "center", "important");
  });
}

export function initLoginLogoFix() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  aplicarLogoDoLogin();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(aplicarLogoDoLogin);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
