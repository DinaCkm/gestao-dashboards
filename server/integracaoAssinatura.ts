import { createHash, createHmac, timingSafeEqual } from "crypto";

// Assinatura HMAC-SHA256 das chamadas entre PDI e EcoLíder (mesmo formato nos dois sistemas):
//   `${timestamp}\n${MÉTODO}\n${caminho com query}\n${sha256 hex do corpo}`
// Cabeçalhos: X-Integracao-Timestamp (epoch em segundos) e X-Integracao-Assinatura (hex).
export const INTEGRACAO_TOLERANCIA_SEGUNDOS = 5 * 60;

export function assinarIntegracao(secret: string, timestamp: string, metodo: string, caminho: string, corpo = "") {
  const hashCorpo = createHash("sha256").update(corpo).digest("hex");
  return createHmac("sha256", secret)
    .update(`${timestamp}\n${metodo.toUpperCase()}\n${caminho}\n${hashCorpo}`)
    .digest("hex");
}

export function assinaturaIntegracaoValida(params: {
  secret: string;
  timestamp: string | undefined;
  assinatura: string | undefined;
  metodo: string;
  caminho: string;
  corpo?: string;
  agoraSegundos?: number;
}) {
  const { secret, timestamp, assinatura, metodo, caminho, corpo = "" } = params;
  if (!timestamp || !assinatura || !/^\d+$/.test(timestamp) || !/^[0-9a-f]+$/i.test(assinatura)) return false;
  const agora = params.agoraSegundos ?? Math.floor(Date.now() / 1000);
  if (Math.abs(agora - Number(timestamp)) > INTEGRACAO_TOLERANCIA_SEGUNDOS) return false;
  const esperada = Buffer.from(assinarIntegracao(secret, timestamp, metodo, caminho, corpo), "hex");
  const recebida = Buffer.from(assinatura, "hex");
  return recebida.length === esperada.length && timingSafeEqual(recebida, esperada);
}
