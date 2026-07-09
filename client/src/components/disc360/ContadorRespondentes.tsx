import { trpc } from "@/lib/trpc";

export default function ContadorRespondentes({ orgProfileId }: { orgProfileId: number }) {
  const { data: convites = [] } = trpc.disc360.listarConvitesCulturaEmpresa.useQuery(
    { orgProfileId },
    { enabled: !!orgProfileId }
  );

  const total = convites.length;
  const concluidos = convites.filter((c: any) => c.status === "concluido").length;
  const nomes = convites.map((c: any) => c.respondentName).join(", ");

  if (total === 0) {
    return <span className="text-xs text-muted-foreground">Nenhum respondente selecionado</span>;
  }

  return (
    <span className="text-xs text-muted-foreground" title={nomes}>
      {concluidos}/{total} respondente{total > 1 ? "s" : ""} selecionado{total > 1 ? "s" : ""}
    </span>
  );
}
