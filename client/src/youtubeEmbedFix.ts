function converterYoutubeParaEmbed(url: string): string | null {
  const valor = url.trim();
  if (!valor) return null;

  try {
    const parsed = new URL(valor, window.location.origin);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname.startsWith("/embed/")) return valor;

      const watchId = parsed.searchParams.get("v");
      if (parsed.pathname === "/watch" && watchId) {
        return `https://www.youtube.com/embed/${watchId}?rel=0&modestbranding=1`;
      }

      const partes = parsed.pathname.split("/").filter(Boolean);
      if (["shorts", "live"].includes(partes[0] ?? "") && partes[1]) {
        return `https://www.youtube.com/embed/${partes[1]}?rel=0&modestbranding=1`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function corrigirIframeYoutube(iframe: HTMLIFrameElement) {
  if (!window.location.pathname.startsWith("/aluno/competencias-comp-tec/conteudo")) return;

  const srcAtual = iframe.getAttribute("src") ?? "";
  const srcEmbed = converterYoutubeParaEmbed(srcAtual);

  if (srcEmbed && srcEmbed !== srcAtual) {
    iframe.setAttribute("src", srcEmbed);
  }
}

export function initYoutubeEmbedFix() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  const processar = () => {
    document.querySelectorAll<HTMLIFrameElement>("iframe[src]").forEach(corrigirIframeYoutube);
  };

  processar();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target instanceof HTMLIFrameElement) {
        corrigirIframeYoutube(mutation.target);
        continue;
      }

      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node instanceof HTMLIFrameElement) corrigirIframeYoutube(node);
        node.querySelectorAll?.("iframe[src]").forEach((iframe) => {
          if (iframe instanceof HTMLIFrameElement) corrigirIframeYoutube(iframe);
        });
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });
}
