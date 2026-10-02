import { CalendarioCheckIllustration } from "./ProgramaIntegracaoIllustrations";

export function ProgramaIntegracaoEmptyState({
  titulo,
  texto,
  onLimpar,
  acao = "Limpar filtro",
}: {
  titulo: string;
  texto: string;
  onLimpar?: () => void;
  acao?: string;
}) {
  return (
    <div className="pi-empty-state">
      <CalendarioCheckIllustration />
      <h4>{titulo}</h4>
      <p>{texto}</p>
      {onLimpar && (
        <div className="pi-empty-actions">
          <button type="button" className="pi-btn pi-btn--ghost" onClick={onLimpar}>
            {acao}
          </button>
        </div>
      )}
    </div>
  );
}
