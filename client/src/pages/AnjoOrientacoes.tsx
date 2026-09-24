import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, Route, Users, MessageCircle, CalendarCheck, ArrowRight, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

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

const esperado = [
  ["Acolher", "Contribuir para que a chegada e a adaptação sejam mais leves e positivas."],
  ["Orientar", "Compartilhar caminhos, rotinas, referências e informações úteis para o dia a dia."],
  ["Estar disponível", "Ser uma referência acessível para dúvidas e situações comuns da integração."],
  ["Acompanhar", "Manter contato ao longo da jornada e perceber quando a pessoa precisa de apoio."],
  ["Incentivar integração", "Ajudar o colaborador a criar conexões e compreender a cultura da equipe."],
  ["Apoiar desenvolvimento", "Estimular aprendizados e direcionar a pessoa às referências adequadas quando necessário."],
];

export default function AnjoOrientacoes() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border bg-gradient-to-br from-violet-50 via-background to-cyan-50 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="outline">Espaço do Anjo</Badge>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">Cartilha e Orientações do Anjo</h1>
              <p className="mt-2 text-sm text-muted-foreground">Tudo o que você precisa saber para apoiar o colaborador durante sua integração.</p>
            </div>
            <Button type="button" onClick={() => setLocation("/anjo/formularios")}>
              Acompanhar meus formulários <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HeartHandshake className="h-5 w-5" />Seu papel na integração</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            <p>Ser um Colaborador Anjo é exercer um papel de acolhimento, conexão e apoio durante o processo de integração. Você será uma das referências do colaborador nesse período, ajudando-o a compreender a equipe, a rotina, os processos e a cultura da organização.</p>
            <p><strong>O Anjo é um colaborador experiente</strong> que acompanha colegas recém-chegados ou em transição interna, contribuindo para uma adaptação mais acolhedora, positiva e eficiente.</p>
            <p>Seu papel é orientar, apoiar, compartilhar caminhos e estar disponível durante os primeiros momentos da integração.</p>
          </CardContent>
        </Card>

        <Alert>
          <MessageCircle className="h-4 w-4" />
          <AlertDescription>
            O primeiro dia em um novo ambiente pode ser desafiador. Como Anjo, você será uma das principais referências do colaborador durante sua chegada e adaptação. Você não precisa ter todas as respostas. O mais importante é orientar, acolher e ajudar o colaborador a encontrar os caminhos certos.
          </AlertDescription>
        </Alert>

        <div>
          <div className="mb-3 flex items-center gap-2"><Route className="h-5 w-5" /><h2 className="text-xl font-semibold">Linha do tempo orientativa</h2></div>
          <Accordion type="single" collapsible className="space-y-2">
            {etapas.map((etapa) => (
              <AccordionItem key={etapa.id} value={etapa.id} className="rounded-lg border px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-3 text-left"><span className="text-xs font-bold text-violet-600">{etapa.numero}</span><span>{etapa.titulo}</span></span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-2 text-sm text-muted-foreground">
                    {etapa.itens.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2"><CalendarCheck className="h-5 w-5" /><h2 className="text-xl font-semibold">O que se espera do Anjo</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {esperado.map(([titulo, descricao]) => (
              <Card key={titulo}><CardContent className="pt-5"><p className="font-semibold">{titulo}</p><p className="mt-1 text-sm text-muted-foreground">{descricao}</p></CardContent></Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />O Anjo não substitui o gestor</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">Seu papel é:</p>
              <p className="text-sm text-muted-foreground">acolher, orientar, apoiar, integrar e acompanhar.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Não cabe ao Anjo:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• realizar avaliação formal de desempenho;</li>
                <li>• aplicar medidas disciplinares ou aprovar entregas;</li>
                <li>• exercer gestão formal ou definir metas unilateralmente;</li>
                <li>• assumir a responsabilidade pelo PDI;</li>
                <li>• executar atribuições formais da UGP ou do gestor.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold">Precisa conferir seus formulários?</p><p className="text-sm text-muted-foreground">Veja o que está aguardando liberação, pendente ou já respondido.</p></div>
            <Button type="button" variant="outline" onClick={() => setLocation("/anjo/formularios")}><Users className="mr-2 h-4 w-4" />Acompanhar formulários</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
