import DashboardLayout from "@/components/DashboardLayout";
import AnjoRouteGuard from "@/features/programaIntegracao/components/AnjoRouteGuard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HeartHandshake, Route, Users, MessageCircle, CalendarCheck, ArrowRight, ShieldCheck, Sunrise, Handshake, Compass, Coffee, Milestone, Heart, Lightbulb, Headphones, Eye, Network, Sprout, AlertTriangle, Check, X, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import "@/features/programaIntegracao/styles/acompanhamentoIntegracao.css";

const etapas = [
  {
    id: "antes",
    numero: "01",
    titulo: "Antes do primeiro dia",
    itens: [
      "Conheça quem será o novo colega e entenda, quando possível, sua função e contexto de chegada.",
      "Combine com o gestor como será a recepção e quais apresentações serão mais importantes.",
      "Planeje um primeiro contato simples e acolhedor para que a pessoa saiba que terá uma referência próxima durante a integração.",
    ],
  },
  {
    id: "primeiro-dia",
    numero: "02",
    titulo: "Primeiro dia",
    itens: [
      "Esteja presente e disponível na chegada.",
      "Apresente pessoas, espaços, rotinas e caminhos práticos do dia a dia.",
      "Explique seu papel como Anjo e deixe claro que a pessoa pode procurar você para orientações ao longo da adaptação.",
    ],
  },
  {
    id: "primeira-semana",
    numero: "03",
    titulo: "Primeira semana",
    itens: [
      "Mostre onde encontrar informações, pessoas e recursos importantes.",
      "Compartilhe dicas práticas que ajudem a compreender a rotina e a cultura da equipe.",
      "Mantenha-se disponível para dúvidas e ajude a pessoa a criar conexões.",
    ],
  },
  {
    id: "primeiro-mes",
    numero: "04",
    titulo: "Primeiro mês",
    itens: [
      "Faça contatos rápidos e regulares para saber como está a adaptação.",
      "Reforce aprendizados e ofereça feedbacks positivos sobre avanços observados.",
      "Incentive a integração com colegas e o uso dos canais corretos para cada necessidade.",
    ],
  },
  {
    id: "primeiros-90",
    numero: "05",
    titulo: "Primeiros 90 dias",
    itens: [
      "Mantenha o canal aberto para dúvidas e orientações.",
      "Ajude a pessoa a alinhar expectativas e a encontrar os responsáveis certos quando surgir alguma necessidade.",
      "Continue apoiando a integração e o desenvolvimento, respeitando os papéis formais do gestor, da UGP e da CKM.",
    ],
  },
];

const etapaIcones = [Sunrise, Handshake, Compass, Coffee, Milestone];

const esperado = [
  ["Acolher", "Contribuir para que a chegada e a adaptação sejam mais leves e positivas."],
  ["Orientar", "Compartilhar caminhos, rotinas, referências e informações úteis para o dia a dia."],
  ["Estar disponível", "Ser uma referência acessível para dúvidas e situações comuns da integração."],
  ["Acompanhar", "Manter contato ao longo da jornada e perceber quando a pessoa precisa de apoio."],
  ["Incentivar integração", "Ajudar o colaborador a criar conexões e compreender a cultura da equipe."],
  ["Apoiar desenvolvimento", "Estimular aprendizados e direcionar a pessoa às referências adequadas quando necessário."],
];

const esperadoIcones = [Heart, Lightbulb, Headphones, Eye, Network, Sprout];
const esperadoClasses = ["v-rose", "v-amber", "v-sky", "v-violet", "v-teal", "v-green"];

