import { describe, it, expect } from 'vitest';

/**
 * Testes para a correção do bug da Walbenia:
 * 1. Filtro por macroInicio - eventos anteriores ao macrociclo NÃO geram ausência
 * 2. Deduplicação por título + data - evita falsos positivos com aulas diferentes
 */

// Simular a lógica de filtro de eventos por macroInicio (mesma lógica usada em routers.ts)
function filterEventsForAbsence(
  events: Array<{ id: number; title: string; eventDate: Date | null }>,
  participatedEventIds: Set<number>,
  macroInicio: Date | null
): Array<{ id: number; title: string; eventDate: Date | null; presenca: 'ausente' }> {
  const result: Array<{ id: number; title: string; eventDate: Date | null; presenca: 'ausente' }> = [];
  for (const evt of events) {
    if (participatedEventIds.has(evt.id)) continue;
    // FILTRO: só marcar ausência se evento >= macroInicio
    if (macroInicio && evt.eventDate) {
      if (evt.eventDate < macroInicio) continue;
    }
    result.push({
      id: evt.id,
      title: evt.title,
      eventDate: evt.eventDate,
      presenca: 'ausente',
    });
  }
  return result;
}

// Simular a lógica de deduplicação por título + data
function deduplicateEvents(
  events: Array<{ id: number; title: string; eventDate: Date | null }>
): Array<{ id: number; title: string; eventDate: Date | null }> {
  const normTitle = (t: string | null): string => {
    if (!t) return '';
    return t.toLowerCase().trim()
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/\s*-\s*/g, ' - ')
      .trim();
  };
  const coreTitle = (n: string): string => n.replace(/^(\d{4}\/\d+\s*-\s*)?(aula\s*\d+\s*-\s*)?/i, '').trim();
  
  const seen = new Map<string, (typeof events)[0]>();
  const deduped: typeof events = [];
  for (const evt of events) {
    const core = coreTitle(normTitle(evt.title));
    const dateStr = evt.eventDate ? evt.eventDate.toISOString().split('T')[0] : 'nodate';
    const dedupKey = `${core}|${dateStr}`;
    if (!seen.has(dedupKey)) {
      seen.set(dedupKey, evt);
      deduped.push(evt);
    }
  }
  return deduped;
}

