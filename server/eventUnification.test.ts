import { describe, expect, it } from "vitest";
import { calcularIndicadoresAluno, CicloDataV2, CaseSucessoData } from "./indicatorsCalculatorV2";
import { EventRecord, MentoringRecord, PerformanceRecord } from "./excelProcessor";

/**
 * Testa a unificação de fontes de dados de eventos.
 * 
 * Antes da correção:
 * - O calculador V2 recebia apenas eventos com registro de participação (eventParticipation).
 * - Eventos onde o aluno faltou (sem registro) não eram contabilizados.
 * - Resultado: totalEventos = presenças, ausências = 0 (incorreto).
 * 
 * Após a correção:
 * - O array de eventos agora inclui registros de 'ausente' para eventos do programa
 *   onde o aluno não tem registro de participação.
 * - Resultado: totalEventos = todos os eventos do programa, ausências corretamente contabilizadas.
 */
describe("Unificação de fontes de dados de eventos", () => {
  const ciclos: CicloDataV2[] = [
    {
      id: 1,
      nomeCiclo: "Ciclo 1",
      trilhaNome: "Trilha Geral",
      dataInicio: "2025-01-01",
      dataFim: "2025-12-31",
      competenciaIds: [1, 2],
    },
  ];

  const compIdToCodigoMap = new Map<number, string>([
    [1, "COMP1"],
    [2, "COMP2"],
  ]);

  const casesData: CaseSucessoData[] = [];

  it("deve contar ausências corretamente quando eventos ausentes são incluídos no array", () => {
    // Simular a lógica UNIFICADA: 5 eventos no programa, 3 com presença, 2 sem registro (ausentes)
    const eventos: EventRecord[] = [
      // 3 eventos com presença registrada
      { idUsuario: "aluno1", nomeAluno: "João", empresa: "Empresa A", tituloEvento: "Webinar 1", dataEvento: new Date("2025-03-01"), presenca: "presente" },
      { idUsuario: "aluno1", nomeAluno: "João", empresa: "Empresa A", tituloEvento: "Webinar 2", dataEvento: new Date("2025-04-01"), presenca: "presente" },
      { idUsuario: "aluno1", nomeAluno: "João", empresa: "Empresa A", tituloEvento: "Webinar 3", dataEvento: new Date("2025-05-01"), presenca: "presente" },
      // 2 eventos ausentes (adicionados pela unificação)
      { idUsuario: "aluno1", nomeAluno: "João", empresa: "Empresa A", tituloEvento: "Webinar 4", dataEvento: new Date("2025-06-01"), presenca: "ausente" },
      { idUsuario: "aluno1", nomeAluno: "João", empresa: "Empresa A", tituloEvento: "Webinar 5", dataEvento: new Date("2025-07-01"), presenca: "ausente" },
    ];

    const mentorias: MentoringRecord[] = [];
    const performance: PerformanceRecord[] = [];

    const resultado = calcularIndicadoresAluno(
      "aluno1",
      mentorias,
      eventos,
      performance,
      ciclos,
      compIdToCodigoMap,
      casesData
    );

    // Verificar totais
    expect(resultado.totalEventos).toBe(5);
    expect(resultado.eventosPresente).toBe(3);
    
    // Verificar indicador 1 (webinars): 3/5 = 60%
    expect(resultado.consolidado.ind1_webinars).toBe(60);
    
    // Verificar detalhes do ciclo
    const ciclo = resultado.ciclosEmAndamento[0] || resultado.ciclosFinalizados[0];
    expect(ciclo).toBeDefined();
    expect(ciclo!.detalhes.webinars.total).toBe(5);
    expect(ciclo!.detalhes.webinars.presentes).toBe(3);
  });

  it("deve mostrar 100% quando todos os eventos do programa têm presença", () => {
    const eventos: EventRecord[] = [
      { idUsuario: "aluno2", nomeAluno: "Maria", empresa: "Empresa B", tituloEvento: "Webinar 1", dataEvento: new Date("2025-03-01"), presenca: "presente" },
      { idUsuario: "aluno2", nomeAluno: "Maria", empresa: "Empresa B", tituloEvento: "Webinar 2", dataEvento: new Date("2025-04-01"), presenca: "presente" },
    ];

    const resultado = calcularIndicadoresAluno(
      "aluno2",
      [],
      eventos,
      [],
      ciclos,
      compIdToCodigoMap,
      casesData
    );

    expect(resultado.totalEventos).toBe(2);
    expect(resultado.eventosPresente).toBe(2);
    expect(resultado.consolidado.ind1_webinars).toBe(100);
  });

  it("deve mostrar 0% quando todos os eventos são ausências", () => {
    const eventos: EventRecord[] = [
      { idUsuario: "aluno3", nomeAluno: "Pedro", empresa: "Empresa C", tituloEvento: "Webinar 1", dataEvento: new Date("2025-03-01"), presenca: "ausente" },
      { idUsuario: "aluno3", nomeAluno: "Pedro", empresa: "Empresa C", tituloEvento: "Webinar 2", dataEvento: new Date("2025-04-01"), presenca: "ausente" },
      { idUsuario: "aluno3", nomeAluno: "Pedro", empresa: "Empresa C", tituloEvento: "Webinar 3", dataEvento: new Date("2025-05-01"), presenca: "ausente" },
    ];

    const resultado = calcularIndicadoresAluno(
      "aluno3",
      [],
      eventos,
      [],
      ciclos,
      compIdToCodigoMap,
      casesData
    );

    expect(resultado.totalEventos).toBe(3);
    expect(resultado.eventosPresente).toBe(0);
    expect(resultado.consolidado.ind1_webinars).toBe(0);
  });

  it("deve retornar 0 eventos quando não há nenhum evento no programa", () => {
    const resultado = calcularIndicadoresAluno(
      "aluno4",
      [],
      [],
      [],
      ciclos,
      compIdToCodigoMap,
      casesData
    );

    expect(resultado.totalEventos).toBe(0);
    expect(resultado.eventosPresente).toBe(0);
    // Sem eventos, indicador é 0
    expect(resultado.consolidado.ind1_webinars).toBe(0);
  });

  it("deve manter consistência entre totalEventos, eventosPresente e o indicador 1", () => {
    // Cenário realista: 26 eventos no programa, 23 com presença, 3 ausentes
    const eventos: EventRecord[] = [];
    for (let i = 1; i <= 23; i++) {
      eventos.push({
        idUsuario: "aluno5",
        nomeAluno: "Ana",
        empresa: "Empresa D",
        tituloEvento: `Webinar ${i}`,
        dataEvento: new Date(`2025-${String(Math.ceil(i / 3)).padStart(2, "0")}-15`),
        presenca: "presente",
      });
    }
    for (let i = 24; i <= 26; i++) {
      eventos.push({
        idUsuario: "aluno5",
        nomeAluno: "Ana",
        empresa: "Empresa D",
        tituloEvento: `Webinar ${i}`,
        dataEvento: new Date(`2025-${String(Math.ceil(i / 3)).padStart(2, "0")}-15`),
        presenca: "ausente",
      });
    }

    const resultado = calcularIndicadoresAluno(
      "aluno5",
      [],
      eventos,
      [],
      ciclos,
      compIdToCodigoMap,
      casesData
    );

    // Cards de resumo
    expect(resultado.totalEventos).toBe(26);
    expect(resultado.eventosPresente).toBe(23);
    
    // Ausências = total - presenças
    const ausencias = resultado.totalEventos - resultado.eventosPresente;
    expect(ausencias).toBe(3);

    // Indicador 1: 23/26 ≈ 88.46%
    const expectedInd1 = Math.round((23 / 26) * 100 * 100) / 100;
    expect(resultado.consolidado.ind1_webinars).toBeCloseTo(expectedInd1, 1);
    
    // Detalhes do ciclo devem ser consistentes
    const ciclo = resultado.ciclosEmAndamento[0] || resultado.ciclosFinalizados[0];
    expect(ciclo).toBeDefined();
    expect(ciclo!.detalhes.webinars.total).toBe(26);
    expect(ciclo!.detalhes.webinars.presentes).toBe(23);
  });
});
