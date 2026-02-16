import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Users, Target, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function PorEmpresa() {
  const { data: empresas, isLoading } = trpc.indicadores.empresas.useQuery();
  const { data: visaoGeral } = trpc.indicadores.visaoGeral.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Por Empresa</h1>
            <p className="text-muted-foreground">Carregando empresas...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard <span className="text-primary">Por Empresa</span>
          </h1>
          <p className="text-muted-foreground">
            Selecione uma empresa para ver os detalhes de performance
          </p>
        </div>

        {/* Resumo Geral */}
        {visaoGeral && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{empresas?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Programas ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visaoGeral.visaoGeral.totalAlunos}</div>
                <p className="text-xs text-muted-foreground">
                  Em todas as empresas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nota Média Geral</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visaoGeral.visaoGeral.mediaNotaFinal.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  De 0 a 10 pontos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alunos Excelência</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{visaoGeral.visaoGeral.alunosExcelencia}</div>
                <p className="text-xs text-muted-foreground">
                  {visaoGeral.visaoGeral.totalAlunos > 0 
                    ? `${((visaoGeral.visaoGeral.alunosExcelencia / visaoGeral.visaoGeral.totalAlunos) * 100).toFixed(0)}% do total`
                    : '0% do total'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cards de Empresas */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione uma Empresa</CardTitle>
            <CardDescription>Clique para ver o dashboard detalhado de cada empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {empresas && empresas.length > 0 ? (
                empresas.map(empresa => {
                  // Buscar dados da empresa na visão geral
                  const empresaData = visaoGeral?.porEmpresa?.find(
                    e => e.identificador === empresa.nome
                  );
                  
                  return (
                    <Link key={empresa.id} href={`/dashboard/empresa/${empresa.codigo}`}>
                      <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {empresa.nome}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {empresaData ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Alunos:</span>
                                <span className="font-medium">{empresaData.totalAlunos}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Nota Média:</span>
                                <span className="font-medium">{empresaData.mediaNotaFinal.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Mentorias:</span>
                                <span className="font-medium">{empresaData.mediaParticipacaoMentorias.toFixed(0)}%</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Clique para ver detalhes
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              ) : (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  Nenhuma empresa cadastrada. Faça upload das planilhas para começar.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