describe('Filtro por macroInicio - Correção Bug Walbenia', () => {
  const macroInicio = new Date('2025-09-01');
  
  const eventsBeforeMacro = [
    { id: 1, title: 'Evento Out/2024', eventDate: new Date('2024-10-15') },
    { id: 2, title: 'Evento Jan/2025', eventDate: new Date('2025-01-20') },
    { id: 3, title: 'Evento Ago/2025', eventDate: new Date('2025-08-31') },
  ];
  
  const eventsAfterMacro = [
    { id: 4, title: 'Evento Set/2025', eventDate: new Date('2025-09-01') },
    { id: 5, title: 'Evento Out/2025', eventDate: new Date('2025-10-15') },
    { id: 6, title: 'Evento Nov/2025', eventDate: new Date('2025-11-20') },
  ];
  
  const allEvents = [...eventsBeforeMacro, ...eventsAfterMacro];
  
  it('deve filtrar eventos anteriores ao macroInicio', () => {
    const participatedIds = new Set<number>();
    const absences = filterEventsForAbsence(allEvents, participatedIds, macroInicio);
    
    expect(absences).toHaveLength(3);
    expect(absences.map(a => a.id)).toEqual([4, 5, 6]);
  });
  
  it('não deve marcar ausência para eventos com participação', () => {
    const participatedIds = new Set([4, 5]);
    const absences = filterEventsForAbsence(allEvents, participatedIds, macroInicio);
    
    expect(absences).toHaveLength(1);
    expect(absences[0].id).toBe(6);
  });
  
  it('deve incluir todos os eventos se macroInicio for null', () => {
    const participatedIds = new Set<number>();
    const absences = filterEventsForAbsence(allEvents, participatedIds, null);
    
    expect(absences).toHaveLength(6);
  });
  
  it('deve incluir eventos sem data quando macroInicio existe', () => {
    const eventsWithNull = [
      ...allEvents,
      { id: 7, title: 'Evento sem data', eventDate: null },
    ];
    const participatedIds = new Set<number>();
    const absences = filterEventsForAbsence(eventsWithNull, participatedIds, macroInicio);
    
    // 3 eventos após macroInicio + 1 evento sem data (não é filtrado)
    expect(absences).toHaveLength(4);
    expect(absences.map(a => a.id)).toContain(7);
  });
  
  it('evento exatamente na data do macroInicio deve ser incluído', () => {
    const participatedIds = new Set<number>();
    const absences = filterEventsForAbsence(allEvents, participatedIds, macroInicio);
    
    expect(absences.map(a => a.id)).toContain(4);
  });
  
  it('cenário Walbenia: 15 eventos antes do macro + 5 depois = apenas 5 ausências', () => {
    // Simular cenário real da Walbenia
    const beforeEvents = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Evento ${i + 1}`,
      eventDate: new Date(2024, (i % 12), 15), // Usar construtor Date com mês 0-indexed
    }));
    const afterEvents = [
      { id: 16, title: 'Evento 16', eventDate: new Date('2025-09-15') },
      { id: 17, title: 'Evento 17', eventDate: new Date('2025-10-15') },
      { id: 18, title: 'Evento 18', eventDate: new Date('2025-11-15') },
      { id: 19, title: 'Evento 19', eventDate: new Date('2025-12-15') },
      { id: 20, title: 'Evento 20', eventDate: new Date('2026-01-15') },
    ];
    const walbeniaEvents = [...beforeEvents, ...afterEvents];
    
    // Walbenia não tem participação em nenhum evento
    const walbeniaParticipated = new Set<number>();
    
    const absences = filterEventsForAbsence(walbeniaEvents, walbeniaParticipated, macroInicio);
    
    // Apenas os 5 eventos após macroInicio devem gerar ausência
    expect(absences).toHaveLength(5);
    absences.forEach(a => {
      expect(a.eventDate!.getTime()).toBeGreaterThanOrEqual(macroInicio.getTime());
    });
  });
});

describe('Deduplicação de Eventos por Título + Data', () => {
  it('deve deduplicar eventos com mesmo título normalizado e mesma data', () => {
    const events = [
      { id: 1, title: '2025/19 - Estrutura e Conceitos', eventDate: new Date('2025-10-15') },
      { id: 2, title: '2025/19 - Aula 01 - Estrutura e Conceitos', eventDate: new Date('2025-10-15') },
      { id: 3, title: '2025/19 - Aula 01 \u2013 Estrutura e Conceitos', eventDate: new Date('2025-10-15') },
    ];
    
    const deduped = deduplicateEvents(events);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe(1);
  });
  
  it('NÃO deve deduplicar eventos com mesmo título mas datas diferentes', () => {
    const events = [
      { id: 1, title: '2026/03 - Aula 01 - Resiliência e Proatividade', eventDate: new Date('2026-01-15') },
      { id: 2, title: '2026/04 - Aula 02 - Resiliência e Proatividade', eventDate: new Date('2026-02-15') },
    ];
    
    const deduped = deduplicateEvents(events);
    expect(deduped).toHaveLength(2);
  });
  
  it('deve deduplicar variações de traço (en-dash vs hyphen)', () => {
    const events = [
      { id: 1, title: '2025/19 - Aula 01 - Conceitos', eventDate: new Date('2025-10-15') },
      { id: 2, title: '2025/19 - Aula 01 \u2013 Conceitos', eventDate: new Date('2025-10-15') },
      { id: 3, title: '2025/19 - Aula 01 \u2014 Conceitos', eventDate: new Date('2025-10-15') },
    ];
    
    const deduped = deduplicateEvents(events);
    expect(deduped).toHaveLength(1);
  });
  
  it('deve manter eventos com títulos completamente diferentes', () => {
    const events = [
      { id: 1, title: 'Evento A', eventDate: new Date('2025-10-15') },
      { id: 2, title: 'Evento B', eventDate: new Date('2025-10-15') },
      { id: 3, title: 'Evento C', eventDate: new Date('2025-11-15') },
    ];
    
    const deduped = deduplicateEvents(events);
    expect(deduped).toHaveLength(3);
  });
  
  it('deve tratar eventos sem data como grupo separado', () => {
    const events = [
      { id: 1, title: 'Evento X', eventDate: null },
      { id: 2, title: 'Evento X', eventDate: null },
      { id: 3, title: 'Evento X', eventDate: new Date('2025-10-15') },
    ];
    
    const deduped = deduplicateEvents(events);
    expect(deduped).toHaveLength(2);
  });
});