export default function AnjoOrientacoes() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout>
      <AnjoRouteGuard>
        <div className="pi-acompanhamento pi-anjo-page mx-auto">
          <header className="pi-hero pi-anjo-hero-simple">
            <div className="pi-hero-top">
              <div>
                <span className="pi-eyebrow pi-eyebrow--icon"><AlertTriangle /> Espaço do Anjo</span>
                <h1>Cartilha e Orientações do Anjo</h1>
                <p className="pi-hero-subtitle">Tudo o que você precisa saber para apoiar o colaborador durante sua integração.</p>
              </div>
              <button type="button" className="pi-btn pi-btn--white" onClick={() => setLocation("/anjo/formularios")}>
                Acompanhar integração <ArrowRight />
              </button>
            </div>
          </header>

          <article className="pi-anjo-card pi-anjo-section">
            <div className="pi-anjo-card-head">
              <span className="pi-anjo-icon-tile is-small"><HeartHandshake /></span>
              <h2 className="pi-anjo-card-title">Seu papel na integração</h2>
            </div>
            <div className="pi-anjo-prose">
              <p>Ser um Colaborador Anjo é exercer um papel de acolhimento, conexão e apoio durante o processo de integração. Você será uma das referências do colaborador nesse período, ajudando-o a compreender a equipe, a rotina, os processos e a cultura da organização.</p>
              <div className="pi-anjo-highlight"><strong>O Anjo é um colaborador experiente</strong> que acompanha colegas recém-chegados ou em transição interna, contribuindo para uma adaptação mais acolhedora, positiva e eficiente.</div>
              <p>Seu papel é orientar, apoiar, compartilhar caminhos e estar disponível durante os primeiros momentos da integração.</p>
            </div>
          </article>

          <div className="pi-anjo-quote">
            <span className="pi-anjo-icon-tile is-small"><MessageCircle /></span>
            <p>
              O primeiro dia em um novo ambiente pode ser desafiador. Como Anjo, você será uma das principais referências do colaborador durante sua chegada e adaptação. <strong>Você não precisa ter todas as respostas.</strong> O mais importante é orientar, acolher e ajudar o colaborador a encontrar os caminhos certos.
            </p>
          </div>

          <section className="pi-anjo-section">
            <h2 className="pi-anjo-section-title"><span className="pi-anjo-icon-tile is-small"><Route /></span>Linha do tempo orientativa</h2>
            <Accordion type="single" collapsible className="pi-anjo-timeline">
              {etapas.map((etapa, index) => {
                const EtapaIcone = etapaIcones[index];
                return (
                  <AccordionItem key={etapa.id} value={etapa.id} className="pi-anjo-step">
                    <AccordionTrigger>
                      <span className="flex min-w-0 flex-1 items-center gap-4 text-left">
                        <span className="pi-anjo-step-node"><EtapaIcone /></span>
                        <span className="pi-anjo-step-meta">
                          <span className="pi-anjo-step-num">ETAPA {etapa.numero}</span>
                          <span className="pi-anjo-step-title block">{etapa.titulo}</span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pi-anjo-step-body">
                      <ul className="pi-anjo-checklist">
                        {etapa.itens.map((item) => <li key={item}><Check /><span>{item}</span></li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>

          <section className="pi-anjo-section">
            <h2 className="pi-anjo-section-title"><span className="pi-anjo-icon-tile is-small"><CalendarCheck /></span>O que se espera do Anjo</h2>
            <div className="pi-anjo-values">
              {esperado.map(([titulo, descricao], index) => {
                const EsperadoIcone = esperadoIcones[index];
                return (
                  <article key={titulo} className={"pi-anjo-value " + esperadoClasses[index]}>
                    <span className="pi-anjo-icon-tile"><EsperadoIcone /></span>
                    <h3>{titulo}</h3>
                    <p>{descricao}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <article className="pi-anjo-card pi-anjo-section">
            <div className="pi-anjo-card-head">
              <span className="pi-anjo-icon-tile is-small"><ShieldCheck /></span>
              <h2 className="pi-anjo-card-title">O Anjo não substitui o gestor</h2>
            </div>
            <div className="pi-anjo-boundary">
              <div className="pi-anjo-boundary-col pi-anjo-boundary-do">
                <h4><CheckCircle2 /> Seu papel é</h4>
                <div className="pi-anjo-tags">
                  {["Acolher", "Orientar", "Apoiar", "Integrar", "Acompanhar"].map((item) => (
                    <span className="pi-anjo-tag-ok" key={item}><Check />{item}</span>
                  ))}
                </div>
              </div>
              <div className="pi-anjo-boundary-col pi-anjo-boundary-dont">
                <h4><X /> Não cabe ao Anjo</h4>
                <ul className="pi-anjo-xlist">
                  <li><X /> realizar avaliação formal de desempenho;</li>
                  <li><X /> aplicar medidas disciplinares ou aprovar entregas;</li>
                  <li><X /> exercer gestão formal ou definir metas unilateralmente;</li>
                  <li><X /> assumir a responsabilidade pelo PDI;</li>
                  <li><X /> executar atribuições formais da UGP ou do gestor.</li>
                </ul>
              </div>
            </div>
          </article>

          <article className="pi-anjo-card pi-anjo-section pi-anjo-footer-card">
            <div>
              <p className="pi-anjo-footer-title">Precisa conferir seus formulários?</p>
              <p className="pi-anjo-footer-subtitle">Veja seus formulários e a evolução das avaliações que você já respondeu.</p>
            </div>
            <button type="button" className="pi-btn pi-btn--primary" onClick={() => setLocation("/anjo/formularios")}>
              <Users className="h-4 w-4" /> Acompanhar integração <ArrowRight />
            </button>
          </article>
        </div>
      </AnjoRouteGuard>
    </DashboardLayout>
  );
}
