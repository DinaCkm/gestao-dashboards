import { useState, useRef } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  BookOpen,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Eye,
  ChevronLeft,
  FileText,
  Search,
} from "lucide-react";

// ============ TIPOS ============
type StatusFicha = "rascunho" | "publicada" | "inativa";

type CompetenciaListItem = {
  id: number;
  nome: string;
  trilhaNome: string;
  trilhaId: number;
  isActive: number;
  fichaCompetencia: { id: number; status: StatusFicha; updatedAt: Date } | null;
  totalConteudos: number;
  fichasConteudoPublicadas: number;
  fichasConteudoTotal: number;
  ultimaAtualizacao: Date | null;
};

type FichaCompetencia = {
  id: number;
  competenciaId: number;
  linhaDesenvolvimento: string;
  objetivoPedagogico: string;
  oQueEnsina: string;
  quandoIndicar: string;
  sinaisObservaveis: string;
  cuidadoIndicacao?: string | null;
  resumoMentor: string;
  descricaoAluno: string;
  sugestaoDesenvolvimentoCompetencia: string;
  status: StatusFicha;
  updatedBy?: string | null;
  updatedAt: Date;
};

type ConteudoComFicha = {
  id: number;
  competenciaId: number;
  titulo: string;
  tipoModulo: string;
  descricao?: string | null;
  ficha: FichaConteudo | null;
};

type FichaConteudo = {
  id: number;
  competenciaId: number;
  conteudoId: number;
  tipoConteudo: string;
  nomeConteudo: string;
  linkConteudo?: string | null;
  papelPedagogico: string;
  oQueAlunoAprende: string;
  reflexaoEsperada: string;
  quandoUsar?: string | null;
  orientacaoMentor: string;
  descricaoAluno: string;
  status: StatusFicha;
  updatedBy?: string | null;
  updatedAt: Date;
};

