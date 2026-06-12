import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Eye, Search, User, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImpersonationSelectorProps {
  open: boolean;
  onClose: () => void;
}

export default function ImpersonationSelector({ open, onClose }: ImpersonationSelectorProps) {
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"email" | "list">("email");

  const { data: alunos = [], isLoading: loadingAlunos } = trpc.alunos.list.useQuery(undefined, {
    enabled: open && searchMode === "list",
  });

  const impersonateMutation = trpc.auth.impersonateAluno.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Redirecionar para a página do aluno após impersonação
        window.location.href = "/meu-dashboard";
      }
    },
    onError: (err) => {
      setError(err.message || "Erro ao iniciar visualização.");
    },
  });

  const handleImpersonateByEmail = () => {
    setError(null);
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Informe um email válido.");
      return;
    }
    impersonateMutation.mutate({ emailAluno: email });
  };

  const handleImpersonateFromList = (email: string) => {
    setError(null);
    impersonateMutation.mutate({ emailAluno: email });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-500" />
            Visualizar como Empregado/Aluno
          </DialogTitle>
          <DialogDescription>
            Selecione o empregado cujo dashboard você deseja visualizar. Você terá acesso
            <strong> somente leitura</strong> — nenhuma alteração será feita em nome dele.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Toggle entre busca por email e lista */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                searchMode === "email"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent hover:bg-muted"
              }`}
              onClick={() => setSearchMode("email")}
            >
              <Search className="h-4 w-4" />
              Buscar por Email
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                searchMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent hover:bg-muted"
              }`}
              onClick={() => setSearchMode("list")}
            >
              <User className="h-4 w-4" />
              Selecionar da Lista
            </button>
          </div>

          {searchMode === "email" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="aluno-email">Email do Empregado/Aluno</Label>
                <Input
                  id="aluno-email"
                  type="email"
                  placeholder="email.do.aluno@empresa.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleImpersonateByEmail(); }}
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                onClick={handleImpersonateByEmail}
                disabled={impersonateMutation.isPending || !emailInput.trim()}
              >
                {impersonateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abrindo visualização...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar como este Aluno
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {loadingAlunos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando lista...</span>
                </div>
              ) : (
                <Command className="border rounded-lg">
                  <CommandInput placeholder="Buscar por nome ou email..." />
                  <CommandList className="max-h-64">
                    <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                    <CommandGroup>
                      {alunos
                        .filter((a: any) => a.isActive && a.email)
                        .sort((a: any, b: any) => a.name.localeCompare(b.name, "pt-BR"))
                        .map((aluno: any) => (
                          <CommandItem
                            key={aluno.id}
                            value={`${aluno.name} ${aluno.email}`}
                            onSelect={() => handleImpersonateFromList(aluno.email)}
                            className="cursor-pointer"
                            disabled={impersonateMutation.isPending}
                          >
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{aluno.name}</span>
                              <span className="text-xs text-muted-foreground">{aluno.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
              {impersonateMutation.isPending && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Abrindo visualização...</span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Um banner laranja aparecerá indicando que você está em modo de visualização.
            Clique em "Sair da Visualização" para retornar ao painel administrativo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
