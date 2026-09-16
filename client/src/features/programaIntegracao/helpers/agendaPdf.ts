import jsPDF from 'jspdf';
import type { ProcessoIntegracao } from '../types';
import { cronogramaReal } from './painelAcoes';

interface BlocoAgenda {
  tag: string;
  data: string;
  titulo: string;
  grupos: Array<[string, string[]]>;
}

function primeiro(nome: string): string {
  return String(nome || '').trim().split(/\s+/)[0] || '—';
}

function dataBr(iso: string): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

function nomeArquivo(nome: string): string {
  return String(nome || 'colaborador')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Conteúdo funcional da Agenda do HTML original.
 * As datas vêm do mesmo cronograma real usado pelo Painel, inclusive feriados
 * e datas confirmadas dos alinhamentos.
 */
export function agendaBlocosReal(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
): BlocoAgenda[] {
  const datas = Object.fromEntries(
    cronogramaReal(processo, feriados).map((etapa) => [etapa.et.id, etapa.data]),
  );
  const gestor = processo.gestor || '—';
  const anjo = processo.anjo || '—';
  const colaborador = primeiro(processo.nome);

  return [
    {
      tag: '1º DIA', data: datas.d1 || '', titulo: 'Entrada na unidade', grupos: [
        [`Gestor · ${gestor}`, [
          'Ser o anfitrião na recepção, no Sebrae/TO Jeito de Ser.',
          'Informar todos os colaboradores veteranos sobre a chegada do novo colaborador.',
        ]],
        ['UGP', ['Executar as Boas-Vindas da Unidade Sebrae/TO no final do primeiro dia.']],
        [`Colaborador · ${colaborador}`, ['Participar da recepção e das atividades de boas-vindas.']],
      ],
    },
    {
      tag: '2º DIA', data: datas.d2 || '', titulo: 'Continuidade das boas-vindas', grupos: [
        [`Gestor, Anjo (${anjo}) e UGP`, [
          'Executar as Boas-Vindas da Unidade Sebrae/TO para o segundo dia.',
          'Apoiar os primeiros contatos e apresentações na unidade.',
        ]],
        ['CKM Talents', ['Entregar esta Agenda de Onboarding ao colaborador e ao gestor.']],
        [`Colaborador · ${colaborador}`, [
          'Participar das atividades de boas-vindas e integração.',
          'Ler a agenda e esclarecer dúvidas com o gestor ou com a CKM Talents.',
        ]],
      ],
    },
    {
      tag: '3º DIA', data: datas.d3 || '', titulo: 'Plataforma do Ecossistema do B.E.M.: Avaliação de Potencial e Jornada Compliance', grupos: [
        ['CKM Talents', [
          'Liberar o acesso do colaborador na plataforma do Ecossistema do B.E.M.',
          'Enviar o e-mail de primeiros passos com as orientações.',
        ]],
        [`Colaborador · ${colaborador}`, [
          'Receber o e-mail de acesso da plataforma. Se não chegar, conferir o spam e avisar a CKM.',
          'Realizar a Avaliação de Potencial — é o primeiro passo e serve de base para o PDI.',
          'Iniciar a Jornada Compliance, liberada automaticamente ao concluir a Avaliação de Potencial.',
        ]],
      ],
    },
    {
      tag: '15º DIA', data: datas.d15 || '', titulo: '1º Alinhamento — construção do PDI', grupos: [
        [`Gestor · ${gestor}`, [
          'Participar do 1º Feedback (Alinhamento).',
          'Responder o Formulário de Avaliação do Programa de Integração após o feedback.',
        ]],
        ['CKM Talents', [
          'Acompanhar e mediar o feedback.',
          'Elaborar o PDI da Integração e publicá-lo na plataforma do Ecossistema do B.E.M.',
          'Enviar os formulários ao gestor, ao Anjo e ao colaborador.',
        ]],
        [`Anjo · ${anjo}`, ['Responder o Formulário de Avaliação do Programa de Integração.']],
        [`Colaborador · ${colaborador}`, [
          'Participar ativamente do 1º Feedback, apresentando percepções e dúvidas.',
          'Responder a Pesquisa de Integração.',
          'Acessar o PDI na plataforma do Ecossistema do B.E.M. e iniciar as ações previstas.',
        ]],
      ],
    },
    {
      tag: '45º DIA', data: datas.d45 || '', titulo: '2º Alinhamento — acompanhamento do PDI', grupos: [
        [`Gestor · ${gestor}`, [
          'Realizar o 2º Feedback.',
          'Apresentar as atividades e projetos do 31º ao 140º dia de trabalho.',
          'Propor mudanças no PDI, caso necessário.',
          'Responder o Formulário de Avaliação do Programa de Integração.',
        ]],
        ['CKM Talents', ['Acompanhar e mediar o feedback.', 'Verificar o status das ações do PDI.']],
        [`Anjo · ${anjo}`, ['Responder o Formulário de Avaliação do Programa de Integração.']],
        [`Colaborador · ${colaborador}`, [
          'Participar do 2º Feedback, apresentando progressos e desafios.',
          'Responder a Pesquisa de Integração.',
          'Manter as ações do PDI registradas na plataforma.',
        ]],
      ],
    },
    {
      tag: '60º DIA', data: datas.d60 || '', titulo: 'Certificado de Participação do Anjo', grupos: [
        ['UGP / CKM Talents', [`Preparar o Certificado de Participação do Anjo — ${anjo}.`]],
        ['Gestor e colaborador', ['Agradecer e reconhecer o apoio do Anjo durante o período de integração.']],
      ],
    },
    {
      tag: '75º DIA', data: datas.d75 || '', titulo: '3º Alinhamento — evolução e continuidade', grupos: [
        [`Gestor · ${gestor}`, [
          'Realizar o 3º Feedback com o Núcleo de Capacitação e Desenvolvimento/UGP.',
          `Organizar a comemoração do Anjo ${anjo} por concluir o período de orientação.`,
          'Responder o Formulário de Avaliação do Programa de Integração.',
        ]],
        ['CKM Talents', ['Acompanhar e mediar o feedback.']],
        [`Anjo · ${anjo}`, ['Responder o Formulário de Avaliação do Programa de Integração.']],
        [`Colaborador · ${colaborador}`, [
          'Participar do 3º Feedback, apresentando progressos e desafios.',
          'Responder a Pesquisa de Integração.',
          'Concluir a Jornada Compliance.',
          'Participar da comemoração do Anjo.',
        ]],
      ],
    },
    {
      tag: '150º DIA', data: datas.d150 || '', titulo: '4º Alinhamento e encerramento do Onboarding', grupos: [
        [`Gestor · ${gestor}`, [
          'Realizar o 4º Feedback e finalizar o Plano de Desenvolvimento Individual.',
          'Responder o Formulário de Avaliação do Programa de Integração.',
          'Organizar a comemoração pela conclusão do Onboarding.',
        ]],
        ['CKM Talents', ['Acompanhar e mediar o feedback.']],
        [`Anjo · ${anjo}`, ['Responder o último Formulário de Avaliação do Programa de Integração.']],
        [`Colaborador · ${colaborador}`, [
          'Participar do 4º Feedback, apresentando resultados e aprendizados.',
          'Responder a última Pesquisa de Integração.',
          'Participar da comemoração de conclusão do Onboarding.',
        ]],
      ],
    },
  ];
}

function adicionarCabecalho(doc: jsPDF, processo: ProcessoIntegracao) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Agenda de Onboarding', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('CKM Talents · Consultoria de integração · Parceira do Sebrae/TO', 14, 24);
  doc.setDrawColor(200, 54, 60);
  doc.setLineWidth(0.8);
  doc.line(14, 27, 196, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(processo.nome || 'Colaborador', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const email = processo.emailCorporativo || processo.email || '—';
  const dados = [
    `Cargo: ${processo.cargo || '—'}`,
    `Área: ${processo.unidade || '—'}`,
    `Participação: ${processo.part || '—'}`,
    `E-mail: ${email}`,
    `Gestor receptor: ${processo.gestor || '—'}`,
    `Anjo: ${processo.anjo || '—'}`,
    `1º dia na unidade: ${dataBr(processo.inicio)}`,
  ];
  let y = 41;
  dados.forEach((linha) => {
    doc.text(linha, 14, y);
    y += 4.2;
  });
  return y + 2;
}

function rodape(doc: jsPDF, processo: ProcessoIntegracao) {
  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(225, 225, 225);
    doc.line(14, 282, 196, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(`Agenda de Onboarding · ${processo.nome}`, 14, 287);
    doc.text(`${pagina}/${paginas}`, 196, 287, { align: 'right' });
  }
}

/** Gera e baixa a Agenda de Onboarding sem gravar ou alterar qualquer dado. */
export function gerarAgendaOnboardingPdf(
  processo: ProcessoIntegracao,
  feriados: string[] = [],
): void {
  if (!processo?.nome) throw new Error('Preencha o nome do colaborador antes de gerar a agenda.');
  if (!processo?.inicio) throw new Error('Preencha a data do primeiro dia na unidade antes de gerar a agenda.');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const blocos = agendaBlocosReal(processo, feriados);
  const fim = blocos[blocos.length - 1]?.data || '';
  let y = adicionarCabecalho(doc, processo);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 75);
  const periodo = `Período previsto: ${dataBr(processo.inicio)} a ${dataBr(fim)}`;
  doc.text(periodo, 14, y);
  y += 7;

  const intro = 'Esta agenda organiza as etapas do processo de integração ao Sebrae/TO, do primeiro dia na unidade até o 150º dia, indicando o que acontece em cada marco e o que se espera do colaborador, do gestor, do Anjo, da UGP e da CKM Talents. As datas são previstas e podem ser ajustadas conforme a disponibilidade da unidade — a confirmação de cada alinhamento será enviada por e-mail.';
  const introLinhas = doc.splitTextToSize(intro, 182);
  doc.text(introLinhas, 14, y);
  y += introLinhas.length * 3.8 + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text('LINHA DO TEMPO · DATAS PREVISTAS', 14, y);
  y += 5;

  for (const bloco of blocos) {
    const estimarAltura = () => {
      let h = 15;
      bloco.grupos.forEach(([responsavel, itens]) => {
        h += 4;
        doc.setFontSize(8.2);
        itens.forEach((texto) => { h += doc.splitTextToSize(texto, 145).length * 3.8 + 1; });
      });
      return h;
    };

    const altura = estimarAltura();
    if (y + altura > 278) {
      doc.addPage();
      y = 16;
    }

    doc.setTextColor(30, 40, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(bloco.tag, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(dataBr(bloco.data), 14, y + 4);

    const x = 46;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.2);
    const titulo = doc.splitTextToSize(bloco.titulo, 148);
    doc.text(titulo, x, y);
    let yy = y + titulo.length * 4.1 + 2;

    bloco.grupos.forEach(([responsavel, itens]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(180, 45, 52);
      doc.text(responsavel.toUpperCase(), x, yy);
      yy += 3.6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(45, 55, 65);
      itens.forEach((texto) => {
        const linhas = doc.splitTextToSize(texto, 144);
        doc.text('•', x, yy);
        doc.text(linhas, x + 4, yy);
        yy += linhas.length * 3.8 + 1;
      });
      yy += 1;
    });

    y = Math.max(yy + 3, y + 16);
    doc.setDrawColor(232, 232, 232);
    doc.line(14, y - 1.5, 196, y - 1.5);
    y += 3;
  }

  rodape(doc, processo);
  doc.save(`Agenda Onboarding - ${nomeArquivo(processo.nome)}.pdf`);
}
