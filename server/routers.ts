import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { processExcelBuffer, uploadExcelToStorage, generateDashboardData, validateExcelStructure, createExcelFromData, processBemExcelFile, detectBemFileType, MentoringRecord, EventRecord, PerformanceRecord } from "./excelProcessor";
import { calcularIndicadoresTodosAlunos, agregarIndicadores, gerarDashboardGeral, gerarDashboardEmpresa, obterEmpresas, obterTurmas, StudentIndicators } from "./indicatorsCalculator";
import { notifyOwner } from "./_core/notification";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  }
  return next({ ctx });
});

// Manager or Admin procedure
const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a gerentes e administradores' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User management
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "manager"])
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    
    updateDepartment: adminProcedure
      .input(z.object({
        userId: z.number(),
        departmentId: z.number().nullable()
      }))
      .mutation(async ({ input }) => {
        await db.updateUserDepartment(input.userId, input.departmentId);
        return { success: true };
      }),
    
    byDepartment: managerProcedure
      .input(z.object({ departmentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getUsersByDepartment(input.departmentId);
      }),
  }),

  // Department management
  departments: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllDepartments();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        managerId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDepartment(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        managerId: z.number().nullable().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDepartment(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDepartment(input.id);
        return { success: true };
      }),
  }),

  // Upload management
  uploads: router({
    createBatch: protectedProcedure
      .input(z.object({
        weekNumber: z.number(),
        year: z.number(),
        notes: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createUploadBatch({
          ...input,
          uploadedBy: ctx.user.id,
          status: "pending"
        });
        return { id, success: true };
      }),
    
    uploadFile: protectedProcedure
      .input(z.object({
        batchId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        fileType: z.enum(["sebraeacre_mentorias", "sebraeacre_eventos", "sebraeto_mentorias", "sebraeto_eventos", "embrapii_mentorias", "embrapii_eventos", "performance"])
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Upload to S3
        const { fileKey, fileUrl } = await uploadExcelToStorage(buffer, input.fileName, ctx.user.id);
        
        // Process the Excel file
        const result = processExcelBuffer(buffer);
        
        if (!result.success) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: result.error || 'Erro ao processar arquivo' 
          });
        }
        
        // Validate structure
        const validation = validateExcelStructure(result.sheets);
        if (!validation.valid) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: validation.errors.join('; ') 
          });
        }
        
        // Save file record
        const fileId = await db.createUploadedFile({
          batchId: input.batchId,
          fileName: input.fileName,
          fileKey,
          fileUrl,
          fileType: input.fileType,
          fileSize: buffer.length,
          rowCount: result.totalRows,
          columnCount: result.totalColumns,
          status: "processed"
        });
        
        return { 
          fileId, 
          success: true,
          sheets: result.sheets.map(s => ({
            name: s.sheetName,
            rows: s.rowCount,
            columns: s.columnCount
          }))
        };
      }),
    
    completeBatch: protectedProcedure
      .input(z.object({ batchId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUploadBatchStatus(input.batchId, "completed");
        
        // Get batch info for notification
        const batch = await db.getUploadBatchById(input.batchId);
        const files = await db.getFilesByBatchId(input.batchId);
        
        // Notify admin
        await notifyOwner({
          title: "Novas planilhas carregadas",
          content: `Um novo lote de planilhas foi carregado por ${ctx.user.name || 'Usuário'}.\n\nSemana: ${batch?.weekNumber}/${batch?.year}\nArquivos: ${files.length}\nTotal de registros: ${files.reduce((sum, f) => sum + (f.rowCount || 0), 0)}`
        });
        
        return { success: true };
      }),
    
    listBatches: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getUploadBatches(input?.limit || 50);
      }),
    
    getBatchFiles: protectedProcedure
      .input(z.object({ batchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFilesByBatchId(input.batchId);
      }),
  }),

  // Formulas management
  formulas: router({
    list: adminProcedure.query(async () => {
      return await db.getActiveFormulas();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        formula: z.string().min(1),
        variables: z.record(z.string(), z.unknown()).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFormula({
          ...input,
          createdBy: ctx.user.id
        });
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        formula: z.string().min(1).optional(),
        variables: z.record(z.string(), z.unknown()).optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFormula(id, data);
        return { success: true };
      }),
    
    deactivate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deactivateFormula(input.id);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFormula(input.id);
        return { success: true };
      }),
  }),

  // Dashboard data
  dashboard: router({
    adminMetrics: adminProcedure
      .input(z.object({ batchId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const metrics = await db.getAdminMetrics(input?.batchId);
        const stats = await db.getSystemStats();
        return { metrics, stats };
      }),
    
    managerMetrics: managerProcedure
      .input(z.object({ 
        departmentId: z.number(),
        batchId: z.number().optional() 
      }))
      .query(async ({ input }) => {
        return await db.getManagerMetrics(input.departmentId, input.batchId);
      }),
    
    individualMetrics: protectedProcedure
      .input(z.object({ batchId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getIndividualMetrics(ctx.user.id, input?.batchId);
      }),
    
    history: protectedProcedure
      .input(z.object({
        scope: z.enum(["admin", "manager", "individual"]),
        scopeId: z.number().optional(),
        limit: z.number().optional()
      }))
      .query(async ({ ctx, input }) => {
        // Validate access
        if (input.scope === "admin" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        if (input.scope === "manager" && ctx.user.role === "user") {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const scopeId = input.scope === "individual" ? ctx.user.id : input.scopeId;
        return await db.getMetricsHistory(input.scope, scopeId, input.limit);
      }),
    
    latestBatch: protectedProcedure.query(async () => {
      return await db.getLatestBatch();
    }),
  }),

  // Reports
  reports: router({
    generate: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["admin", "manager", "individual"]),
        format: z.enum(["pdf", "excel"]),
        scopeId: z.number().optional(),
        parameters: z.record(z.string(), z.unknown()).optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate access
        if (input.type === "admin" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        if (input.type === "manager" && ctx.user.role === "user") {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const id = await db.createReport({
          ...input,
          generatedBy: ctx.user.id
        });
        
        return { id, success: true };
      }),
    
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return await db.getAllReports(input?.limit);
        }
        return await db.getReportsByUser(ctx.user.id, input?.limit);
      }),
  }),

  // System stats
  stats: router({
    overview: adminProcedure.query(async () => {
      return await db.getSystemStats();
    }),
  }),

  // Programs (Empresas)
  programs: router({
    list: protectedProcedure.query(async () => {
      return await db.getPrograms();
    }),
    
    stats: adminProcedure.query(async () => {
      return await db.getProgramStats();
    }),
  }),

  // Turmas
  turmas: router({
    list: protectedProcedure
      .input(z.object({ programId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getTurmas(input?.programId);
      }),
  }),

  // Alunos
  alunos: router({
    list: protectedProcedure
      .input(z.object({ programId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAlunos(input?.programId);
      }),
    
    byTurma: protectedProcedure
      .input(z.object({ turmaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAlunosByTurma(input.turmaId);
      }),
  }),

  // Indicadores BEM
  indicadores: router({
    // Dashboard Visão Geral (consolidado de todas as empresas)
    visaoGeral: adminProcedure.query(async () => {
      // Buscar todos os dados de mentorias e eventos
      const mentoringSessions = await db.getAllMentoringSessions();
      const eventParticipations = await db.getAllEventParticipation();
      const alunosList = await db.getAlunos();
      const programsList = await db.getPrograms();
      
      // Converter para formato do calculador
      const mentorias: MentoringRecord[] = [];
      const eventos: EventRecord[] = [];
      const performance: PerformanceRecord[] = [];
      
      // Mapear alunos e programas
      const alunoMap = new Map(alunosList.map(a => [a.id, a]));
      const programMap = new Map(programsList.map(p => [p.id, p]));
      
      for (const session of mentoringSessions) {
        const aluno = alunoMap.get(session.alunoId);
        if (!aluno) continue;
        const program = aluno.programId ? programMap.get(aluno.programId) : null;
        
        mentorias.push({
          idUsuario: aluno.externalId || String(aluno.id),
          nomeAluno: aluno.name,
          empresa: program?.name || 'Desconhecida',
          turma: String(aluno.turmaId || ''),
          presenca: session.presence as 'presente' | 'ausente',
          atividadeEntregue: (session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa',
          engajamento: session.engagementScore || undefined
        });
      }
      
      for (const participation of eventParticipations) {
        const aluno = alunoMap.get(participation.alunoId);
        if (!aluno) continue;
        const program = aluno.programId ? programMap.get(aluno.programId) : null;
        
        eventos.push({
          idUsuario: aluno.externalId || String(aluno.id),
          nomeAluno: aluno.name,
          empresa: program?.name || 'Desconhecida',
          tituloEvento: 'Evento',
          presenca: participation.status as 'presente' | 'ausente'
        });
      }
      
      // Calcular indicadores
      const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance);
      const dashboard = gerarDashboardGeral(indicadores);
      
      return dashboard;
    }),
    
    // Dashboard por Empresa
    porEmpresa: adminProcedure
      .input(z.object({ empresa: z.string() }))
      .query(async ({ input }) => {
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipation();
        const alunosList = await db.getAlunos();
        const programsList = await db.getPrograms();
        
        const mentorias: MentoringRecord[] = [];
        const eventos: EventRecord[] = [];
        const performance: PerformanceRecord[] = [];
        
        const alunoMap = new Map(alunosList.map(a => [a.id, a]));
        const programMap = new Map(programsList.map(p => [p.id, p]));
        
        for (const session of mentoringSessions) {
          const aluno = alunoMap.get(session.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          
          mentorias.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            turma: String(aluno.turmaId || ''),
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: (session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa',
            engajamento: session.engagementScore || undefined
          });
        }
        
        for (const participation of eventParticipations) {
          const aluno = alunoMap.get(participation.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          
          eventos.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            tituloEvento: 'Evento',
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
        
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance);
        const dashboard = gerarDashboardEmpresa(indicadores, input.empresa);
        
        return dashboard;
      }),
    
    // Dashboard por Turma
    porTurma: managerProcedure
      .input(z.object({ turmaId: z.number() }))
      .query(async ({ input }) => {
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipation();
        const alunosList = await db.getAlunosByTurma(input.turmaId);
        const programsList = await db.getPrograms();
        
        const mentorias: MentoringRecord[] = [];
        const eventos: EventRecord[] = [];
        const performance: PerformanceRecord[] = [];
        
        const alunoMap = new Map(alunosList.map(a => [a.id, a]));
        const programMap = new Map(programsList.map(p => [p.id, p]));
        
        for (const session of mentoringSessions) {
          const aluno = alunoMap.get(session.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          
          mentorias.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            turma: String(aluno.turmaId || ''),
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: (session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa',
            engajamento: session.engagementScore || undefined
          });
        }
        
        for (const participation of eventParticipations) {
          const aluno = alunoMap.get(participation.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          
          eventos.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            tituloEvento: 'Evento',
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
        
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance);
        const agregado = agregarIndicadores(indicadores, 'turma', String(input.turmaId));
        const alunos = indicadores.filter(i => i.turma === String(input.turmaId));
        
        return { visaoTurma: agregado, alunos };
      }),
    
    // Dashboard Individual (por aluno)
    porAluno: protectedProcedure
      .input(z.object({ alunoId: z.string() }))
      .query(async ({ input }) => {
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipation();
        const alunosList = await db.getAlunos();
        const programsList = await db.getPrograms();
        
        const mentorias: MentoringRecord[] = [];
        const eventos: EventRecord[] = [];
        const performance: PerformanceRecord[] = [];
        
        const alunoMap = new Map(alunosList.map(a => [a.id, a]));
        const programMap = new Map(programsList.map(p => [p.id, p]));
        
        for (const session of mentoringSessions) {
          const aluno = alunoMap.get(session.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          
          mentorias.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            turma: String(aluno.turmaId || ''),
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: (session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa',
            engajamento: session.engagementScore || undefined
          });
        }
        
        for (const participation of eventParticipations) {
          const aluno = alunoMap.get(participation.alunoId);
          if (!aluno) continue;
          const program = aluno.programId ? programMap.get(aluno.programId) : null;
          
          eventos.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeAluno: aluno.name,
            empresa: program?.name || 'Desconhecida',
            tituloEvento: 'Evento',
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
        
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance);
        const alunoIndicadores = indicadores.find(i => i.idUsuario === input.alunoId);
        
        if (!alunoIndicadores) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        return alunoIndicadores;
      }),
    
    // Lista de empresas disponíveis
    empresas: protectedProcedure.query(async () => {
      const programs = await db.getPrograms();
      return programs.map(p => ({ id: p.id, nome: p.name, codigo: p.code }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
