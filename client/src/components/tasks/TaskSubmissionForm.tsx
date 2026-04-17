import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Paperclip, Send, Target } from "lucide-react";
import { toast } from "sonner";

export type SubmissionType = "tarefa" | "atualizacao_projeto";

type SubmissionPayload = {
  submissionType: SubmissionType;
  evidenceLink?: string;
  evidenceFileBase64?: string;
  evidenceFileName?: string;
  relatoAluno?: string;
  textoAplicabilidade?: string;
  notaAlunoAplicabilidade?: number;
};

type Props = {
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string;
  onSubmit: (payload: SubmissionPayload) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string;
  helperTopText?: string;
};

const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

export function TaskSubmissionForm({
  submitLabel,
  isSubmitting,
  submitError,
  onSubmit,
  onSuccess,
  successMessage = "Atividade enviada com sucesso!",
  helperTopText,
}: Props) {
  const [submissionType, setSubmissionType] = useState<SubmissionType | "">("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [relatoAluno, setRelatoAluno] = useState("");
  const [textoAplicabilidade, setTextoAplicabilidade] = useState("");
  const [notaAlunoAplicabilidade, setNotaAlunoAplicabilidade] = useState<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTarefa = submissionType === "tarefa";

  const validationError = useMemo(() => {
    if (!submissionType) {
      return "Selecione o tipo da entrega para continuar.";
    }

    const trimmedLink = evidenceLink.trim();
    const trimmedRelato = relatoAluno.trim();

    if (!trimmedLink && !evidenceFile && !trimmedRelato) {
      return "Para enviar a atividade, preencha pelo menos um dos campos: link, anexo ou relato.";
    }

    if (trimmedLink) {
      try {
        new URL(trimmedLink);
      } catch {
        return "Cole um link válido, começando com https://.";
      }
    }

    if (isTarefa && !textoAplicabilidade.trim()) {
      return "Preencha o campo de aplicabilidade prática para envios do tipo Tarefa.";
    }

    if (isTarefa && notaAlunoAplicabilidade === undefined) {
      return "Selecione uma nota de 0 a 10 para a aplicabilidade prática.";
    }

    return null;
  }, [submissionType, evidenceLink, evidenceFile, relatoAluno, isTarefa, textoAplicabilidade, notaAlunoAplicabilidade]);

  const handlePickFile = () => inputRef.current?.click();

  return (
    <div className="flex max-h-[78vh] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="whitespace-pre-line rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          {helperTopText || `Tarefa ou Atualização de projeto?\nAntes de enviar, selecione o tipo da sua entrega.\n\nUse 'Tarefa' quando estiver enviando uma atividade nova.\nUse 'Atualização de projeto' quando estiver registrando a evolução de uma atividade, entrega ou projeto que já estava em andamento.\n\nPara concluir o envio, preencha pelo menos um dos campos de comprovação abaixo:\n- Link\n- Anexo\n- Relato\n\nVocê pode preencher apenas um deles ou mais de um, se desejar.`}
        </div>

        <div className="space-y-1.5">
          <Label>Tipo da entrega</Label>
          <Select value={submissionType} onValueChange={(v) => setSubmissionType(v as SubmissionType)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tarefa">Tarefa</SelectItem>
              <SelectItem value="atualizacao_projeto">Atualização de projeto</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Escolha se você está enviando uma atividade nova ou apenas atualizando algo que já estava em andamento.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Link do documento</Label>
          <Input
            type="url"
            placeholder="https://drive.google.com/..."
            value={evidenceLink}
            onChange={(e) => setEvidenceLink(e.target.value)}
          />
          <p className="text-xs text-gray-500">Cole aqui o link do arquivo salvo na nuvem, como Google Drive, OneDrive ou Dropbox.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Anexar arquivo</Label>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const ext = file.name.split(".").pop()?.toLowerCase() || "";
              if (!ACCEPTED_EXTENSIONS.includes(ext)) {
                toast.error("Formato de arquivo inválido. Envie PDF, DOC, DOCX, JPG, JPEG, PNG ou WEBP.");
                return;
              }
              if (file.size > MAX_FILE_SIZE) {
                toast.error("O anexo deve ter no máximo 10MB.");
                return;
              }

              setEvidenceFile(file);
            }}
          />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handlePickFile}>
              <Paperclip className="mr-1 h-3 w-3" /> Anexar arquivo
            </Button>
            {evidenceFile && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                {evidenceFile.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">Envie aqui um documento, imagem ou comprovante salvo no seu computador ou celular.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Relato da entrega</Label>
          <Textarea
            value={relatoAluno}
            onChange={(e) => setRelatoAluno(e.target.value)}
            placeholder="Descreva o que foi feito..."
            className="min-h-[90px]"
          />
          <p className="text-xs text-gray-500">Descreva o que foi feito, entregue, encaminhado ou atualizado nesta atividade.</p>
        </div>

        {isTarefa && (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-600" />
              <Label>Aplicabilidade prática</Label>
            </div>
            <Textarea
              value={textoAplicabilidade}
              onChange={(e) => setTextoAplicabilidade(e.target.value)}
              placeholder="Explique a aplicação prática..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">Explique como você aplicou na prática o que aprendeu nesta atividade, no trabalho, em um projeto, na rotina ou em uma situação real.</p>

            <div className="space-y-2">
              <p className="text-xs text-gray-500">Dê uma nota de 0 a 10 para o quanto essa atividade ampliou seu conhecimento ou sua habilidade prática.</p>
              <div className="flex flex-wrap gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={notaAlunoAplicabilidade === n ? "default" : "outline"}
                    className={notaAlunoAplicabilidade === n ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    onClick={() => setNotaAlunoAplicabilidade(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-4 space-y-2 border-t bg-white pt-3">
        {validationError && <p className="text-xs text-red-600">{validationError}</p>}
        {submitError && <p className="text-xs text-red-600">{submitError}</p>}
        <Button
          type="button"
          disabled={isSubmitting || !!validationError}
          className="w-full bg-[#F5991F] text-white hover:bg-[#F5991F]/90"
          onClick={async () => {
            if (validationError) {
              toast.error(validationError);
              return;
            }

            const payload: SubmissionPayload = {
              submissionType: submissionType as SubmissionType,
            };

            if (evidenceLink.trim()) payload.evidenceLink = evidenceLink.trim();
            if (relatoAluno.trim()) payload.relatoAluno = relatoAluno.trim();
            if (evidenceFile) {
              payload.evidenceFileName = evidenceFile.name;
              payload.evidenceFileBase64 = await toBase64(evidenceFile);
            }

            if (submissionType === "tarefa") {
              payload.textoAplicabilidade = textoAplicabilidade.trim();
              payload.notaAlunoAplicabilidade = notaAlunoAplicabilidade;
            }

            await onSubmit(payload);
            toast.success(successMessage);
            onSuccess?.();
          }}
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Enviando..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
