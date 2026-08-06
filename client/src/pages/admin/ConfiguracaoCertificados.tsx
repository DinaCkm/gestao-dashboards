import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileBadge, Signature, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const NIVEIS = ["I", "II", "III", "IV"] as const;

export default function ConfiguracaoCertificados() {
  const utils = trpc.useUtils();

  // --- Templates ---
  const { data: templates, isLoading: carregandoTemplates } = trpc.certificacao.templates.useQuery();
  const [nomeTemplate, setNomeTemplate] = useState("");
  const [nivelTemplate, setNivelTemplate] = useState<(typeof NIVEIS)[number]>("I");
  const criarTemplate = trpc.certificacao.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template criado e ativado para o nível.");
      setNomeTemplate("");
      utils.certificacao.templates.invalidate();
    },
    onError: (err: any) => toast.error(err?.message || "Não foi possível criar o template."),
  });

  // --- Assinaturas ---
  const { data: assinaturas, isLoading: carregandoAssinaturas } = trpc.certificacao.assinaturas.useQuery();
  const [nomeAssinatura, setNomeAssinatura] = useState("");
  const [cargoAssinatura, setCargoAssinatura] = useState("");
  const [tipoAssinatura, setTipoAssinatura] = useState<"gerente" | "gestor_master">("gerente");
  const criarAssinatura = trpc.certificacao.createAssinatura.useMutation({
    onSuccess: () => {
      toast.success("Assinatura cadastrada.");
      setNomeAssinatura("");
      setCargoAssinatura("");
      utils.certificacao.assinaturas.invalidate();
    },
    onError: (err: any) => toast.error(err?.message || "Não foi possível cadastrar a assinatura."),
  });

  const niveisComTemplate = new Set((templates || []).filter((t: any) => t.ativo === 1).map((t: any) => t.nivel));
  const temGerente = (assinaturas || []).some((a: any) => a.tipo === "gerente" && a.ativo === 1);
  const temGestorMaster = (assinaturas || []).some((a: any) => a.tipo === "gestor_master" && a.ativo === 1);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração de Certificados</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sem um template ativo por nível e as duas assinaturas obrigatórias, nenhum certificado pode
            ser emitido — nem automático, nem manual.
          </p>
        </div>

        {/* Templates por nível */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileBadge className="w-4 h-4" /> Templates por nível
            </CardTitle>
            <CardDescription>Um template ativo é obrigatório para cada nível (I a IV) que for certificar alunos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {NIVEIS.map((n) => (
                <Badge key={n} variant={niveisComTemplate.has(n) ? "default" : "outline"} className={niveisComTemplate.has(n) ? "bg-emerald-600" : "text-gray-400"}>
                  {niveisComTemplate.has(n) && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  Nível {n}
                </Badge>
              ))}
            </div>

            {carregandoTemplates ? (
              <div className="flex items-center text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando...
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="text-sm text-gray-600 space-y-1">
                {templates.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between border-b py-1.5 last:border-0">
                    <span>{t.nome} — Nível {t.nivel}</span>
                    {t.ativo === 1 ? (
                      <span className="text-emerald-600 text-xs">Ativo</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Inativo</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhum template cadastrado ainda.</p>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Criar novo template</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nome do template (ex: Certificado Padrão)"
                  value={nomeTemplate}
                  onChange={(e) => setNomeTemplate(e.target.value)}
                />
                <Select value={nivelTemplate} onValueChange={(v) => setNivelTemplate(v as any)}>
                  <SelectTrigger className="sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVEIS.map((n) => (
                      <SelectItem key={n} value={n}>Nível {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => nomeTemplate.trim() && criarTemplate.mutate({ nome: nomeTemplate.trim(), nivel: nivelTemplate })}
                  disabled={!nomeTemplate.trim() || criarTemplate.isPending}
                >
                  {criarTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar e ativar"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Criar um novo template para um nível ativa ele automaticamente e desativa o anterior desse nível.
                O design visual do certificado em si (logo, texto, layout) já é fixo na página pública de
                verificação — este cadastro só controla qual nível está liberado para emitir.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assinaturas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Signature className="w-4 h-4" /> Assinaturas obrigatórias
            </CardTitle>
            <CardDescription>Todo certificado exige uma assinatura ativa do tipo "gerente" e uma do tipo "gestor_master".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={temGerente ? "default" : "outline"} className={temGerente ? "bg-emerald-600" : "text-gray-400"}>
                {temGerente && <CheckCircle2 className="w-3 h-3 mr-1" />} Gerente
              </Badge>
              <Badge variant={temGestorMaster ? "default" : "outline"} className={temGestorMaster ? "bg-emerald-600" : "text-gray-400"}>
                {temGestorMaster && <CheckCircle2 className="w-3 h-3 mr-1" />} Gestor Master
              </Badge>
            </div>

            {carregandoAssinaturas ? (
              <div className="flex items-center text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando...
              </div>
            ) : assinaturas && assinaturas.length > 0 ? (
              <div className="text-sm text-gray-600 space-y-1">
                {assinaturas.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between border-b py-1.5 last:border-0">
                    <span>{a.nomeExibicao} {a.cargo ? `— ${a.cargo}` : ""} ({a.tipo})</span>
                    {a.ativo === 1 ? (
                      <span className="text-emerald-600 text-xs">Ativa</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Inativa</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhuma assinatura cadastrada ainda.</p>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Cadastrar assinatura</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input placeholder="Nome" value={nomeAssinatura} onChange={(e) => setNomeAssinatura(e.target.value)} />
                <Input placeholder="Cargo (opcional)" value={cargoAssinatura} onChange={(e) => setCargoAssinatura(e.target.value)} />
                <Select value={tipoAssinatura} onValueChange={(v) => setTipoAssinatura(v as any)}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="gestor_master">Gestor Master</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() =>
                    nomeAssinatura.trim() &&
                    criarAssinatura.mutate({ nomeExibicao: nomeAssinatura.trim(), cargo: cargoAssinatura.trim() || undefined, tipo: tipoAssinatura })
                  }
                  disabled={!nomeAssinatura.trim() || criarAssinatura.isPending}
                >
                  {criarAssinatura.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                A imagem da assinatura (opcional, aparece no certificado) pode ser adicionada depois — sem ela,
                o certificado sai só com o nome e cargo por extenso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
