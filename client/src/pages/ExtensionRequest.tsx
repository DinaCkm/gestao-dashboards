import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExtensionRequestProps {
  moduloId: number;
  progressoId: number;
  moduloTitulo: string;
  dataLimiteOriginal: Date;
  dataFimContrato: Date;
  diasRestantes?: number;
  statusSemaforo?: "verde" | "amarelo" | "vermelho";
}

export function ExtensionRequest({
  moduloId,
  progressoId,
  moduloTitulo,
  dataLimiteOriginal,
  dataFimContrato,
  diasRestantes,
  statusSemaforo = "verde",
}: ExtensionRequestProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [novosPrazo, setNovosPrazo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestExtensionMutation = trpc.course.requestExtension.useMutation();

  const handleSubmit = async () => {
    // Validações
    if (!novosPrazo) {
      toast.error("Selecione uma nova data");
      return;
    }

    if (motivo.trim().length < 10) {
      toast.error("Motivo deve ter no mínimo 10 caracteres");
      return;
    }

    const novaPrazoDate = new Date(novosPrazo);

    if (novaPrazoDate <= dataLimiteOriginal) {
      toast.error("Nova data deve ser posterior à data original");
      return;
    }

    if (novaPrazoDate > dataFimContrato) {
      toast.error("Nova data não pode exceder o fim do contrato");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestExtensionMutation.mutateAsync({
        moduloId,
        progressoId,
        dataLimiteSolicitada: novaPrazoDate,
        dataFimContrato,
        motivoSolicitacao: motivo,
      });

      toast.success("Solicitação de prorrogação enviada com sucesso!");
      setIsOpen(false);
      setNovosPrazo("");
      setMotivo("");
    } catch (error) {
      toast.error("Erro ao enviar solicitação");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getSemaforoColor = (status: string) => {
    switch (status) {
      case "verde":
        return "bg-green-100 text-green-800";
      case "amarelo":
        return "bg-yellow-100 text-yellow-800";
      case "vermelho":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`w-full ${
            statusSemaforo === "vermelho"
              ? "border-red-300 text-red-700 hover:bg-red-50"
              : statusSemaforo === "amarelo"
                ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                : "border-gray-300"
          }`}
          disabled={statusSemaforo !== "vermelho" && statusSemaforo !== "amarelo"}
        >
          <Clock className="w-4 h-4 mr-2" />
          {statusSemaforo === "vermelho" ? "Solicitar Prorrogação" : "Prorrogação"}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">⏰ Solicitar Prorrogação de Prazo</DialogTitle>
          <DialogDescription className="text-slate-400">
            Solicite uma extensão de prazo para completar o módulo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Módulo */}
          <div className="bg-slate-700 p-4 rounded-lg space-y-2">
            <p className="text-sm text-slate-400">Módulo</p>
            <p className="font-semibold text-white">{moduloTitulo}</p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Prazo Original</p>
              <p className="font-semibold text-white text-sm">{formatDate(dataLimiteOriginal)}</p>
            </div>
            <div className="bg-slate-700 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Fim do Contrato</p>
              <p className="font-semibold text-white text-sm">{formatDate(dataFimContrato)}</p>
            </div>
          </div>

          {/* Validação de Contrato */}
          <Alert className="bg-blue-900 border-blue-700">
            <Calendar className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              Sua prorrogação deve estar dentro do contrato que termina em{" "}
              <span className="font-semibold">{formatDate(dataFimContrato)}</span>
            </AlertDescription>
          </Alert>

          {/* Novo Prazo */}
          <div className="space-y-2">
            <Label className="text-slate-200">Novo Prazo Solicitado</Label>
            <Input
              type="date"
              value={novosPrazo}
              onChange={(e) => setNovosPrazo(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              min={new Date(dataLimiteOriginal.getTime() + 86400000)
                .toISOString()
                .split("T")[0]}
              max={new Date(dataFimContrato).toISOString().split("T")[0]}
            />
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label className="text-slate-200">Motivo da Solicitação</Label>
            <Textarea
              placeholder="Explique por que precisa de mais tempo..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <p className="text-xs text-slate-400">{motivo.length}/10 caracteres mínimos</p>
          </div>

          {/* Aviso Importante */}
          <Alert className="bg-amber-900 border-amber-700">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200 text-sm">
              ⚠️ Importante: A prorrogação apenas estende o prazo de acesso. Sua performance será
              calculada com base no prazo original.
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !novosPrazo ||
                motivo.trim().length < 10
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Solicitar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
