import { describe, expect, it } from 'vitest';
import { calcularResumoCobrancasFormularios } from './cobrancaIndicadoresHelpers';

describe('calcularResumoCobrancasFormularios', () => {
  it('conta o mesmo formulário uma única vez mesmo com múltiplas cobranças', () => {
    const resumo = calcularResumoCobrancasFormularios(
      [
        {
          processoDbId: 10,
          formKey: 'pesquisa',
          ciclo: 1,
          papel: 'Colaborador',
          cobradoEm: '2026-09-30T12:00:00.000Z',
        },
        {
          processoDbId: 10,
          formKey: 'pesquisa',
          ciclo: 1,
          papel: 'Colaborador',
          cobradoEm: '2026-10-03T12:00:00.000Z',
        },
      ],
      [
        {
          processoDbId: 10,
          respostas: [],
          formulariosPendentes: [
            { formKey: 'pesquisa', ciclo: 1, papel: 'Colaborador' },
          ],
        },
      ],
    );

    expect(resumo).toEqual({
      formulariosCobrados: 1,
      respondidosPosCobranca: 0,
      pendentesPosCobranca: 1,
      semConfirmacao: 0,
    });
  });

  it('considera respondido pós-cobrança somente quando a resposta é posterior à última cobrança', () => {
    const resumo = calcularResumoCobrancasFormularios(
      [
        {
          processoDbId: 20,
          formKey: 'aval',
          ciclo: 1,
          papel: 'Gestor',
          cobradoEm: '2026-10-01T10:00:00.000Z',
        },
      ],
      [
        {
          processoDbId: 20,
          respostas: [
            {
              form: 'aval',
              ciclo: 1,
              papel: 'Gestor',
              submittedAt: '2026-10-02T09:00:00.000Z',
            },
          ],
          formulariosPendentes: [],
        },
      ],
    );

    expect(resumo.formulariosCobrados).toBe(1);
    expect(resumo.respondidosPosCobranca).toBe(1);
    expect(resumo.pendentesPosCobranca).toBe(0);
    expect(resumo.semConfirmacao).toBe(0);
  });

  it('não classifica como respondido uma resposta anterior à cobrança', () => {
    const resumo = calcularResumoCobrancasFormularios(
      [
        {
          processoDbId: 30,
          formKey: 'aval',
          ciclo: 1,
          papel: 'Anjo',
          cobradoEm: '2026-10-02T10:00:00.000Z',
        },
      ],
      [
        {
          processoDbId: 30,
          respostas: [
            {
              form: 'aval',
              ciclo: 1,
              papel: 'Anjo',
              submittedAt: '2026-10-01T09:00:00.000Z',
            },
          ],
          formulariosPendentes: [],
        },
      ],
    );

    expect(resumo.respondidosPosCobranca).toBe(0);
    expect(resumo.pendentesPosCobranca).toBe(0);
    expect(resumo.semConfirmacao).toBe(1);
  });

  it('reconhece pesquisa mesmo quando a resposta histórica não possui papel', () => {
    const resumo = calcularResumoCobrancasFormularios(
      [
        {
          processoId: 'proc-40',
          formKey: 'pesquisa',
          ciclo: 2,
          papel: 'Colaborador',
          cobradoEm: '2026-10-01T08:00:00.000Z',
        },
      ],
      [
        {
          id: 'proc-40',
          respostas: [
            {
              form: 'pesquisa',
              ciclo: 2,
              papel: '',
              submittedAt: '2026-10-01T15:00:00.000Z',
            },
          ],
          formulariosPendentes: [],
        },
      ],
    );

    expect(resumo.respondidosPosCobranca).toBe(1);
  });

  it('mantém como pendente quando não há resposta e o formulário segue na lista de pendências', () => {
    const resumo = calcularResumoCobrancasFormularios(
      [
        {
          processoDbId: 50,
          formKey: 'bem',
          ciclo: 0,
          papel: 'Gestor',
          cobradoEm: '2026-10-01T08:00:00.000Z',
        },
      ],
      [
        {
          processoDbId: 50,
          respostas: [],
          formulariosPendentes: [
            { formKey: 'bem', ciclo: 0, papel: 'Gestor' },
          ],
        },
      ],
    );

    expect(resumo.pendentesPosCobranca).toBe(1);
    expect(resumo.respondidosPosCobranca).toBe(0);
  });

  it('não quebra quando o histórico não possui vínculo de processo suficiente', () => {
    const resumo = calcularResumoCobrancasFormularios(
      [
        {
          id: 'registro-sem-processo',
          formKey: 'pesquisa',
          ciclo: 1,
          papel: 'Colaborador',
          cobradoEm: '2026-10-01T08:00:00.000Z',
        },
      ],
      [],
    );

    expect(resumo.formulariosCobrados).toBe(1);
    expect(resumo.semConfirmacao).toBe(1);
  });
});
