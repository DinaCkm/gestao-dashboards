import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";

type SubmissionPayload = {
  relatoAluno?: string;
  evidenceLink?: string;
  evidenceImageBase64?: string;
  evidenceImageName?: string;
};

type Props = {
  isSubmitting: boolean;
  submitError?: string;
  onSubmit: (payload: SubmissionPayload) => Promise<void>;
  onSuccess?: () => void;
};

const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

/** Formulário de envio de evidência para uma Micro Meta (Jornada de Superação).
 * A evidência fica registrada na própria meta e aguarda validação da mentora
 * antes de contar no indicador — o envio sozinho não conclui a meta. */
export function MetaEvidenciaForm({ isSubmitting, submitError, onSubmit, onSuccess }: Props) {
  const [evidenceLink, setEvidenceLink] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [relatoAluno, setRelatoAluno] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validationError = useMemo(() => {
    const trimmedLink = evidenceLink.trim();
    const trimmedRelato = relatoAluno.trim();
    if (!trimmedLink && !evidenceFile && !trimmedRelato) {
      return "Preencha pelo menos um dos campos: link, imagem ou relato.";
    }
    if (trimmedLink) {
      try { new URL(trimmedLink); } catch { return "Cole um link válido, começando com https://."; }
    }
    return null;
  }, [evidenceLink, evidenceFile, relatoAluno]);

  const handlePickFile = () => inputRef.current?.click();

  const handleSubmit = async () => {
    if (validationError) { toast.error(validationError); return; }
    const payload: SubmissionPayload = {
      relatoAluno: relatoAluno.trim() || undefined,
      evidenceLink: evidenceLink.trim() || undefined,
    };
    if (evidenceFile) {
      payload.evidenceImageBase64 = await toBase64(evidenceFile);
      payload.evidenceImageName = evidenceFile.name;
    }
    await onSubmit(payload);
    toast.success("Evidência enviada! Aguarde a validação da mentora.");
    onSuccess?.();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        Envie uma comprovação da micro meta (link, imagem e/ou relato). Após o envio, a mentora
        precisa validar a evidência para que ela conte no seu indicador de Jornada de Superação.
      </div>

      <div className="space-y-1.5">
        <Label>Link do documento (opcional)</Label>
        <Input
          type="url"
          placeholder="https://drive.google.com/..."
          value={evidenceLink}
          onChange={(e) => setEvidenceLink(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Anexar imagem (opcional)</Label>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
            if (!ACCEPTED_EXTENSIONS.includes(ext)) {
              toast.error("Formato inválido. Envie JPG, JPEG, PNG ou WEBP.");
              return;
            }
            if (file.size > MAX_FILE_SIZE) {
              toast.error("A imagem deve ter no máximo 10MB.");
              return;
            }
            setEvidenceFile(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={handlePickFile} className="w-full">
          <Paperclip className="h-3.5 w-3.5 mr-2" />
          {evidenceFile ? evidenceFile.name : "Escolher imagem"}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>Relato (opcional)</Label>
        <Textarea
          placeholder="Descreva como você cumpriu esta micro meta..."
          value={relatoAluno}
          onChange={(e) => setRelatoAluno(e.target.value)}
          rows={4}
        />
      </div>

      {submitError && (
        <p className="text-xs text-red-600">{submitError}</p>
      )}

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-[#F5991F] hover:bg-[#e08a1a]">
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? "Enviando..." : "Enviar evidência da micro meta"}
      </Button>
    </div>
  );
}
