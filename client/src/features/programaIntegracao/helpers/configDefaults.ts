export const AVISO_PADRAO_INTEGRACAO =
  '> Este e-mail refere-se ao **Programa de Integração (Onboarding) do Sebrae/TO**, conduzido pela **CKM Talents**. Vale guardar a mensagem para acompanhar as próximas etapas do processo.';

export const FER_FIXOS_INTEGRACAO: Record<string, string> = {
  '01-01': 'Confraternização',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalho',
  '05-20': 'Aniversário de Palmas',
  '09-07': 'Independência',
  '09-08': 'N. Sra. da Natividade (TO)',
  '10-05': 'Criação do Tocantins',
  '10-12': 'N. Sra. Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '11-20': 'Consciência Negra',
  '12-25': 'Natal',
};

function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function mover(data: Date, dias: number): string {
  const copia = new Date(data.getTime());
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia.toISOString().slice(0, 10);
}

export function feriadosAnoIntegracao(ano: number): string[] {
  const fixos = Object.keys(FER_FIXOS_INTEGRACAO).map((md) => `${ano}-${md}`);
  const p = pascoa(ano);
  return [...fixos, mover(p, -48), mover(p, -47), mover(p, -2), mover(p, 60)];
}

export const FERIADOS_PADRAO_INTEGRACAO = (() => {
  const datas: string[] = [];
  for (let ano = 2025; ano <= 2030; ano += 1) datas.push(...feriadosAnoIntegracao(ano));
  return datas.sort();
})();

const FER_MOVEIS_INTEGRACAO = (() => {
  const nomes: Record<string, string> = {};
  for (let ano = 2025; ano <= 2030; ano += 1) {
    const p = pascoa(ano);
    nomes[mover(p, -48)] = 'Carnaval';
    nomes[mover(p, -47)] = 'Carnaval';
    nomes[mover(p, -2)] = 'Sexta-feira Santa';
    nomes[mover(p, 60)] = 'Corpus Christi';
  }
  return nomes;
})();

export function nomeFeriadoIntegracao(data: string): string {
  return FER_MOVEIS_INTEGRACAO[data] || FER_FIXOS_INTEGRACAO[data.slice(5)] || 'feriado';
}