// ============ HELPERS ============
function statusBadge(status: StatusFicha | null | undefined) {
  if (!status) return <Badge variant="outline" className="text-gray-400">Sem ficha</Badge>;
  if (status === "publicada") return <Badge className="bg-green-100 text-green-800 border-green-200">Publicada</Badge>;
  if (status === "rascunho") return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Rascunho</Badge>;
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inativa</Badge>;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ============ FORMULÁRIO DE FICHA DA COMPETÊNCIA ============
function FormFichaCompetencia({
  competenciaId,
  competenciaNome,
  fichaExistente,
  onClose,
  onSaved,
}: {
  competenciaId: number;
  competenciaNome: string;
  fichaExistente: FichaCompetencia | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    linhaDesenvolvimento: fichaExistente?.linhaDesenvolvimento || "",
    objetivoPedagogico: fichaExistente?.objetivoPedagogico || "",
    oQueEnsina: fichaExistente?.oQueEnsina || "",
    quandoIndicar: fichaExistente?.quandoIndicar || "",
    sinaisObservaveis: fichaExistente?.sinaisObservaveis || "",
    cuidadoIndicacao: fichaExistente?.cuidadoIndicacao || "",
    resumoMentor: fichaExistente?.resumoMentor || "",
    descricaoAluno: fichaExistente?.descricaoAluno || "",
    sugestaoDesenvolvimentoCompetencia: fichaExistente?.sugestaoDesenvolvimentoCompetencia || "",
    status: (fichaExistente?.status || "rascunho") as StatusFicha,
  });

  const utils = trpc.useUtils();

  const criarMutation = trpc.fichasPedagogicas.criarFichaCompetencia.useMutation({
    onSuccess: () => {
      toast.success("Ficha criada com sucesso!");
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const atualizarMutation = trpc.fichasPedagogicas.atualizarFichaCompetencia.useMutation({
    onSuccess: () => {
      toast.success("Ficha atualizada com sucesso!");
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const isLoading = criarMutation.isPending || atualizarMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fichaExistente) {
      atualizarMutation.mutate({ id: fichaExistente.id, ...form, competenciaId });
    } else {
      criarMutation.mutate({ competenciaId, ...form });
    }
  }

  const campos: { key: keyof typeof form; label: string; obrigatorio: boolean; rows?: number }[] = [
    { key: "linhaDesenvolvimento", label: "Linha de Desenvolvimento", obrigatorio: true, rows: 3 },
    { key: "objetivoPedagogico", label: "Objetivo Pedagógico", obrigatorio: true, rows: 3 },
    { key: "oQueEnsina", label: "O que esta competência ensina?", obrigatorio: true, rows: 3 },
    { key: "quandoIndicar", label: "Quando indicar", obrigatorio: true, rows: 3 },
    { key: "sinaisObservaveis", label: "Sinais observáveis", obrigatorio: true, rows: 3 },
    { key: "cuidadoIndicacao", label: "Cuidado na indicação", obrigatorio: false, rows: 2 },
    { key: "resumoMentor", label: "Resumo para o Mentor", obrigatorio: true, rows: 4 },
    { key: "descricaoAluno", label: "Descrição para o Aluno", obrigatorio: true, rows: 3 },
    { key: "sugestaoDesenvolvimentoCompetencia", label: "Sugestão de desenvolvimento da competência", obrigatorio: true, rows: 3 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Competência:</strong> {competenciaNome}
      </div>

      {campos.map(({ key, label, obrigatorio, rows }) => (
        <div key={key}>
          <Label htmlFor={key} className="text-sm font-medium">
            {label} {obrigatorio && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id={key}
            value={form[key] as string}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            rows={rows || 3}
            className="mt-1 text-sm"
            placeholder={obrigatorio ? `${label} (obrigatório)` : `${label} (opcional)`}
          />
        </div>
      ))}

      <div>
        <Label className="text-sm font-medium">Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as StatusFicha }))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="publicada">Publicada</SelectItem>
            <SelectItem value="inativa">Inativa</SelectItem>
          </SelectContent>
        </Select>
        {form.status === "publicada" && (
          <p className="text-xs text-amber-600 mt-1">
            Ao publicar, todos os campos obrigatórios devem estar preenchidos. Só pode haver uma ficha publicada por competência.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {fichaExistente ? "Salvar alterações" : "Criar ficha"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============ FORMULÁRIO DE FICHA DO CONTEÚDO ============
function FormFichaConteudo({
  competenciaId,
  conteudo,
  fichaExistente,
  onClose,
  onSaved,
}: {
  competenciaId: number;
  conteudo: ConteudoComFicha;
  fichaExistente: FichaConteudo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tiposConteudo = ["intro", "filme", "video", "tedtalk", "podcast", "livro", "curso", "outro"];

  const [form, setForm] = useState({
    tipoConteudo: (fichaExistente?.tipoConteudo || conteudo.tipoModulo || "outro") as string,
    nomeConteudo: fichaExistente?.nomeConteudo || conteudo.titulo || "",
    linkConteudo: fichaExistente?.linkConteudo || "",
    papelPedagogico: fichaExistente?.papelPedagogico || "",
    oQueAlunoAprende: fichaExistente?.oQueAlunoAprende || "",
    reflexaoEsperada: fichaExistente?.reflexaoEsperada || "",
    quandoUsar: fichaExistente?.quandoUsar || "",
    orientacaoMentor: fichaExistente?.orientacaoMentor || "",
    descricaoAluno: fichaExistente?.descricaoAluno || "",
    status: (fichaExistente?.status || "rascunho") as StatusFicha,
  });

  const utils = trpc.useUtils();

  const criarMutation = trpc.fichasPedagogicas.criarFichaConteudo.useMutation({
    onSuccess: () => {
      toast.success("Ficha do conteúdo criada!");
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
      utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const atualizarMutation = trpc.fichasPedagogicas.atualizarFichaConteudo.useMutation({
    onSuccess: () => {
      toast.success("Ficha do conteúdo atualizada!");
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
      utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const isLoading = criarMutation.isPending || atualizarMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tiposValidos = ["intro", "filme", "video", "tedtalk", "podcast", "livro", "curso", "outro"] as const;
    const tipoConteudo = tiposValidos.includes(form.tipoConteudo as typeof tiposValidos[number])
      ? (form.tipoConteudo as typeof tiposValidos[number])
      : "outro";

    if (fichaExistente) {
      atualizarMutation.mutate({
        id: fichaExistente.id,
        ...form,
        tipoConteudo,
        competenciaId,
        conteudoId: conteudo.id,
      });
    } else {
      criarMutation.mutate({
        competenciaId,
        conteudoId: conteudo.id,
        ...form,
        tipoConteudo,
      });
    }
  }

  const campos: { key: keyof typeof form; label: string; obrigatorio: boolean; rows?: number; type?: string }[] = [
    { key: "nomeConteudo", label: "Nome do Conteúdo", obrigatorio: true, type: "input" },
    { key: "linkConteudo", label: "Link do Conteúdo", obrigatorio: false, type: "input" },
    { key: "papelPedagogico", label: "Papel Pedagógico", obrigatorio: true, rows: 3 },
    { key: "oQueAlunoAprende", label: "O que o aluno aprende", obrigatorio: true, rows: 3 },
    { key: "reflexaoEsperada", label: "Reflexão esperada", obrigatorio: true, rows: 3 },
    { key: "quandoUsar", label: "Quando usar", obrigatorio: false, rows: 2 },
    { key: "orientacaoMentor", label: "Orientação para o Mentor", obrigatorio: true, rows: 4 },
    { key: "descricaoAluno", label: "Descrição para o Aluno", obrigatorio: true, rows: 3 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Conteúdo:</strong> {conteudo.titulo}
      </div>

      <div>
        <Label className="text-sm font-medium">Tipo de Conteúdo <span className="text-red-500">*</span></Label>
        <Select
          value={form.tipoConteudo}
          onValueChange={(v) => setForm((prev) => ({ ...prev, tipoConteudo: v }))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tiposConteudo.map((t) => (
              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {campos.map(({ key, label, obrigatorio, rows, type }) => (
        <div key={key}>
          <Label htmlFor={key} className="text-sm font-medium">
            {label} {obrigatorio && <span className="text-red-500">*</span>}
          </Label>
          {type === "input" ? (
            <Input
              id={key}
              value={form[key] as string}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              className="mt-1 text-sm"
              placeholder={obrigatorio ? `${label} (obrigatório)` : `${label} (opcional)`}
            />
          ) : (
            <Textarea
              id={key}
              value={form[key] as string}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={rows || 3}
              className="mt-1 text-sm"
              placeholder={obrigatorio ? `${label} (obrigatório)` : `${label} (opcional)`}
            />
          )}
        </div>
      ))}

      <div>
        <Label className="text-sm font-medium">Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as StatusFicha }))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="publicada">Publicada</SelectItem>
            <SelectItem value="inativa">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {fichaExistente ? "Salvar alterações" : "Criar ficha"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============ PAINEL DE IMPORTAÇÃO ============
function PainelImportacao({ onClose }: { onClose: () => void }) {
  const [fase, setFase] = useState<"upload" | "validando" | "resultado" | "importando" | "concluido">("upload");
  const [base64, setBase64] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    resultados: Array<{
      linha: number;
      tipo: string;
      competencia: string;
      conteudo: string;
      status: string;
      resultado: string;
      erro: boolean;
    }>;
    temErrosCriticos: boolean;
    totalLinhas: number;
    totalErros: number;
    totalAlertas: number;
    totalOk: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const validarMutation = trpc.fichasPedagogicas.validarImportacao.useMutation({
    onSuccess: (data) => {
      setResultado(data);
      setFase("resultado");
    },
    onError: (e) => {
      toast.error(e.message);
      setFase("upload");
    },
  });

  const confirmarMutation = trpc.fichasPedagogicas.confirmarImportacao.useMutation({
    onSuccess: (data) => {
      setFase("concluido");
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
      toast.success(
        `Importação concluída: ${data.fichasCompetenciaCriadas} fichas de competência criadas, ${data.fichasConteudoCriadas} fichas de conteúdo criadas.`
      );
    },
    onError: (e) => {
      toast.error(e.message);
      setFase("resultado");
    },
  });

  const gerarModeloMutation = trpc.fichasPedagogicas.gerarModeloExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.base64}`;
      link.download = data.filename;
      link.click();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = (ev.target?.result as string).split(",")[1];
      setBase64(b64);
    };
    reader.readAsDataURL(file);
  }

  function handleValidar() {
    if (!base64) return toast.error("Selecione um arquivo Excel primeiro.");
    setFase("validando");
    validarMutation.mutate({ base64 });
  }

  function handleConfirmar() {
    if (!base64) return;
    setFase("importando");
    confirmarMutation.mutate({ base64 });
  }

  return (
    <div className="space-y-4">
      {fase === "upload" && (
        <>
          <p className="text-sm text-gray-600">
            Preencha o modelo Excel e importe as fichas pedagógicas em lote. O sistema validará os dados antes de salvar.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => gerarModeloMutation.mutate()}
              disabled={gerarModeloMutation.isPending}
            >
              {gerarModeloMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Baixar modelo Excel
            </Button>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-2">Selecione o arquivo Excel preenchido</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Selecionar arquivo
            </Button>
            {base64 && (
              <p className="text-xs text-green-600 mt-2">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Arquivo carregado
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleValidar} disabled={!base64}>
              Validar arquivo
            </Button>
          </DialogFooter>
        </>
      )}

      {fase === "validando" && (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Validando arquivo...</p>
        </div>
      )}

      {fase === "resultado" && resultado && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{resultado.totalOk}</p>
              <p className="text-xs text-green-600">OK</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{resultado.totalAlertas}</p>
              <p className="text-xs text-yellow-600">Alertas</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{resultado.totalErros}</p>
              <p className="text-xs text-red-600">Erros</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{resultado.totalLinhas}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>

          {resultado.temErrosCriticos && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Existem erros críticos. Corrija o arquivo e tente novamente. Linhas com erro serão ignoradas na importação.</span>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Linha</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Competência</TableHead>
                  <TableHead className="text-xs">Conteúdo</TableHead>
                  <TableHead className="text-xs">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.resultados.map((r, i) => (
                  <TableRow key={i} className={r.erro ? "bg-red-50" : r.resultado !== "OK" ? "bg-yellow-50" : ""}>
                    <TableCell className="text-xs">{r.linha}</TableCell>
                    <TableCell className="text-xs">{r.tipo}</TableCell>
                    <TableCell className="text-xs">{r.competencia}</TableCell>
                    <TableCell className="text-xs">{r.conteudo}</TableCell>
                    <TableCell className="text-xs">
                      {r.erro ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {r.resultado}
                        </span>
                      ) : r.resultado !== "OK" ? (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {r.resultado}
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> OK
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFase("upload")}>Voltar</Button>
            <Button
              onClick={handleConfirmar}
              disabled={resultado.totalLinhas - resultado.totalErros === 0}
            >
              Importar {resultado.totalLinhas - resultado.totalErros} fichas válidas
            </Button>
          </DialogFooter>
        </>
      )}

      {fase === "importando" && (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Importando fichas...</p>
        </div>
      )}

      {fase === "concluido" && (
        <div className="flex flex-col items-center py-8 gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="text-lg font-semibold text-green-700">Importação concluída!</p>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      )}
    </div>
  );
}

// ============ DETALHE DA COMPETÊNCIA ============
function DetalheCompetencia({
  competenciaId,
  onVoltar,
}: {
  competenciaId: number;
  onVoltar: () => void;
}) {
  const [modalFichaComp, setModalFichaComp] = useState(false);
  const [modalFichaConteudo, setModalFichaConteudo] = useState<ConteudoComFicha | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.fichasPedagogicas.obterDetalheCompetencia.useQuery(
    { competenciaId },
    { refetchOnWindowFocus: false }
  );

  const publicarCompMutation = trpc.fichasPedagogicas.publicarFichaCompetencia.useMutation({
    onSuccess: () => {
      toast.success("Ficha publicada!");
      utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const inativarCompMutation = trpc.fichasPedagogicas.inativarFichaCompetencia.useMutation({
    onSuccess: () => {
      toast.success("Ficha inativada.");
      utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const publicarContMutation = trpc.fichasPedagogicas.publicarFichaConteudo.useMutation({
    onSuccess: () => {
      toast.success("Ficha do conteúdo publicada!");
      utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const inativarContMutation = trpc.fichasPedagogicas.inativarFichaConteudo.useMutation({
    onSuccess: () => {
      toast.success("Ficha do conteúdo inativada.");
      utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
      utils.fichasPedagogicas.listarCompetenciasComStatus.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const fichaComp = data.fichasCompetencia[0] as FichaCompetencia | undefined;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onVoltar}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div>
          <h2 className="text-xl font-bold">{data.competencia.nome}</h2>
          <p className="text-sm text-gray-500">Trilha: {data.competencia.trilhaNome}</p>
        </div>
      </div>

      {/* Ficha da Competência */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-base">Ficha da Competência</h3>
            {statusBadge(fichaComp?.status)}
          </div>
          <div className="flex gap-2">
            {fichaComp && fichaComp.status === "rascunho" && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => publicarCompMutation.mutate({ id: fichaComp.id })}
                disabled={publicarCompMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Publicar
              </Button>
            )}
            {fichaComp && fichaComp.status === "publicada" && (
              <Button
                size="sm"
                variant="outline"
                className="text-gray-600 border-gray-300"
                onClick={() => inativarCompMutation.mutate({ id: fichaComp.id })}
                disabled={inativarCompMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" /> Inativar
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setModalFichaComp(true)}
            >
              {fichaComp ? (
                <><Edit className="w-4 h-4 mr-1" /> Editar</>
              ) : (
                <><Plus className="w-4 h-4 mr-1" /> Criar ficha</>
              )}
            </Button>
          </div>
        </div>

        {fichaComp ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { label: "Linha de Desenvolvimento", value: fichaComp.linhaDesenvolvimento },
              { label: "Objetivo Pedagógico", value: fichaComp.objetivoPedagogico },
              { label: "O que ensina", value: fichaComp.oQueEnsina },
              { label: "Quando indicar", value: fichaComp.quandoIndicar },
              { label: "Sinais observáveis", value: fichaComp.sinaisObservaveis },
              { label: "Cuidado na indicação", value: fichaComp.cuidadoIndicacao || "—" },
              { label: "Resumo para o Mentor", value: fichaComp.resumoMentor },
              { label: "Descrição para o Aluno", value: fichaComp.descricaoAluno },
              { label: "Sugestão de desenvolvimento", value: fichaComp.sugestaoDesenvolvimentoCompetencia },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                <p className="text-gray-800 whitespace-pre-wrap">{value}</p>
              </div>
            ))}
            <div className="text-xs text-gray-400 col-span-2">
              Última atualização: {formatDate(fichaComp.updatedAt)}
              {fichaComp.updatedBy && ` por ${fichaComp.updatedBy}`}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma ficha criada para esta competência.</p>
          </div>
        )}
      </div>

      {/* Conteúdos da Competência */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">
            Conteúdos da Trilha ({data.conteudos.length})
          </h3>
        </div>

        {data.conteudos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum conteúdo vinculado a esta competência.</p>
        ) : (
          <div className="space-y-3">
            {(data.conteudos as ConteudoComFicha[]).map((conteudo) => (
              <div
                key={conteudo.id}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm">{conteudo.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{conteudo.tipoModulo}</Badge>
                      {statusBadge(conteudo.ficha?.status)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {conteudo.ficha && conteudo.ficha.status === "rascunho" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => publicarContMutation.mutate({ id: conteudo.ficha!.id })}
                      disabled={publicarContMutation.isPending}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Publicar
                    </Button>
                  )}
                  {conteudo.ficha && conteudo.ficha.status === "publicada" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-600"
                      onClick={() => inativarContMutation.mutate({ id: conteudo.ficha!.id })}
                      disabled={inativarContMutation.isPending}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> Inativar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModalFichaConteudo(conteudo)}
                  >
                    {conteudo.ficha ? (
                      <><Edit className="w-3 h-3 mr-1" /> Editar</>
                    ) : (
                      <><Plus className="w-3 h-3 mr-1" /> Criar ficha</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Ficha da Competência */}
      <Dialog open={modalFichaComp} onOpenChange={setModalFichaComp}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {fichaComp ? "Editar Ficha da Competência" : "Criar Ficha da Competência"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos pedagógicos. Campos marcados com * são obrigatórios para publicação.
            </DialogDescription>
          </DialogHeader>
          <FormFichaCompetencia
            competenciaId={competenciaId}
            competenciaNome={data.competencia.nome}
            fichaExistente={fichaComp || null}
            onClose={() => setModalFichaComp(false)}
            onSaved={() => {
              setModalFichaComp(false);
              utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Ficha do Conteúdo */}
      <Dialog open={!!modalFichaConteudo} onOpenChange={(open) => !open && setModalFichaConteudo(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalFichaConteudo?.ficha ? "Editar Ficha do Conteúdo" : "Criar Ficha do Conteúdo"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos pedagógicos do conteúdo. Campos marcados com * são obrigatórios para publicação.
            </DialogDescription>
          </DialogHeader>
          {modalFichaConteudo && (
            <FormFichaConteudo
              competenciaId={competenciaId}
              conteudo={modalFichaConteudo}
              fichaExistente={modalFichaConteudo.ficha}
              onClose={() => setModalFichaConteudo(null)}
              onSaved={() => {
                setModalFichaConteudo(null);
                utils.fichasPedagogicas.obterDetalheCompetencia.invalidate({ competenciaId });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ PÁGINA PRINCIPAL ============
export default function BibliotecaPedagogica() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTrilha, setFiltroTrilha] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [modalImportacao, setModalImportacao] = useState(false);

  // Redirecionar se não for admin
  if (!loading && user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: competencias = [], isLoading } = trpc.fichasPedagogicas.listarCompetenciasComStatus.useQuery(
    undefined,
    {
      enabled: !loading && !!user && user.role === "admin",
      refetchOnWindowFocus: false,
    }
  );

  // Trilhas únicas para filtro
  const trilhas = Array.from(new Set((competencias as CompetenciaListItem[]).map((c) => c.trilhaNome))).sort();

  // Filtrar competências
  const competenciasFiltradas = (competencias as CompetenciaListItem[]).filter((c) => {
    const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase());
    const matchTrilha = filtroTrilha === "todas" || c.trilhaNome === filtroTrilha;
    const matchStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "publicada" && c.fichaCompetencia?.status === "publicada") ||
      (filtroStatus === "rascunho" && c.fichaCompetencia?.status === "rascunho") ||
      (filtroStatus === "sem_ficha" && !c.fichaCompetencia) ||
      (filtroStatus === "inativa" && c.fichaCompetencia?.status === "inativa");
    return matchBusca && matchTrilha && matchStatus;
  });

  // Agrupar por trilha
  const porTrilha = competenciasFiltradas.reduce<Record<string, CompetenciaListItem[]>>((acc, c) => {
    if (!acc[c.trilhaNome]) acc[c.trilhaNome] = [];
    acc[c.trilhaNome].push(c);
    return acc;
  }, {});

  // Estatísticas
  const total = (competencias as CompetenciaListItem[]).length;
  const publicadas = (competencias as CompetenciaListItem[]).filter((c) => c.fichaCompetencia?.status === "publicada").length;
  const rascunhos = (competencias as CompetenciaListItem[]).filter((c) => c.fichaCompetencia?.status === "rascunho").length;
  const semFicha = (competencias as CompetenciaListItem[]).filter((c) => !c.fichaCompetencia).length;

  if (competenciaSelecionada) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <DetalheCompetencia
            competenciaId={competenciaSelecionada}
            onVoltar={() => setCompetenciaSelecionada(null)}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Biblioteca Pedagógica
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie as fichas pedagógicas de competências e conteúdos. Disponível apenas para administradores nesta fase.
            </p>
          </div>
          <Button variant="outline" onClick={() => setModalImportacao(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar via Excel
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Competências", value: total, color: "bg-blue-50 border-blue-200 text-blue-800" },
            { label: "Fichas Publicadas", value: publicadas, color: "bg-green-50 border-green-200 text-green-800" },
            { label: "Rascunhos", value: rascunhos, color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
            { label: "Sem Ficha", value: semFicha, color: "bg-gray-50 border-gray-200 text-gray-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`border rounded-xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar competência..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroTrilha} onValueChange={setFiltroTrilha}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por trilha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as trilhas</SelectItem>
              {trilhas.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="publicada">Publicadas</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
              <SelectItem value="sem_ficha">Sem ficha</SelectItem>
              <SelectItem value="inativa">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista agrupada por trilha */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(porTrilha).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma competência encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={Object.keys(porTrilha)} className="space-y-3">
            {Object.entries(porTrilha).map(([trilhaNome, comps]) => (
              <AccordionItem
                key={trilhaNome}
                value={trilhaNome}
                className="border rounded-xl bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{trilhaNome}</span>
                    <Badge variant="outline" className="text-xs">{comps.length} competências</Badge>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      {comps.filter((c) => c.fichaCompetencia?.status === "publicada").length} publicadas
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs pl-5">Competência</TableHead>
                        <TableHead className="text-xs">Ficha da Competência</TableHead>
                        <TableHead className="text-xs">Conteúdos</TableHead>
                        <TableHead className="text-xs">Fichas de Conteúdo</TableHead>
                        <TableHead className="text-xs">Última atualização</TableHead>
                        <TableHead className="text-xs text-right pr-5">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comps.map((comp) => (
                        <TableRow key={comp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setCompetenciaSelecionada(comp.id)}>
                          <TableCell className="font-medium text-sm pl-5">{comp.nome}</TableCell>
                          <TableCell>{statusBadge(comp.fichaCompetencia?.status)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{comp.totalConteudos}</TableCell>
                          <TableCell className="text-sm">
                            <span className="text-green-700 font-medium">{comp.fichasConteudoPublicadas}</span>
                            <span className="text-gray-400">/{comp.fichasConteudoTotal} fichas</span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">{formatDate(comp.ultimaAtualizacao)}</TableCell>
                          <TableCell className="text-right pr-5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompetenciaSelecionada(comp.id);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" /> Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Modal de Importação */}
      <Dialog open={modalImportacao} onOpenChange={setModalImportacao}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Fichas Pedagógicas via Excel</DialogTitle>
            <DialogDescription>
              Baixe o modelo, preencha e importe as fichas em lote. O sistema validará antes de salvar.
            </DialogDescription>
          </DialogHeader>
          <PainelImportacao onClose={() => setModalImportacao(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
