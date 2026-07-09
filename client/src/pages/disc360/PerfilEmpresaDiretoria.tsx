import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Pencil, Power, ClipboardList, ChevronDown, Eye, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ContadorRespondentes from "@/components/disc360/ContadorRespondentes";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SelecaoRespondentesCultura from "@/components/disc360/SelecaoRespondentesCultura";
import SelecaoDiretores from "@/components/disc360/SelecaoDiretores";

type ProfileType = "empresa" | "diretoria";

type FormState = {
  profileType: ProfileType;
  editingId: number | null;
  profileName: string;
  scoreD: string;
  scoreI: string;
  scoreS: string;
  scoreC: string;
  perfilDesejado: string;
  culturalDescription: string;
  competencias: string;
};

function emptyForm(profileType: ProfileType): FormState {
  return {
    profileType,
    editingId: null,
    profileName: "",
    scoreD: "",
    scoreI: "",
    scoreS: "",
    scoreC: "",
    perfilDesejado: "",
    culturalDescription: "",
    competencias: "",
  };
}

const STATUS_LABELS: Record<string, string> = {
  previa: "Prévia (aguardando mais respostas)",
  suficiente: "Consolidado (base suficiente)",
};

const CONCORDANCIA_LABELS: Record<string, string> = {
  alta: "Alta concordância",
  media: "Concordância média",
  baixa: "Baixa concordância",
};

export default function PerfilEmpresaDiretoria() {
  return (
    <DashboardLayout>
      <PerfilEmpresaDiretoriaContent />
    </DashboardLayout>
  );
}

