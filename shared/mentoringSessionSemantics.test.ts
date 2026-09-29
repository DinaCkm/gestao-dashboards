import { describe, expect, it } from "vitest";
import {
  isRealMentoringSession,
  isStandaloneMentoringTask,
} from "./mentoringSessionSemantics";

describe("mentoringSessionSemantics", () => {
  it("classifica tarefa livre isolada como tarefa, não como encontro", () => {
    const row = {
      taskMode: "livre",
      taskStatus: "nao_entregue",
      customTaskTitle: "Realizar atividade de onboarding",
      presence: "presente",
      engagementScore: null,
      notaEvolucao: null,
      feedback: null,
      mensagemAluno: null,
      appointmentId: null,
    };

    expect(isStandaloneMentoringTask(row)).toBe(true);
    expect(isRealMentoringSession(row)).toBe(false);
  });

  it("mantém como encontro uma sessão real que tenha tarefa livre e feedback", () => {
    expect(isStandaloneMentoringTask({
      taskMode: "livre",
      taskStatus: "nao_entregue",
      customTaskTitle: "Próxima ação",
      presence: "presente",
      engagementScore: null,
      notaEvolucao: null,
      feedback: "Sessão realizada e discutida com o aluno.",
      mensagemAluno: null,
      appointmentId: null,
    })).toBe(false);
  });

  it("mantém como encontro uma sessão real que tenha nota de evolução", () => {
    expect(isStandaloneMentoringTask({
      taskMode: "livre",
      taskStatus: "nao_entregue",
      customTaskTitle: "Próxima ação",
      presence: "presente",
      engagementScore: null,
      notaEvolucao: 7,
      feedback: null,
      mensagemAluno: null,
      appointmentId: null,
    })).toBe(false);
  });

  it("mantém como encontro uma sessão vinculada a agendamento", () => {
    expect(isStandaloneMentoringTask({
      taskMode: "livre",
      taskStatus: "nao_entregue",
      customTaskTitle: "Próxima ação",
      presence: "presente",
      engagementScore: null,
      notaEvolucao: null,
      feedback: null,
      mensagemAluno: null,
      appointmentId: 123,
    })).toBe(false);
  });

  it("não transforma linha livre sem título em tarefa isolada", () => {
    expect(isStandaloneMentoringTask({
      taskMode: "livre",
      taskStatus: "nao_entregue",
      customTaskTitle: null,
      presence: "presente",
      engagementScore: null,
      notaEvolucao: null,
      feedback: null,
      mensagemAluno: null,
      appointmentId: null,
    })).toBe(false);
  });

  it("sessão sem tarefa continua sendo encontro real", () => {
    expect(isRealMentoringSession({
      taskMode: "sem_tarefa",
      taskStatus: "sem_tarefa",
      customTaskTitle: null,
      presence: "presente",
      engagementScore: null,
      notaEvolucao: null,
      feedback: null,
      mensagemAluno: null,
      appointmentId: null,
    })).toBe(true);
  });
});
