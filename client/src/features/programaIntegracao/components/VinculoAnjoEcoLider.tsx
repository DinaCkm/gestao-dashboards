import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link2, Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

type UsuarioAnjo = {
  id: number;
  name: string | null;
  email: string | null;
  cpf: string | null;
  role: string;
  programId?: number | null;
  alunoId?: number | null;
  consultorId?: number | null;
  isActive?: number;
  programName?: string | null;
};

type Vinculo = {
  id: number;
  legacyId: string;
  anjo: string | null;
  anjoEmail: string | null;
  anjoUserId: number | null;
  userName?: string | null;
  userEmail?: string | null;
  userCpf?: string | null;
  userRole?: string | null;
  alunoId?: number | null;
  consultorId?: number | null;
  isActive?: number | null;
  programName?: string | null;
};

async function json<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error((data as any)?.error || "Não foi possível concluir a operação."), { data });
  return data as T;
}

export default function VinculoAnjoEcoLider({
  legacyId,
  anjo,
  anjoEmail,
  situacao,
}: {
  legacyId: string;
  anjo: string;
  anjoEmail: string;
  situacao: string;
}) {
  const processoAtivo = situacao === "ativo";
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioAnjo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarCriacao, setMostrarCriacao] = useState(false);
  const [nome, setNome] = useState(anjo || "");
  const [email, setEmail] = useState(anjoEmail || "");
  const [cpf, setCpf] = useState("");
  const [programId, setProgramId] = useState("");
  const [programas, setProgramas] = useState<Array<{ id: number; name: string }>>([]);

  const endpoint = useMemo(
    () => `/api/programa-integracao/admin/processos/${encodeURIComponent(legacyId)}/anjo-vinculo`,
    [legacyId],
  );

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await json<{ ok: boolean; vinculo: Vinculo }>(await fetch(endpoint, { cache: "no-store" }));
      setVinculo(data.vinculo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível consultar o vínculo do Anjo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    void carregar();
    fetch("/api/programa-integracao/admin/anjo/programas", { cache: "no-store" })
      .then((response) => json<{ ok: boolean; programas: Array<{ id: number; name: string }> }>(response))
      .then((data) => { if (ativo) setProgramas(data.programas || []); })
      .catch((error) => {
        if (ativo) toast.error(error instanceof Error ? error.message : "Não foi possível carregar as empresas.");
      });
    return () => { ativo = false; };
  }, [endpoint]);

  const pesquisar = async () => {
    setBuscando(true);
    try {
      const data = await json<{ ok: boolean; usuarios: UsuarioAnjo[] }>(
        await fetch(`/api/programa-integracao/admin/anjo/usuarios?q=${encodeURIComponent(busca)}`, { cache: "no-store" }),
      );
      setUsuarios(data.usuarios || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível pesquisar usuários.");
    } finally {
      setBuscando(false);
    }
  };

  const vincular = async (userId: number | null) => {
    setSalvando(true);
    try {
      await json(await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }));
      toast.success(userId ? "Usuário vinculado ao Colaborador Anjo." : "Vínculo removido. Nome e e-mail históricos foram preservados.");
      setUsuarios([]);
      setBusca("");
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o vínculo.");
    } finally {
      setSalvando(false);
    }
  };

  const criarAcesso = async () => {
    setSalvando(true);
    try {
      const response = await fetch(
        `/api/programa-integracao/admin/processos/${encodeURIComponent(legacyId)}/anjo-acesso`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            cpf: cpf.replace(/\D/g, ""),
            programId: programId ? Number(programId) : null,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409 && Array.isArray(data.existingUsers)) {
          setUsuarios(data.existingUsers);
          setMostrarCriacao(false);
        }
        throw new Error(data.error || "Não foi possível criar o acesso.");
      }
      toast.success("Acesso do Anjo criado e vinculado ao processo.");
      setMostrarCriacao(false);
      setCpf("");
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o acesso do Anjo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card className="md:col-span-2 xl:col-span-4">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Colaborador Anjo · acesso EcoLíder</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              O nome e o e-mail acima continuam sendo os dados históricos do processo. Aqui você apenas vincula o usuário que terá acesso ao Espaço do Anjo.
            </p>
          </div>
          {loading ? <Badge variant="outline">Consultando...</Badge> : vinculo?.anjoUserId ? <Badge className="bg-emerald-600">Usuário vinculado</Badge> : <Badge variant="secondary">Nenhum usuário vinculado</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!processoAtivo && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Este processo está encerrado. O vínculo histórico do Anjo permanece visível, mas novos vínculos ou novos acessos não podem ser criados.
          </div>
        )}
        {vinculo?.anjoUserId ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-semibold">{vinculo.userName || "Usuário EcoLíder"}</p>
              <p className="text-muted-foreground">{vinculo.userEmail || "E-mail não informado"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{vinculo.programName || "Empresa não identificada"} · CPF {vinculo.userCpf ? `***.***.${vinculo.userCpf.slice(-5, -2)}-${vinculo.userCpf.slice(-2)}` : "não informado"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Perfil atual: {vinculo.userRole === "manager" ? "Gerente" : vinculo.alunoId ? "Aluno" : "Acesso somente como Anjo"}
              </p>
            </div>
            <Button type="button" variant="outline" disabled={salvando} onClick={() => void vincular(null)}>
              Desvincular usuário
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar usuário por nome, e-mail ou CPF" disabled={!processoAtivo} />
              <Button type="button" variant="outline" onClick={() => void pesquisar()} disabled={buscando || !processoAtivo}>
                {buscando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Buscar
              </Button>
              <Button type="button" onClick={() => setMostrarCriacao((v) => !v)} disabled={!processoAtivo}>
                <UserPlus className="mr-2 h-4 w-4" />Criar acesso do Anjo
              </Button>
            </div>

            {usuarios.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usuários encontrados</p>
                {usuarios.map((usuario) => (
                  <div key={usuario.id} className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                      <p className="font-medium">{usuario.name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{usuario.email || "Sem e-mail"} · {usuario.programName || "Empresa não identificada"} · CPF {usuario.cpf ? `***.***.${usuario.cpf.slice(-5, -2)}-${usuario.cpf.slice(-2)}` : "não informado"}</p>
                      <p className="text-xs text-muted-foreground">{usuario.role === "manager" ? "Gerente" : usuario.alunoId ? "Aluno" : "Usuário EcoLíder"}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" disabled={salvando || !processoAtivo} onClick={() => void vincular(usuario.id)}>
                      <Link2 className="mr-2 h-4 w-4" />Vincular
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {mostrarCriacao && processoAtivo && (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="font-semibold">Criar acesso mínimo do Anjo</p>
                <p className="mt-1 text-xs text-muted-foreground">Antes de criar, o sistema confere e-mail e CPF para evitar duplicidade. Este cadastro não cria aluno, gerente ou consultor.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs"><span className="font-medium">Nome</span><Input value={nome} onChange={(e) => setNome(e.target.value)} /></label>
                  <label className="space-y-1 text-xs"><span className="font-medium">E-mail</span><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                  <label className="space-y-1 text-xs"><span className="font-medium">CPF</span><Input inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="Somente números" /></label>
                  <label className="space-y-1 text-xs">
                    <span className="font-medium">Empresa</span>
                    <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Selecione a empresa</option>
                      {programas.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
                    </select>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" disabled={salvando || !programId || !nome.trim() || !email.trim() || cpf.length !== 11} onClick={() => void criarAcesso()}>{salvando ? "Criando..." : "Criar acesso e vincular"}</Button>
                  <Button type="button" variant="ghost" disabled={salvando} onClick={() => setMostrarCriacao(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