function PerfilEmpresaDiretoriaContent() {
  const [programId, setProgramId] = useState("");
  const numericProgramId = programId ? Number(programId) : undefined;
  const [activeTab, setActiveTab] = useState<ProfileType>("empresa");
  const [empresaModo, setEmpresaModo] = useState<"escolha" | "questionario" | "manual">("escolha");
  const [form, setForm] = useState<FormState>(emptyForm("empresa"));
  const [questionarioOrgProfileId, setQuestionarioOrgProfileId] = useState<number | null>(null);
  const [perfilAcoesDialogAberto, setPerfilAcoesDialogAberto] = useState(false);
  const [previewQuestionarioAberto, setPreviewQuestionarioAberto] = useState(false);
  const { data: perguntasPreviewRow = [] } = trpc.disc360.getCultureQuestions.useQuery(undefined, { enabled: previewQuestionarioAberto });
  const questionarioSectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (questionarioOrgProfileId) {
      questionarioSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [questionarioOrgProfileId]);
  const [diretoriaSelecionadaId, setDiretoriaSelecionadaId] = useState<number | null>(null);
  const [nomeNovaDiretoria, setNomeNovaDiretoria] = useState("");
  const [mostrarFormularioPerguntas, setMostrarFormularioPerguntas] = useState(false);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);

  const { data: empresas = [] } = trpc.admin.listEmpresas.useQuery();

  const {
    data: perfis = [],
    isLoading: loadingPerfis,
    refetch: refetchPerfis,
  } = trpc.disc360.listOrgProfiles.useQuery(
    { programId: numericProgramId as number, includeInactive: true },
    { enabled: !!numericProgramId }
  );

  const perfisEmpresa = perfis.filter((p: any) => p.profileType === "empresa");
  const perfisDiretoria = perfis.filter((p: any) => p.profileType === "diretoria");

  const {
    data: assessmentsCultura = [],
    refetch: refetchAssessments,
  } = trpc.disc360.listCultureAssessments.useQuery(
    { orgProfileId: questionarioOrgProfileId as number },
    { enabled: !!questionarioOrgProfileId }
  );

  const {
    data: previa,
    refetch: refetchPrevia,
    isFetching: carregandoPrevia,
  } = trpc.disc360.previewCultureConsolidation.useQuery(
    { orgProfileId: questionarioOrgProfileId as number },
    { enabled: false }
  );

  const resetForm = () => {
    setForm(emptyForm(activeTab));
  };

  const createMutation = trpc.disc360.createOrgProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil criado com sucesso.");
      refetchPerfis();
    },
    onError: (err) => toast.error("Erro ao criar perfil: " + err.message),
  });

  const updateMutation = trpc.disc360.updateOrgProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso.");
      refetchPerfis();
    },
    onError: (err) => toast.error("Erro ao atualizar perfil: " + err.message),
  });

  const consolidarMutation = trpc.disc360.consolidateOrgProfileFromCulture.useMutation({
    onSuccess: () => {
      toast.success("Perfil Oficial da Empresa validado e consolidado.");
      refetchPerfis();
      setMostrarPrevia(false);
    },
    onError: (err) => toast.error("Erro ao consolidar perfil: " + err.message),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericProgramId) {
      toast.error("Selecione um programa/empresa.");
      return;
    }
    if (!form.profileName.trim()) {
      toast.error("Informe o nome do perfil.");
      return;
    }
    const scoreD = Number(form.scoreD) || 0;
    const scoreI = Number(form.scoreI) || 0;
    const scoreS = Number(form.scoreS) || 0;
    const scoreC = Number(form.scoreC) || 0;
    const soma = scoreD + scoreI + scoreS + scoreC;
    if (Math.abs(soma - 100) > 0.5) {
      toast.error("A soma de D + I + S + C precisa ser igual a 100% (soma atual: " + soma.toFixed(1) + "%).");
      return;
    }
    const competencias = form.competencias
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const payload = {
      programId: numericProgramId,
      profileType: form.profileType,
      profileName: form.profileName.trim(),
      expectedScores: { D: scoreD, I: scoreI, S: scoreS, C: scoreC },
      perfilDesejado: form.perfilDesejado.trim() || undefined,
      culturalDescription: form.culturalDescription.trim() || undefined,
      competencias,
    };
    if (form.editingId) {
      updateMutation.mutate(
        { id: form.editingId, ...payload },
        {
          onSuccess: () => {
            resetForm();
            setEmpresaModo("escolha");
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          resetForm();
          setEmpresaModo("escolha");
        },
      });
    }
  };

  const handleEdit = (perfil: any) => {
    const scores = perfil.expectedScores || {};
    setForm({
      profileType: perfil.profileType,
      editingId: perfil.id,
      profileName: perfil.profileName || "",
      scoreD: String(scores.D ?? ""),
      scoreI: String(scores.I ?? ""),
      scoreS: String(scores.S ?? ""),
      scoreC: String(scores.C ?? ""),
      perfilDesejado: perfil.perfilDesejado || "",
      culturalDescription: perfil.culturalDescription || "",
      competencias: Array.isArray(perfil.competencias) ? perfil.competencias.join(", ") : "",
    });
    if (perfil.profileType === "empresa") {
      setEmpresaModo("manual");
    }
  };

  const handleToggleActive = (perfil: any) => {
    updateMutation.mutate({ id: perfil.id, isActive: perfil.isActive !== 1 });
  };

  const handleIniciarQuestionario = () => {
    if (!numericProgramId) {
      toast.error("Selecione um programa/empresa.");
      return;
    }
    if (!form.profileName.trim()) {
      toast.error("Informe o nome do perfil.");
      return;
    }
    createMutation.mutate(
      {
        programId: numericProgramId,
        profileType: "empresa",
        profileName: form.profileName.trim(),
      },
      {
        onSuccess: (data: any) => {
          setQuestionarioOrgProfileId(data.id);
          resetForm();
          setEmpresaModo("escolha");
        },
      }
    );
  };

  const handleCriarDiretoria = () => {
    if (!numericProgramId) {
      toast.error("Selecione um programa/empresa.");
      return;
    }
    if (!nomeNovaDiretoria.trim()) {
      toast.error("Informe o nome do perfil de Diretoria.");
      return;
    }
    createMutation.mutate(
      {
        programId: numericProgramId,
        profileType: "diretoria",
        profileName: nomeNovaDiretoria.trim(),
      },
      {
        onSuccess: (data: any) => {
          setDiretoriaSelecionadaId(data.id);
          setNomeNovaDiretoria("");
        },
      }
    );
  };

  const handleVerPrevia = () => {
    setMostrarPrevia(true);
    refetchPrevia();
  };

  const handleValidarOficial = () => {
    if (!questionarioOrgProfileId) return;
    consolidarMutation.mutate({ orgProfileId: questionarioOrgProfileId });
  };
  const renderTabelaPerfis = (lista: any[]) => {
    if (loadingPerfis) return <p className="text-sm text-muted-foreground">Carregando...</p>;
    if (lista.length === 0) return <p className="text-sm text-muted-foreground">Nenhum perfil cadastrado ainda.</p>;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>D/I/S/C</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Consistência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lista.map((perfil: any) => {
            const scores = perfil.expectedScores || {};
            return (
              <TableRow key={perfil.id}>
                <TableCell>{perfil.profileName}</TableCell>
                <TableCell>{scores.D ?? 0}/{scores.I ?? 0}/{scores.S ?? 0}/{scores.C ?? 0}</TableCell>
                <TableCell>{perfil.perfilDesejado || "-"}</TableCell>
                <TableCell className="capitalize">{perfil.origemPerfil || "-"}</TableCell>
                <TableCell>{perfil.statusConsistencia ? (STATUS_LABELS[perfil.statusConsistencia] || perfil.statusConsistencia) + (perfil.totalRespondentes ? " (" + perfil.totalRespondentes + " resp.)" : "") : "-"}</TableCell>
                <TableCell>
                  {perfil.isActive === 1 ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {perfil.profileType === "empresa" && perfil.origemPerfil === "questionario" && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setPreviewQuestionarioAberto(true)} title="Visualizar questionário">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { setQuestionarioOrgProfileId(perfil.id); setPerfilAcoesDialogAberto(true); }} title="Selecionar respondentes e ver resultado">
                                <Users className="h-4 w-4" />
                              </Button>
                            </div>
                            <ContadorRespondentes orgProfileId={perfil.id} />
                          </div>
                        )}{perfil.profileType === "diretoria" && (
                    <Button variant="ghost" size="icon" onClick={() => setDiretoriaSelecionadaId(perfil.id)} title="Selecionar diretores">
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(perfil)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleToggleActive(perfil)} title="Ativar/Inativar">
                    <Power className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderFormularioManual = () => (
    <form onSubmit={handleSubmitManual} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do perfil</Label>
        <Input value={form.profileName} onChange={(e) => setForm((f) => ({ ...f, profileName: e.target.value }))} placeholder="Ex: Cultura Geral da Empresa, Diretoria Comercial..." />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2"><Label>D (%)</Label><Input type="number" min={0} max={100} value={form.scoreD} onChange={(e) => setForm((f) => ({ ...f, scoreD: e.target.value }))} /></div>
        <div className="space-y-2"><Label>I (%)</Label><Input type="number" min={0} max={100} value={form.scoreI} onChange={(e) => setForm((f) => ({ ...f, scoreI: e.target.value }))} /></div>
        <div className="space-y-2"><Label>S (%)</Label><Input type="number" min={0} max={100} value={form.scoreS} onChange={(e) => setForm((f) => ({ ...f, scoreS: e.target.value }))} /></div>
        <div className="space-y-2"><Label>C (%)</Label><Input type="number" min={0} max={100} value={form.scoreC} onChange={(e) => setForm((f) => ({ ...f, scoreC: e.target.value }))} /></div>
      </div>
      <p className="text-xs text-muted-foreground">A soma de D + I + S + C precisa fechar em 100%.</p>
      <div className="space-y-2"><Label>Perfil desejado (ex: D/I, S/C...)</Label><Input value={form.perfilDesejado} onChange={(e) => setForm((f) => ({ ...f, perfilDesejado: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Descrição da cultura desejada</Label><Textarea rows={3} value={form.culturalDescription} onChange={(e) => setForm((f) => ({ ...f, culturalDescription: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Competências valorizadas (separadas por vírgula)</Label><Input value={form.competencias} onChange={(e) => setForm((f) => ({ ...f, competencias: e.target.value }))} placeholder="Ex: Colaboração, Inovação, Orientação a resultados" /></div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>{form.editingId ? "Salvar alterações" : "Cadastrar perfil"}</Button>
        <Button type="button" variant="outline" onClick={() => { resetForm(); setEmpresaModo("escolha"); }}>Cancelar</Button>
      </div>
    </form>
  );
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfis DISC — Empresa e Diretoria</h1>
        <p className="text-muted-foreground">Defina o Perfil DISC desejado da Empresa e das Diretorias para comparação com colaboradores.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-sm">
            <Label>Programa / Empresa</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger><SelectValue placeholder="Selecione o programa" /></SelectTrigger>
              <SelectContent>
                {empresas.map((e: any) => (<SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!programId ? (
        <p className="text-sm text-muted-foreground">Selecione um programa/empresa para continuar.</p>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ProfileType); resetForm(); }}>
          <TabsList>
            <TabsTrigger value="empresa">Perfil da Empresa</TabsTrigger>
            <TabsTrigger value="diretoria">Perfil da Diretoria</TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sobre o Perfil DISC da Empresa</CardTitle>
                <CardDescription>
                  O Perfil DISC da Empresa representa a cultura comportamental desejada da organização. Ele pode ser calculado por meio de um questionário respondido por profissionais elegíveis ou preenchido manualmente quando a empresa já possuir essa definição.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {empresaModo === "escolha" && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => { resetForm(); setEmpresaModo("questionario"); }}>
                      <ClipboardList className="h-4 w-4 mr-2" /> Aplicar questionário de cultura
                    </Button>
                    <Button variant="outline" onClick={() => { resetForm(); setForm((f) => ({ ...f, profileType: "empresa" })); setEmpresaModo("manual"); }}>
                      Preencher manualmente
                    </Button>
                  </div>
                )}

                {empresaModo === "manual" && renderFormularioManual()}

                {empresaModo === "questionario" && !questionarioOrgProfileId && (
                  <div className="space-y-3 max-w-md">
                    <div className="space-y-2">
                      <Label>Nome do perfil (ex: Cultura Geral 2026)</Label>
                      <Input value={form.profileName} onChange={(e) => setForm((f) => ({ ...f, profileName: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleIniciarQuestionario} disabled={isSaving}>Criar Perfil da Empresa</Button>
                      <Button variant="outline" onClick={() => setEmpresaModo("escolha")}>Voltar</Button>
                    </div>
                  </div>
                )}

                {perfilAcoesDialogAberto && questionarioOrgProfileId && (
                  <Dialog open={perfilAcoesDialogAberto} onOpenChange={setPerfilAcoesDialogAberto}>
                  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden" style={{ maxWidth: "48rem", width: "95vw" }}>
                  <div ref={questionarioSectionRef} className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm text-muted-foreground">
                        {assessmentsCultura.length} resposta(s) registrada(s) até o momento. Mínimo recomendado: 5 respondentes.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMostrarFormularioPerguntas((v) => !v)}>
                          {mostrarFormularioPerguntas ? "Ocultar seleção de respondentes" : "Selecionar respondentes"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleVerPrevia} disabled={carregandoPrevia}>
                          Ver prévia do resultado
                        </Button>
                        <Button size="sm" onClick={handleValidarOficial} disabled={consolidarMutation.isPending || assessmentsCultura.length < 5}>
                          Validar Perfil Oficial
                        </Button>
                      </div>
                    </div>

                    {mostrarFormularioPerguntas && numericProgramId && questionarioOrgProfileId && (
                            <SelecaoRespondentesCultura
                                programId={numericProgramId}
                                orgProfileId={questionarioOrgProfileId}
                            />
                        )}

                        {mostrarPrevia && previa && (
                      <Card className="bg-muted/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Prévia do resultado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>D {previa.scoresMedios?.D ?? 0}% · I {previa.scoresMedios?.I ?? 0}% · S {previa.scoresMedios?.S ?? 0}% · C {previa.scoresMedios?.C ?? 0}%</p>
                          <p>Perfil sugerido: <strong>{previa.perfilSugerido}</strong></p>
                          <p>Situação: {STATUS_LABELS[previa.statusConsistencia] || previa.statusConsistencia}</p>
                          <p>Grau de concordância: {CONCORDANCIA_LABELS[previa.classificacaoConcordancia] || previa.classificacaoConcordancia}</p>
                          <p className="text-muted-foreground">{previa.textoConcordancia}</p>
                        </CardContent>
                      </Card>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => setPerfilAcoesDialogAberto(false)}>
                      Fechar
                    </Button>
                  </div>
                    </DialogContent>
                    </Dialog>
                )}

                    {previewQuestionarioAberto && (
                    <Dialog open={previewQuestionarioAberto} onOpenChange={setPreviewQuestionarioAberto}>
                      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden" style={{ maxWidth: "48rem", width: "95vw" }}>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">Questionário de Cultura da Empresa</h3>
                          <p className="text-sm text-muted-foreground">Perguntas que os respondentes selecionados irão receber (somente visualização).</p>
                          {perguntasPreviewRow.map((p: any, idx: number) => (
                        <div key={p.id ?? idx} className="border rounded-md p-4 space-y-2">
                          <p className="text-xs text-muted-foreground">Bloco {idx + 1}{p.tema ? (" · " + p.tema) : ""}</p>
                          <p className="text-sm font-medium">{p.pergunta ?? p.texto ?? p.text}</p>
                          {p.objetivo && (
                            <p className="text-xs text-muted-foreground leading-relaxed">O que esta pergunta avalia: {p.objetivo}</p>
                          )}
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(p.alternativas ?? []).map((alt: any, altIdx: number) => (
                              <div key={alt.id ?? altIdx} className="border rounded-md p-2">
                                <span
                                  className="inline-block text-xs font-medium px-2 py-0.5 rounded mb-1"
                                  style={{
                                    backgroundColor: ({ D: "#FAECE7", I: "#FAEEDA", S: "#E1F5EE", C: "#E6F1FB" } as Record<string, string>)[alt.dimensao] ?? "var(--muted)",
                                    color: ({ D: "#712B13", I: "#633806", S: "#085041", C: "#0C447C" } as Record<string, string>)[alt.dimensao] ?? "inherit",
                                  }}
                                >
                                  {alt.dimensao} · {({ D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" } as Record<string, string>)[alt.dimensao] ?? alt.dimensao}
                                </span>
                                <p className="text-sm">{alt.texto}</p>
                                {alt.explicacao && (
                                  <p className="text-xs text-muted-foreground mt-1">{alt.explicacao}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Perfis de Empresa cadastrados</CardTitle></CardHeader>
              <CardContent>{renderTabelaPerfis(perfisEmpresa)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diretoria" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sobre o Perfil DISC da Diretoria</CardTitle>
                <CardDescription>
                  O Perfil DISC da Diretoria é calculado a partir dos perfis DISC individuais dos diretores vinculados à área, permitindo identificar a predominância comportamental, o grau de similaridade entre os líderes e o estilo diretivo predominante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Como o cálculo funciona:</strong> o Perfil DISC da Diretoria é a média dos perfis DISC individuais dos diretores selecionados para esta área. Além da média, o sistema calcula o grau de concordância entre eles — ou seja, o quanto os estilos de liderança dos diretores selecionados se parecem entre si. Concordância alta indica um time diretivo com estilo de liderança coeso; concordância baixa indica estilos bem diferentes entre os diretores.
                  </p>
                  <p>
                    <strong className="text-foreground">Como escolher os profissionais:</strong> selecione apenas pessoas que ocupam o cargo de Diretor(a) nesta área e que já tenham respondido ao DISC individual. Inclua todos os diretores relevantes da área — quanto mais diretores incluídos, mais representativo é o resultado. Evite selecionar diretores de outras áreas ou pessoas em cargos diferentes de Diretor.
                  </p>
                  <p className="italic">
                    A seleção dos diretores e a busca automática dos DISCs individuais usam o DISC que a pessoa já respondeu na plataforma.
                  </p>
                </div>

                {!diretoriaSelecionadaId ? (
                  <div className="space-y-2 max-w-md">
                    <Label className="text-xs">Nome do perfil de Diretoria</Label>
                    <Input value={nomeNovaDiretoria} onChange={(e) => setNomeNovaDiretoria(e.target.value)} placeholder="Ex: Diretoria Comercial" />
                    <Button size="sm" onClick={handleCriarDiretoria} disabled={isSaving}>
                      Criar e selecionar diretores
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Selecionando diretores para este perfil</p>
                      <Button variant="ghost" size="sm" onClick={() => setDiretoriaSelecionadaId(null)}>Fechar</Button>
                    </div>
                    {numericProgramId && <SelecaoDiretores programId={numericProgramId} orgProfileId={diretoriaSelecionadaId} />}
                  </div>
                )}

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ChevronDown className="h-4 w-4 mr-1" /> Parametrização manual excepcional
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <p className="text-xs text-muted-foreground mb-3">Use apenas em caráter excepcional, quando o valor da Diretoria já for conhecido e não precisar ser calculado a partir dos diretores.</p>
                    {form.profileType === "diretoria" ? renderFormularioManual() : (
                      <Button variant="outline" size="sm" onClick={() => { resetForm(); setForm((f) => ({ ...f, profileType: "diretoria" })); }}>
                        Preencher manualmente
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Perfis de Diretoria cadastrados</CardTitle></CardHeader>
              <CardContent>{renderTabelaPerfis(perfisDiretoria)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}