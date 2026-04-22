import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";

export default function EvolucaoAluno() {
  return (
    <AlunoLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 blur opacity-25 animate-pulse"></div>
          <div className="relative bg-white p-6 rounded-full shadow-xl border border-amber-100">
            <Sparkles className="h-16 w-16 text-amber-500" />
          </div>
        </div>

        <Card className="max-w-md w-full border-none shadow-2xl bg-gradient-to-br from-[#0A1E3E] to-[#1a3a6e] text-white overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Clock className="h-3 w-3" />
              Em Breve
            </div>
            
            <h1 className="text-3xl font-black tracking-tight">
              Aguarde! Novidades
            </h1>
            
            <p className="text-blue-100/80 leading-relaxed">
              Estamos preparando uma nova experiência para você acompanhar sua evolução de forma ainda mais detalhada e inspiradora.
            </p>
            
            <div className="pt-4">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-2/3 rounded-full animate-progress-loading"></div>
              </div>
              <p className="text-[10px] text-blue-200/50 mt-2 uppercase tracking-widest font-medium">
                Desenvolvimento em progresso
              </p>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-gray-400 text-xs font-medium">
          Ecossistema do BEM © 2026
        </p>
      </div>
    </AlunoLayout>
  );
}
