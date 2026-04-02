import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

interface RelatorioPerformanceDownloadProps {
  alunoId?: number;
  programId?: number;
  label?: string;
}

export function RelatorioPerformanceDownload({
  alunoId,
  programId,
  label = 'Baixar Relatório de Performance',
}: RelatorioPerformanceDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const gerarExcelMutation = trpc.relatorioPerformance.gerarExcel.useMutation({
    onSuccess: (data) => {
      // Fazer download do arquivo
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Relatório gerado com sucesso! (${data.totalRegistros} registros)`);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error?.message || 'Erro ao gerar relatório');
      setIsLoading(false);
    },
  });

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await gerarExcelMutation.mutateAsync({
        alunoId,
        programId,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
