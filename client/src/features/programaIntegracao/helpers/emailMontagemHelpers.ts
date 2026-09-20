import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  emailMarkdownParaTexto,
  emailTemDadoFaltante,
  montarEmailComModelo,
  type EmailMontadoIntegracao,
} from './emailCoreHelpers';
import { alinhamentoDoModeloEmail } from './emailAcaoHelpers';
import { valoresTokensLinksIntegracao } from './emailLinksHelpers';
import { modeloEmailIntegracao } from './emailModelosIntegracao';
import { AVISO_PADRAO_EMAIL_INTEGRACAO } from './emailModelosPadrao';
import { MARCADOR_EMAIL_VAZIO, valoresEmailIntegracao } from './emailValoresHelpers';

export interface MentoraConfigIntegracao {
  id?: string;
  nome?: string;
  tel?: string;
  email?: string;
  ativa?: boolean;
  obs?: string;
}

export interface EmailPreviewIntegracao {
  email: EmailMontadoIntegracao;
  faltandoDados: boolean;
  textoSimples: string;
  mailto: string;
}

function nomeMentoraDoProcesso(
  processo: ProcessoIntegracao,
  config: BootstrapState['config'],
): string {
  const mentoras = Array.isArray(config?.mentoras)
    ? config.mentoras as MentoraConfigIntegracao[]
    : [];

  if (processo.mentorId) {
    const vinculada = mentoras.find((m) => m?.id === processo.mentorId);
    if (vinculada?.nome) return String(vinculada.nome).trim();
  }

  // O HTML mantém `consultora` como legado quando ainda não existe vínculo por ID.
  return String(processo.consultora || '').trim();
}

function avisoDaConfiguracao(config: BootstrapState['config']): string {
  return config?.aviso == null
    ? AVISO_PADRAO_EMAIL_INTEGRACAO
    : String(config.aviso || '');
}

function valorSeguroMailto(valor: string): string {
  return valor && !valor.includes(MARCADOR_EMAIL_VAZIO) ? valor : '';
}

/**
 * Equivalente somente-leitura de `montar(k,p)` + preparação do diálogo de e-mail.
 * Não envia, não grava configuração e não altera o processo.
 */
export function montarPreviewEmailIntegracao(
  chave: string,
  processo: ProcessoIntegracao,
  config: BootstrapState['config'],
  feriados: string[] = [],
  origin?: string,
): EmailPreviewIntegracao | null {
  const modelo = modeloEmailIntegracao(chave, config?.emails || null);
  if (!modelo) return null;

  const linksPorToken = valoresTokensLinksIntegracao(config?.links || null, origin);
  const alinhamento = alinhamentoDoModeloEmail(chave);
  const aviso = avisoDaConfiguracao(config);
  const valores = valoresEmailIntegracao(processo, {
    alinhamento,
    feriados,
    mentoraNome: nomeMentoraDoProcesso(processo, config),
    linksPorToken,
    aviso,
  });

  const email = montarEmailComModelo(
    chave,
    modelo,
    valores,
    MARCADOR_EMAIL_VAZIO,
    aviso,
  );
  const textoSimples = emailMarkdownParaTexto(email.corpo);
  const para = valorSeguroMailto(email.para);
  const cc = valorSeguroMailto(email.cc);
  const mailto =
    `mailto:${encodeURIComponent(para)}` +
    `?subject=${encodeURIComponent(email.assunto)}` +
    `&body=${encodeURIComponent(textoSimples)}` +
    (cc ? `&cc=${encodeURIComponent(cc)}` : '');

  return {
    email,
    faltandoDados: emailTemDadoFaltante(email, MARCADOR_EMAIL_VAZIO),
    textoSimples,
    mailto,
  };
}

function escaparHtml(valor: string): string {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineHtml(texto: string, marcarVazio = true): string {
  let out = escaparHtml(texto).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  if (marcarVazio) {
    out = out.split(MARCADOR_EMAIL_VAZIO).join(`<mark>${MARCADOR_EMAIL_VAZIO}</mark>`);
  }
  return out;
}

/** Espelha `mdHtml(corpo)` do HTML histórico para a prévia na tela. */
export function emailMarkdownParaHtmlPreview(corpo: string): string {
  return String(corpo || '').split('\n\n').map((bloco) => {
    if (/^>\s?/.test(bloco)) {
      return `<p class="email-aviso">${inlineHtml(bloco.replace(/^>\s?/gm, ''))}</p>`;
    }
    if (bloco.trim() === '---') return '<hr class="email-regra">';
    const linhas = bloco.split('\n');
    if (linhas.every((linha) => /^[-•]\s/.test(linha))) {
      return linhas
        .map((linha) => `<p class="email-item">• ${inlineHtml(linha.replace(/^[-•]\s/, ''))}</p>`)
        .join('');
    }
    return `<p>${linhas.map((linha) => inlineHtml(linha)).join('<br>')}</p>`;
  }).join('');
}

/** Espelha `mdEmailHtml(m)` do HTML histórico para a cópia rica. */
export function emailMarkdownParaHtmlRico(corpo: string): string {
  const blocos = String(corpo || '').split('\n\n').map((bloco) => {
    const inline = (texto: string) => inlineHtml(texto, false);
    if (/^>\s?/.test(bloco)) {
      return '<div style="font-size:12.5px;color:#5B6675;border-left:3px solid #6B3E8F;padding:8px 12px;background:#F7F8FC;margin:0 0 16px">' +
        inline(bloco.replace(/^>\s?/gm, '')) + '</div>';
    }
    if (bloco.trim() === '---') {
      return '<hr style="border:0;border-top:1px solid #E8E3E0;margin:18px 0">';
    }
    const linhas = bloco.split('\n');
    if (linhas.every((linha) => /^[-•]\s/.test(linha))) {
      return '<ul style="margin:0 0 14px;padding-left:20px">' +
        linhas.map((linha) => '<li style="margin-bottom:4px">' + inline(linha.replace(/^[-•]\s/, '')) + '</li>').join('') +
        '</ul>';
    }
    return '<p style="margin:0 0 14px">' + linhas.map(inline).join('<br>') + '</p>';
  }).join('');

  return '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;color:#152232">' + blocos + '</div>';
}
