import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { processExcelBuffer, uploadExcelToStorage, generateDashboardData, validateExcelStructure, createExcelFromData, processBemExcelFile, detectBemFileType, MentoringRecord, EventRecord, PerformanceRecord } from "./excelProcessor";
import { calcularIndicadoresTodosAlunos, calcularIndicadoresAluno, agregarIndicadores, gerarDashboardGeral, gerarDashboardEmpresa, obterEmpresas, obterTurmas, StudentIndicators, calcularIndicadoresAlunoFiltrado, calcularPerformanceFiltrada, CompetenciaObrigatoria, CicloExecucaoData } from './indicatorsCalculator';
import { notifyOwner } from "./_core/notification";
import { generateTemplate, validateSpreadsheet, TEMPLATE_STRUCTURES, TemplateType } from "./templateGenerator";

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
    
    // Login para administrador com usuário e senha
    adminLogin: publicProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1)
      }))
      .mutation(async ({ input, ctx }) => {
        const crypto = await import('crypto');
        const passwordHash = crypto.createHash('sha256').update(input.password).digest('hex');
        
        // Buscar usuário admin pelo openId (username) e verificar senha
        const result = await db.authenticateAdmin(input.username, passwordHash);
        
        if (!result.success) {
          return { success: false, message: result.message };
        }
        
        // Criar sessão
        const { sdk } = await import("./_core/sdk");
        const { ONE_YEAR_MS } = await import("@shared/const");
        const token = await sdk.createSessionToken(result.user.openId, {
          name: result.user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user: result.user };
      }),
    
    // Login universal por Email + CPF
    emailCpfLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
      cpf: z.string().min(1)
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.authenticateByEmailCpf(input.email, input.cpf);
        
        if (!result.success) {
          return { success: false, message: result.message };
        }
        
        // Criar sessão
        const { sdk } = await import("./_core/sdk");
        const { ONE_YEAR_MS } = await import("@shared/const");
        const token = await sdk.createSessionToken(result.user.openId, {
          name: result.user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user: result.user };
      }),
    
    // Login customizado para Alunos, Mentores e Gerentes
    customLogin: publicProcedure
      .input(z.object({
        type: z.enum(["aluno", "mentor", "gerente"]),
        id: z.string().min(1),
        email: z.string().email()
      }))
      .mutation(async ({ input, ctx }) => {
        let result;
        
        switch (input.type) {
          case "aluno":
            result = await db.authenticateAluno(input.id, input.email);
            break;
          case "mentor":
            result = await db.authenticateMentor(input.id, input.email);
            break;
          case "gerente":
            result = await db.authenticateGerente(input.id, input.email);
            break;
          default:
            return { success: false, message: "Tipo de login inválido" };
        }
        
        if (!result.success) {
          return { success: false, message: result.message };
        }
        
        // Criar usuário no sistema se não existir e criar sessão
        const openId = `custom_${input.type}_${result.user.id}`;
        await db.upsertUser({
          openId,
          name: result.user.name,
          email: result.user.email,
          loginMethod: `custom_${input.type}`,
          role: result.user.role as "user" | "admin" | "manager",
          lastSignedIn: new Date(),
        });
        
        // Usar o SDK para criar token de sessão
        const { sdk } = await import("./_core/sdk");
        const { ONE_YEAR_MS } = await import("@shared/const");
        const token = await sdk.createSessionToken(openId, {
          name: result.user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user: result.user };
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
    
    // Baixar template de planilha
    downloadTemplate: publicProcedure
      .input(z.object({
        type: z.enum(["mentorias", "eventos", "performance"])
      }))
      .mutation(async ({ input }) => {
        const buffer = generateTemplate(input.type as TemplateType);
        return {
          data: buffer.toString('base64'),
          filename: `modelo_${input.type}.xlsx`
        };
      }),
    
    // Obter estrutura esperada do template
    getTemplateStructure: publicProcedure
      .input(z.object({
        type: z.enum(["mentorias", "eventos", "performance"])
      }))
      .query(({ input }) => {
        return TEMPLATE_STRUCTURES[input.type as TemplateType];
      }),
    
    // Validar planilha antes do upload
    validateFile: protectedProcedure
      .input(z.object({
        fileData: z.string(), // Base64
        expectedType: z.enum(["mentorias", "eventos", "performance"])
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        return validateSpreadsheet(buffer, input.expectedType as TemplateType);
      }),
    
    // Listar histórico de uploads por tipo
    getUploadHistory: protectedProcedure
      .input(z.object({
        fileType: z.string().optional(),
        limit: z.number().optional()
      }).optional())
      .query(async ({ input }) => {
        return await db.getUploadHistory(input?.fileType, input?.limit || 10);
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
    
    listWithDetails: protectedProcedure.query(async () => {
      return await db.getTurmasWithDetails();
    }),
  }),

  // Trilhas (Catálogo de Trilhas)
  trilhas: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTrilhas();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTrilhaById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        codigo: z.string().optional(),
        ordem: z.number().optional(),
        programId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTrilha(input);
        return { success: true, id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        codigo: z.string().optional(),
        ordem: z.number().optional(),
        isActive: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTrilha(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteTrilha(input.id);
        if (!success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não é possível excluir trilha com competências vinculadas' });
        }
        return { success: true };
      }),
  }),

  // Competências (Catálogo de Competências)
  competencias: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCompetencias();
    }),
    
    listWithTrilha: protectedProcedure.query(async () => {
      return await db.getCompetenciasWithTrilha();
    }),
    
    byTrilha: protectedProcedure
      .input(z.object({ trilhaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCompetenciasByTrilha(input.trilhaId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCompetenciaById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        nome: z.string().min(1),
        trilhaId: z.number(),
        codigoIntegracao: z.string().optional(),
        descricao: z.string().optional(),
        ordem: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCompetencia(input);
        return { success: true, id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        trilhaId: z.number().optional(),
        codigoIntegracao: z.string().optional(),
        descricao: z.string().optional(),
        ordem: z.number().optional(),
        isActive: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCompetencia(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteCompetencia(input.id);
        return { success };
      }),
  }),

  // Plano Individual (Competências obrigatórias por aluno)
  planoIndividual: router({
    // Buscar plano de um aluno
    byAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanoIndividualByAluno(input.alunoId);
      }),
    
    // Adicionar competência ao plano
    addCompetencia: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        competenciaId: z.number(),
        isObrigatoria: z.number().optional(),
        metaNota: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const id = await db.addCompetenciaToPlano(input);
        return { success: true, id };
      }),
    
    // Adicionar múltiplas competências
    addMultiple: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        competenciaIds: z.array(z.number())
      }))
      .mutation(async ({ input }) => {
        const success = await db.addCompetenciasToPlano(input.alunoId, input.competenciaIds);
        return { success };
      }),
    
    // Remover competência do plano
    remove: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.removeCompetenciaFromPlano(input.id);
        return { success };
      }),
    
    // Atualizar item do plano
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        isObrigatoria: z.number().optional(),
        notaAtual: z.string().optional(),
        metaNota: z.string().optional(),
        status: z.enum(["pendente", "em_progresso", "concluida"]).optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const success = await db.updatePlanoIndividualItem(id, data);
        return { success };
      }),
    
    // Limpar plano de um aluno
    clear: adminProcedure
      .input(z.object({ alunoId: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.clearPlanoIndividual(input.alunoId);
        return { success };
      }),
    
    // Atribuir competências em lote para uma turma inteira
    addToTurma: adminProcedure
      .input(z.object({
        turmaId: z.number(),
        competenciaIds: z.array(z.number())
      }))
      .mutation(async ({ input }) => {
        const alunos = await db.getAlunosByTurma(input.turmaId);
        let totalAdded = 0;
        for (const aluno of alunos) {
          const success = await db.addCompetenciasToPlano(aluno.id, input.competenciaIds);
          if (success) totalAdded++;
        }
        return { success: true, alunosAtualizados: totalAdded, totalAlunos: alunos.length };
      }),
    
    // Listar alunos com progresso do plano
    alunosWithPlano: protectedProcedure
      .input(z.object({ programId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAlunosWithPlano(input?.programId);
      }),
    
    // Buscar competências obrigatórias de um aluno
    competenciasObrigatorias: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCompetenciasObrigatoriasAluno(input.alunoId);
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

    // Alunos vinculados a um mentor (via sessões de mentoria)
    byConsultor: protectedProcedure
      .input(z.object({ consultorId: z.number(), programId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getAlunosByConsultor(input.consultorId, input.programId);
      }),

    // Empresas/programas de um mentor (via alunos atendidos)
    programsByConsultor: protectedProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProgramsByConsultor(input.consultorId);
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
      const allPlanoItems = await db.getAllPlanoIndividual();
      
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
      
      // Adicionar dados de performance de competências do plano individual
      for (const item of allPlanoItems) {
        if (item.notaAtual) {
          const aluno = alunoMap.get(item.alunoId);
          if (!aluno) continue;
          performance.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeTurma: '',
            idCompetencia: String(item.competenciaId),
            nomeCompetencia: item.competenciaNome || '',
            notaAvaliacao: parseFloat(item.notaAtual),
            aprovado: parseFloat(item.notaAtual) >= 7,
          });
        }
      }
      
      // Buscar ciclos de execução
      const ciclosPorAluno = await db.getAllCiclosForCalculator();
      
      // Calcular indicadores
      const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno);
      const dashboard = gerarDashboardGeral(indicadores);
      
      return dashboard;
    }),
    
    // Dashboard por Empresa
    porEmpresa: managerProcedure
      .input(z.object({ empresa: z.string() }))
      .query(async ({ input }) => {
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipation();
        const alunosList = await db.getAlunos();
        const programsList = await db.getPrograms();
        const allPlanoItems = await db.getAllPlanoIndividual();
        
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
        
        for (const item of allPlanoItems) {
          if (item.notaAtual) {
            const aluno = alunoMap.get(item.alunoId);
            if (!aluno) continue;
            performance.push({
              idUsuario: aluno.externalId || String(aluno.id),
              nomeTurma: '',
              idCompetencia: String(item.competenciaId),
              nomeCompetencia: item.competenciaNome || '',
              notaAvaliacao: parseFloat(item.notaAtual),
              aprovado: parseFloat(item.notaAtual) >= 7,
            });
          }
        }
        
        const ciclosPorAluno = await db.getAllCiclosForCalculator();
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno);
        const dashboard = gerarDashboardEmpresa(indicadores, input.empresa);
        
        // Enriquecer alunos com turma, trilha, ciclo, competências
        const turmasList = await db.getTurmas();
        const turmaMap = new Map(turmasList.map(t => [t.id, t]));
        const consultorsList = await db.getConsultors();
        const consultorMap = new Map(consultorsList.map(c => [c.id, c]));
        
        const alunosEnriquecidos = dashboard.alunos.map(ind => {
          const alunoDb = alunosList.find(a => (a.externalId || String(a.id)) === ind.idUsuario);
          const turma = alunoDb?.turmaId ? turmaMap.get(alunoDb.turmaId) : null;
          const mentor = alunoDb?.consultorId ? consultorMap.get(alunoDb.consultorId) : null;
          
          // Extrair trilha do nome da turma
          let trilhaNome = 'Não definida';
          if (turma) {
            const pipeMatch = turma.name.match(/\|\s*(.+)$/);
            if (pipeMatch) trilhaNome = pipeMatch[1].trim();
            else {
              const dashMatch = turma.name.match(/- (.+?)(?:\s*\[.*\])?$/);
              if (dashMatch) trilhaNome = dashMatch[1].trim();
            }
          }
          
          // Competencias do plano individual
          const planoItems = allPlanoItems.filter(p => alunoDb && p.alunoId === alunoDb.id);
          const competencias = planoItems.map(p => ({
            nome: p.competenciaNome || 'Desconhecida',
            trilha: p.trilhaNome || 'Não definida',
            nota: p.notaAtual ? parseFloat(p.notaAtual) : null,
            meta: p.metaNota ? parseFloat(p.metaNota) : 7,
            status: p.status || 'pendente',
          }));
          
          // Ciclo atual
          const cicloAtual = ind.ciclosEmAndamento?.[0]?.nomeCiclo || 
            (ind.ciclosFinalizados?.length ? `${ind.ciclosFinalizados.length} ciclo(s) finalizado(s)` : 'Nenhum ciclo');
          
          return {
            ...ind,
            alunoDbId: alunoDb?.id || 0,
            turmaNome: turma?.name || 'Não definida',
            trilhaNome,
            cicloAtual,
            mentorNome: mentor?.name || 'Não definido',
            competencias,
            totalCompetencias: competencias.length,
            competenciasComNota: competencias.filter(c => c.nota !== null).length,
          };
        });
        
        return {
          ...dashboard,
          alunos: alunosEnriquecidos,
        };
      }),
    
    // Dashboard por Turma
    porTurma: managerProcedure
      .input(z.object({ turmaId: z.number() }))
      .query(async ({ input }) => {
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipation();
        const alunosList = await db.getAlunosByTurma(input.turmaId);
        const programsList = await db.getPrograms();
        const allPlanoItems = await db.getAllPlanoIndividual();
        
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
        
        // Adicionar dados de performance de competências do plano individual
        for (const item of allPlanoItems) {
          if (item.notaAtual) {
            const aluno = alunoMap.get(item.alunoId);
            if (!aluno) continue;
            performance.push({
              idUsuario: aluno.externalId || String(aluno.id),
              nomeTurma: '',
              idCompetencia: String(item.competenciaId),
              nomeCompetencia: item.competenciaNome || '',
              notaAvaliacao: parseFloat(item.notaAtual),
              aprovado: parseFloat(item.notaAtual) >= 7,
            });
          }
        }
        
        const ciclosPorAluno = await db.getAllCiclosForCalculator();
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno);
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
        const allPlanoItems = await db.getAllPlanoIndividual();
        
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
        
        // Adicionar dados de performance de competências do plano individual
        for (const item of allPlanoItems) {
          if (item.notaAtual) {
            const aluno = alunoMap.get(item.alunoId);
            if (!aluno) continue;
            performance.push({
              idUsuario: aluno.externalId || String(aluno.id),
              nomeTurma: '',
              idCompetencia: String(item.competenciaId),
              nomeCompetencia: item.competenciaNome || '',
              notaAvaliacao: parseFloat(item.notaAtual),
              aprovado: parseFloat(item.notaAtual) >= 7,
            });
          }
        }
        
        const ciclosPorAluno = await db.getAllCiclosForCalculator();
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno);
        const alunoIndicadores = indicadores.find(i => i.idUsuario === input.alunoId);
        
        if (!alunoIndicadores) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        return alunoIndicadores;
      }),
    
    // Detalhe completo de um aluno (competências, eventos, turma, trilha, ciclo)
    detalheAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        const detalhe = await db.getAlunoDetalheCompleto(input.alunoId);
        if (!detalhe) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        return detalhe;
      }),

    // Resumo de todos os alunos (turma, trilha, programa, competências)
    alunosResumo: protectedProcedure
      .input(z.object({ programId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAlunosResumo(input?.programId);
      }),

    // Lista de empresas disponíveis
    empresas: protectedProcedure.query(async () => {
      const programs = await db.getPrograms();
      return programs.map(p => ({ id: p.id, nome: p.name, codigo: p.code }));
    }),
    
    // Performance Filtrada - BLOCO 3
    // Calcula indicadores considerando apenas competências obrigatórias do plano individual
    performanceFiltrada: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        // Buscar aluno
        const alunosList = await db.getAlunos();
        const aluno = alunosList.find(a => a.id === input.alunoId);
        if (!aluno) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar competências obrigatórias do plano individual
        const competenciasObrigatorias = await db.getCompetenciasObrigatoriasAluno(input.alunoId);
        
        // Buscar dados de mentorias e eventos
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipation();
        const programsList = await db.getPrograms();
        
        const mentorias: MentoringRecord[] = [];
        const eventos: EventRecord[] = [];
        const performance: PerformanceRecord[] = [];
        
        const alunoMap = new Map(alunosList.map(a => [a.id, a]));
        const programMap = new Map(programsList.map(p => [p.id, p]));
        
        for (const session of mentoringSessions) {
          const sessionAluno = alunoMap.get(session.alunoId);
          if (!sessionAluno) continue;
          const program = sessionAluno.programId ? programMap.get(sessionAluno.programId) : null;
          
          mentorias.push({
            idUsuario: sessionAluno.externalId || String(sessionAluno.id),
            nomeAluno: sessionAluno.name,
            empresa: program?.name || 'Desconhecida',
            turma: String(sessionAluno.turmaId || ''),
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: (session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa',
            engajamento: session.engagementScore || undefined
          });
        }
        
        for (const participation of eventParticipations) {
          const partAluno = alunoMap.get(participation.alunoId);
          if (!partAluno) continue;
          const program = partAluno.programId ? programMap.get(partAluno.programId) : null;
          
          eventos.push({
            idUsuario: partAluno.externalId || String(partAluno.id),
            nomeAluno: partAluno.name,
            empresa: program?.name || 'Desconhecida',
            tituloEvento: 'Evento',
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
        
        // Converter competências para o formato esperado
        const compObrigatorias: CompetenciaObrigatoria[] = competenciasObrigatorias.map(c => ({
          competenciaId: c.competenciaId,
          codigoIntegracao: c.codigoIntegracao,
          notaAtual: c.notaAtual,
          metaNota: c.metaNota,
          status: c.status || 'pendente'
        }));
        
        // Buscar ciclos de execução do aluno
        const ciclosAluno = await db.getCiclosForCalculator(input.alunoId);
        
        // Calcular indicadores filtrados
        const idUsuario = aluno.externalId || String(aluno.id);
        const indicadores = calcularIndicadoresAlunoFiltrado(
          idUsuario,
          mentorias,
          eventos,
          performance,
          compObrigatorias,
          ciclosAluno
        );
        
        return {
          aluno: {
            id: aluno.id,
            nome: aluno.name,
            externalId: aluno.externalId
          },
          indicadores,
          planoIndividual: {
            totalCompetencias: compObrigatorias.length,
            competenciasAprovadas: indicadores.performanceFiltrada.aprovadas,
            percentualAprovacao: indicadores.performanceFiltrada.percentualAprovacao,
            mediaNotas: indicadores.performanceFiltrada.mediaNotas,
            detalhes: indicadores.performanceFiltrada.detalhes
          }
        };
      }),

    // Meu Dashboard - dados do aluno logado
    meuDashboard: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' });
      }

      // Tentar encontrar o aluno: primeiro pelo alunoId do user, depois email, depois openId
      let aluno: Awaited<ReturnType<typeof db.getAlunoByEmail>> | undefined;
      if (ctx.user.alunoId) {
        const allAlunos = await db.getAlunos();
        aluno = allAlunos.find(a => a.id === ctx.user!.alunoId) || undefined;
      }
      if (!aluno && ctx.user.email) {
        aluno = await db.getAlunoByEmail(ctx.user.email);
      }
      if (!aluno) {
        aluno = await db.getAlunoByExternalId(ctx.user.openId);
      }

      if (!aluno) {
        return { found: false as const, message: 'Nenhum perfil de aluno vinculado a esta conta.' };
      }

      // Buscar competências obrigatórias do plano individual
      const competenciasObrigatorias = await db.getCompetenciasObrigatoriasAluno(aluno.id);

      // Buscar dados globais para cálculo de indicadores e ranking
      const allSessions = await db.getAllMentoringSessions();
      const allEventParticipations = await db.getAllEventParticipation();
      const alunosList = await db.getAlunos();
      const programsList = await db.getPrograms();
      const turmasList = await db.getTurmas();

      const mentorias: MentoringRecord[] = [];
      const eventos: EventRecord[] = [];
      const performance: PerformanceRecord[] = [];

      const alunoMap = new Map(alunosList.map(a => [a.id, a]));
      const programMap = new Map(programsList.map(p => [p.id, p]));
      const turmaMap = new Map(turmasList.map(t => [t.id, t]));

      for (const session of allSessions) {
        const sessionAluno = alunoMap.get(session.alunoId);
        if (!sessionAluno) continue;
        const program = sessionAluno.programId ? programMap.get(sessionAluno.programId) : null;
        const turma = sessionAluno.turmaId ? turmaMap.get(sessionAluno.turmaId) : null;
        mentorias.push({
          idUsuario: sessionAluno.externalId || String(sessionAluno.id),
          nomeAluno: sessionAluno.name,
          empresa: program?.name || 'Desconhecida',
          turma: turma?.name || '',
          trilha: '',
          ciclo: session.ciclo || '',
          sessao: session.sessionNumber || 0,
          dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
          presenca: session.presence as 'presente' | 'ausente',
          atividadeEntregue: (session.taskStatus || 'sem_tarefa') as 'entregue' | 'nao_entregue' | 'sem_tarefa',
          engajamento: session.engagementScore || undefined,
          feedback: session.feedback || '',
        });
      }

      for (const ep of allEventParticipations) {
        const epAluno = alunoMap.get(ep.alunoId);
        if (!epAluno) continue;
        const program = epAluno.programId ? programMap.get(epAluno.programId) : null;
        eventos.push({
          idUsuario: epAluno.externalId || String(epAluno.id),
          nomeAluno: epAluno.name,
          empresa: program?.name || 'Desconhecida',
          turma: '',
          trilha: '',
          tituloEvento: 'Evento',
          dataEvento: undefined,
          presenca: ep.status as 'presente' | 'ausente',
        });
      }

      // Buscar performance de competências do plano individual
      const planoItems = await db.getPlanoIndividualByAluno(aluno.id);
      for (const item of planoItems) {
        if (item.notaAtual) {
          performance.push({
            idUsuario: aluno.externalId || String(aluno.id),
            nomeTurma: '',
            idCompetencia: String(item.competenciaId),
            nomeCompetencia: item.competenciaNome || '',
            notaAvaliacao: parseFloat(item.notaAtual),
            aprovado: parseFloat(item.notaAtual) >= 7,
          });
        }
      }

      const idUsuario = aluno.externalId || String(aluno.id);
      const compObrigatorias: CompetenciaObrigatoria[] = competenciasObrigatorias.map(c => ({
        competenciaId: c.competenciaId,
        codigoIntegracao: c.codigoIntegracao,
        notaAtual: c.notaAtual,
        metaNota: c.metaNota,
        status: c.status,
      }));

      // Buscar ciclos de execução do aluno
      const ciclosAluno = await db.getCiclosForCalculator(aluno.id);

      const indicadores = calcularIndicadoresAlunoFiltrado(
        idUsuario, mentorias, eventos, performance, compObrigatorias, ciclosAluno
      );

      // Buscar sessões individuais do aluno para histórico
      const sessoesAluno = await db.getMentoringSessionsByAluno(aluno.id);

      // Buscar participações em eventos do aluno com detalhes
      const eventosAluno = await db.getEventParticipationByAluno(aluno.id);
      // Buscar detalhes dos eventos
      const allEvents = aluno.programId ? await db.getEventsByProgram(aluno.programId) : [];
      const eventMap = new Map(allEvents.map(e => [e.id, e]));
      const eventosDetalhados = eventosAluno.map(ep => {
        const evento = eventMap.get(ep.eventId);
        return {
          id: ep.id,
          eventId: ep.eventId,
          titulo: evento?.title || `Evento #${ep.eventId}`,
          tipo: evento?.eventType || 'webinar',
          data: evento?.eventDate || null,
          status: ep.status,
        };
      });

      // Buscar programa, turma e mentor do aluno
      const programa = aluno.programId ? programMap.get(aluno.programId) : null;
      const turmaAluno = aluno.turmaId ? turmaMap.get(aluno.turmaId) : null;
      // Buscar mentor: primeiro pelo consultorId do aluno, senão pela sessão de mentoria mais recente
      let mentorAluno = aluno.consultorId ? await db.getConsultorById(aluno.consultorId) : null;
      if (!mentorAluno && sessoesAluno.length > 0) {
        // Buscar o consultor da sessão mais recente
        const sessaoComConsultor = [...sessoesAluno].reverse().find(s => s.consultorId);
        if (sessaoComConsultor?.consultorId) {
          mentorAluno = await db.getConsultorById(sessaoComConsultor.consultorId);
        }
      }

      // Calcular ranking na empresa (posição entre colegas da mesma empresa)
      let ranking = { posicao: 0, totalAlunos: 0 };
      if (aluno.programId) {
        const colegasEmpresa = alunosList.filter(a => a.programId === aluno!.programId && a.isActive === 1);
        // Calcular nota de cada colega
        const notasColegas: { alunoId: number; nota: number }[] = [];
        for (const colega of colegasEmpresa) {
          const colegaId = colega.externalId || String(colega.id);
          const compObrigatoriasColega = await db.getCompetenciasObrigatoriasAluno(colega.id);
          const planoColega = await db.getPlanoIndividualByAluno(colega.id);
          const perfColega: PerformanceRecord[] = [];
          for (const item of planoColega) {
            if (item.notaAtual) {
              perfColega.push({
                idUsuario: colegaId,
                nomeTurma: '',
                idCompetencia: String(item.competenciaId),
                nomeCompetencia: item.competenciaNome || '',
                notaAvaliacao: parseFloat(item.notaAtual),
                aprovado: parseFloat(item.notaAtual) >= 7,
              });
            }
          }
          const compObrigColega: CompetenciaObrigatoria[] = compObrigatoriasColega.map(c => ({
            competenciaId: c.competenciaId,
            codigoIntegracao: c.codigoIntegracao,
            notaAtual: c.notaAtual,
            metaNota: c.metaNota,
            status: c.status,
          }));
          const indColega = calcularIndicadoresAlunoFiltrado(
            colegaId, mentorias, eventos, perfColega, compObrigColega
          );
          notasColegas.push({ alunoId: colega.id, nota: indColega.notaFinal });
        }
        notasColegas.sort((a, b) => b.nota - a.nota);
        const posicao = notasColegas.findIndex(n => n.alunoId === aluno!.id) + 1;
        ranking = { posicao, totalAlunos: notasColegas.length };
      }

      return {
        found: true as const,
        aluno: {
          id: aluno.id,
          name: aluno.name,
          email: aluno.email,
          programa: programa?.name || 'Não definido',
          turma: turmaAluno?.name || 'Não definida',
          trilha: (() => {
            if (turmaAluno) {
              const pipeMatch = turmaAluno.name.match(/\|\s*(.+)$/);
              if (pipeMatch) return pipeMatch[1].trim();
              const dashMatch = turmaAluno.name.match(/- (.+?)(?:\s*\[.*\])?$/);
              if (dashMatch) return dashMatch[1].trim();
            }
            return 'Não definida';
          })(),
          cicloAtual: indicadores.ciclosEmAndamento?.[0]?.nomeCiclo || (indicadores.ciclosFinalizados?.length ? `${indicadores.ciclosFinalizados.length + (indicadores.ciclosEmAndamento?.length || 0)} ciclo(s)` : 'Nenhum ciclo'),
          mentor: mentorAluno?.name || 'Não definido',
        },
        indicadores: {
          participacaoMentorias: indicadores.participacaoMentorias,
          atividadesPraticas: indicadores.atividadesPraticas,
          engajamento: indicadores.engajamento,
          performanceCompetencias: indicadores.performanceCompetencias,
          performanceAprendizado: indicadores.performanceAprendizado,
          participacaoEventos: indicadores.participacaoEventos,
          performanceGeral: indicadores.performanceGeral,
          notaFinal: indicadores.notaFinal,
          classificacao: indicadores.classificacao,
          totalMentorias: indicadores.totalMentorias,
          mentoriasPresente: indicadores.mentoriasPresente,
          totalAtividades: indicadores.totalAtividades,
          atividadesEntregues: indicadores.atividadesEntregues,
          totalEventos: indicadores.totalEventos,
          eventosPresente: indicadores.eventosPresente,
          totalCompetencias: indicadores.totalCompetencias,
          competenciasAprovadas: indicadores.competenciasAprovadas,
          mediaEngajamentoRaw: indicadores.mediaEngajamentoRaw,
          engajamentoComponentes: indicadores.engajamentoComponentes,
          ciclosFinalizados: indicadores.ciclosFinalizados,
          ciclosEmAndamento: indicadores.ciclosEmAndamento,
        },
        ranking,
        sessoes: sessoesAluno.map(s => ({
          id: s.id,
          sessionNumber: s.sessionNumber,
          sessionDate: s.sessionDate,
          presence: s.presence,
          taskStatus: s.taskStatus,
          engagementScore: s.engagementScore,
          notaEvolucao: s.notaEvolucao,
          feedback: s.feedback,
          mensagemAluno: s.mensagemAluno,
          taskId: s.taskId,
          taskDeadline: s.taskDeadline,
          relatoAluno: s.relatoAluno,
          ciclo: s.ciclo,
        })),
        eventos: eventosDetalhados,
        planoIndividual: planoItems,
        assessments: await db.getAssessmentsByAluno(aluno.id),
        sessionProgress: await db.getSessionProgressByAluno(aluno.id),
      };
    }),
  }),

  // Mentor/Consultor routes
  mentor: router({
    // Lista todos os mentores
    list: protectedProcedure.query(async () => {
      return await db.getConsultors();
    }),

    // Detalhes de um mentor específico
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const consultor = await db.getConsultorById(input.id);
        if (!consultor) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Mentor não encontrado' });
        }
        return consultor;
      }),

    // Estatísticas completas de um mentor
    stats: protectedProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        const stats = await db.getConsultorStats(input.consultorId);
        if (!stats) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Estatísticas não encontradas' });
        }
        return stats;
      }),

    // Sessões de mentoria por aluno
    sessionsByAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMentoringSessionsByAluno(input.alunoId);
      }),
    
    // Progresso de sessões por aluno (baseado no Assessment PDI macro ciclo)
    sessionProgress: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSessionProgressByAluno(input.alunoId);
      }),

    // Progresso de sessões de todos os alunos (para admin/gerente)
    allSessionProgress: managerProcedure.query(async () => {
      return await db.getAllStudentsSessionProgress();
    }),

    // Enviar notificação ao admin sobre alunos a 1 sessão de fechar o ciclo
    notificarCicloQuaseFechando: managerProcedure.mutation(async () => {
      const allProgress = await db.getAllStudentsSessionProgress();
      const alunosFalta1 = allProgress.filter(p => p.faltaUmaSessao);
      const alunosCicloCompleto = allProgress.filter(p => p.cicloCompleto);
      
      if (alunosFalta1.length === 0 && alunosCicloCompleto.length === 0) {
        return { sent: false, message: 'Nenhum aluno a 1 sessão de fechar o ciclo ou com ciclo completo.' };
      }

      let content = '';
      
      if (alunosFalta1.length > 0) {
        content += `⚠️ ALUNOS A 1 SESSÃO DE FECHAR O CICLO MACRO (${alunosFalta1.length}):\n\n`;
        alunosFalta1.forEach(p => {
          content += `• ${p.alunoNome} - ${p.programaNome || 'Sem programa'} (${p.sessoesRealizadas}/${p.totalSessoesEsperadas} sessões)`;
          if (p.consultorNome) content += ` | Mentor: ${p.consultorNome}`;
          content += '\n';
        });
      }
      
      if (alunosCicloCompleto.length > 0) {
        content += `\n✅ ALUNOS COM CICLO COMPLETO (${alunosCicloCompleto.length}):\n\n`;
        alunosCicloCompleto.forEach(p => {
          content += `• ${p.alunoNome} - ${p.programaNome || 'Sem programa'} (${p.sessoesRealizadas}/${p.totalSessoesEsperadas} sessões)\n`;
        });
      }

      const sent = await notifyOwner({
        title: `Progresso Ciclo Macro: ${alunosFalta1.length} aluno(s) a 1 sessão de fechar`,
        content
      });

      return { sent, alunosFalta1: alunosFalta1.length, alunosCicloCompleto: alunosCicloCompleto.length };
    }),

    // Atualizar sessão de mentoria
    updateSession: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        notaEvolucao: z.number().min(0).max(10).optional(),
        engagementScore: z.number().min(0).max(10).optional(),
        feedback: z.string().optional(),
        mensagemAluno: z.string().optional(),
        taskId: z.number().nullable().optional(),
        taskDeadline: z.string().nullable().optional(),
        taskStatus: z.enum(["entregue", "nao_entregue", "sem_tarefa"]).optional(),
        presence: z.enum(["presente", "ausente"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { sessionId, ...data } = input;
        const success = await db.updateMentoringSession(sessionId, data);
        return { success };
      }),

    // Criar nova sessão de mentoria
    createSession: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        sessionDate: z.string(),
        presence: z.enum(["presente", "ausente"]),
        taskStatus: z.enum(["entregue", "nao_entregue", "sem_tarefa"]).optional(),
        engagementScore: z.number().min(0).max(10).nullable().optional(),
        notaEvolucao: z.number().min(0).max(10).nullable().optional(),
        feedback: z.string().optional(),
        mensagemAluno: z.string().optional(),
        taskId: z.number().nullable().optional(),
        taskDeadline: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar consultor vinculado ao usuário logado
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.loginId === ctx.user.openId);
        
        // Se não é consultor, verificar se é admin
        let consultorId = consultor?.id;
        if (!consultorId && ctx.user.role === 'admin') {
          // Admin pode criar sessão - buscar o consultor do aluno
          const sessions = await db.getMentoringSessionsByAluno(input.alunoId);
          if (sessions.length > 0) {
            consultorId = sessions[0].consultorId;
          }
        }
        if (!consultorId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não está vinculado como mentor' });
        }

        // Buscar dados do aluno para turma e trilha
        const aluno = await db.getAlunoById(input.alunoId);
        if (!aluno) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }

        // Calcular próximo número de sessão
        const sessions = await db.getMentoringSessionsByAluno(input.alunoId);
        const nextSessionNumber = sessions.length > 0 
          ? Math.max(...sessions.map(s => s.sessionNumber ?? 0)) + 1 
          : 1;

        const sessionId = await db.createMentoringSession({
          alunoId: input.alunoId,
          consultorId,
          turmaId: aluno.turmaId,
          trilhaId: aluno.trilhaId,
          sessionNumber: nextSessionNumber,
          sessionDate: input.sessionDate,
          presence: input.presence,
          taskStatus: input.taskStatus ?? "sem_tarefa",
          engagementScore: input.engagementScore ?? null,
          notaEvolucao: input.notaEvolucao ?? null,
          feedback: input.feedback,
          mensagemAluno: input.mensagemAluno,
          taskId: input.taskId ?? null,
          taskDeadline: input.taskDeadline ?? null,
        });

        return { success: true, sessionId, sessionNumber: nextSessionNumber };
      }),

    // Biblioteca de tarefas
    getTaskLibrary: protectedProcedure.query(async () => {
      return await db.getAllTaskLibrary();
    }),

    // Aluno envia relato da tarefa
    submitRelato: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        relatoAluno: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const success = await db.updateMentoringSession(input.sessionId, {
          relatoAluno: input.relatoAluno,
        });
        return { success };
      }),
    
    // Dashboard consolidado de todos os mentores
    dashboardGeral: managerProcedure.query(async () => {
      const consultors = await db.getConsultors();
      const allStats = [];
      
      for (const consultor of consultors) {
        const stats = await db.getConsultorStats(consultor.id);
        if (stats) {
          allStats.push({
            id: consultor.id,
            nome: consultor.name,
            totalMentorias: stats.totalMentorias,
            totalAlunos: stats.totalAlunos,
            totalEmpresas: stats.totalEmpresas,
            porEmpresa: stats.porEmpresa
          });
        }
      }
      
      return {
        totalMentores: consultors.length,
        mentores: allStats.sort((a, b) => b.totalMentorias - a.totalMentorias)
      };
    }),
  }),

  // Admin - Cadastros
  admin: router({
    // Empresas/Programas
    listEmpresas: adminProcedure.query(async () => {
      return await db.getAllPrograms();
    }),
    
    createEmpresa: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        return await db.createProgram(input);
      }),

    updateEmpresa: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateProgram(input.id, input);
      }),

    toggleEmpresaStatus: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.toggleProgramStatus(input.id);
      }),
    
    // Mentores
    listMentores: adminProcedure.query(async () => {
      return await db.getAllMentores();
    }),
    
     createMentor: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        cpf: z.string().min(11, "CPF deve conter 11 dígitos"),
        especialidade: z.string().optional(),
        loginId: z.string().optional(),
        programId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        return await db.createMentor(input);
      }),
    
    updateAcessoMentor: adminProcedure
      .input(z.object({
        consultorId: z.number(),
        loginId: z.string().nullable(),
        canLogin: z.boolean()
      }))
      .mutation(async ({ input }) => {
        return await db.updateConsultorAccess(input.consultorId, input.loginId, input.canLogin, 'mentor');
      }),

    editMentor: adminProcedure
      .input(z.object({
        consultorId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
        especialidade: z.string().optional(),
        programId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { consultorId, ...data } = input;
        return await db.updateConsultor(consultorId, data);
      }),
    
    // Gerentes
    listGerentes: adminProcedure.query(async () => {
      return await db.getAllGerentes();
    }),
    
    createGerente: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        cpf: z.string().min(11).optional(),
        loginId: z.string().optional(),
        managedProgramId: z.number()
      }))
      .mutation(async ({ input }) => {
        // Criar registro na tabela consultors
        const gerenteResult = await db.createGerente(input);
        
        // Se tem CPF, criar também registro na tabela users para login
        if (input.cpf) {
          const gerenteId = 'id' in gerenteResult ? gerenteResult.id as number : undefined;
          await db.createAccessUser({
            name: input.name,
            email: input.email,
            cpf: input.cpf,
            role: 'manager' as const,
            programId: input.managedProgramId,
            consultorId: gerenteId ?? null,
          });
        }
        
        return gerenteResult;
      }),
    
    updateAcessoGerente: adminProcedure
      .input(z.object({
        consultorId: z.number(),
        loginId: z.string().nullable(),
        canLogin: z.boolean()
      }))
      .mutation(async ({ input }) => {
        return await db.updateConsultorAccess(input.consultorId, input.loginId, input.canLogin, 'gerente');
      }),

    editGerente: adminProcedure
      .input(z.object({
        consultorId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        managedProgramId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { consultorId, ...data } = input;
        return await db.updateConsultor(consultorId, data);
      }),
    
    // Alunos
    listAlunos: adminProcedure.query(async () => {
      return await db.getAllAlunosForAdmin();
    }),
    
    createAluno: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        externalId: z.string().min(1),
        programId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        return await db.createAluno(input);
      }),
    
    // Gestão de Acesso (Email + CPF)
    listAccessUsers: adminProcedure.query(async () => {
      return await db.getAccessUsers();
    }),
    
    createAccessUser: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        cpf: z.string().min(1),
        role: z.enum(["user", "admin", "manager"]),
        programId: z.number().nullable().optional(),
        isMentor: z.boolean().optional(), // true = Mentor, false/undefined = Gestor de Empresa
      }))
      .mutation(async ({ input }) => {
        const { isMentor, ...userData } = input;
        
        // Se for Mentor, criar registro na tabela consultors primeiro
        if (isMentor && userData.role === 'manager') {
          const mentorResult = await db.createMentor({
            name: userData.name,
            email: userData.email,
            cpf: userData.cpf,
            programId: userData.programId ?? undefined,
          });
          // Se falhou (CPF duplicado, etc.), retornar o erro
          if ('success' in mentorResult && !mentorResult.success) {
            return mentorResult;
          }
          // Vincular o consultorId ao user
          const mentorId = 'id' in mentorResult ? mentorResult.id as number : undefined;
          if (!mentorId) {
            return { success: false, message: 'Erro ao criar mentor' };
          }
          return await db.createAccessUser({
            ...userData,
            consultorId: mentorId,
          });
        }
        
        return await db.createAccessUser(userData);
      }),
    
    updateAccessUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
        role: z.enum(["user", "admin", "manager"]).optional(),
        programId: z.number().nullable().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { userId, ...data } = input;
        return await db.updateAccessUser(userId, data);
      }),
    
    toggleAccessUserStatus: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.toggleAccessUserStatus(input.userId);
      }),
  }),

  // Ciclos de Execução da Trilha
  ciclos: router({
    // Listar ciclos de um aluno
    porAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCiclosByAluno(input.alunoId);
      }),

    // Criar ciclo
    criar: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        nomeCiclo: z.string().min(1),
        dataInicio: z.string(),
        dataFim: z.string(),
        competenciaIds: z.array(z.number()).min(1),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cicloId = await db.createCicloExecucao({
          ...input,
          definidoPor: ctx.user.id,
        });
        return { success: true, cicloId };
      }),

    // Atualizar ciclo
    atualizar: adminProcedure
      .input(z.object({
        cicloId: z.number(),
        nomeCiclo: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        competenciaIds: z.array(z.number()).optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { cicloId, ...data } = input;
        const success = await db.updateCicloExecucao(cicloId, data);
        return { success };
      }),

    // Excluir ciclo
    excluir: adminProcedure
      .input(z.object({ cicloId: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteCicloExecucao(input.cicloId);
        return { success };
      }),
  }),

  // ============ ASSESSMENT PDI ============
  assessment: router({
    // Listar assessments de um aluno
    porAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAssessmentsByAluno(input.alunoId);
      }),

    // Listar assessments de um programa (admin/mentor)
    porPrograma: protectedProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAssessmentsByProgram(input.programId);
      }),

    // Listar assessments dos alunos de um consultor
    porConsultor: protectedProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAssessmentsByConsultor(input.consultorId);
      }),

    // Criar novo assessment PDI
    criar: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        trilhaId: z.number(),
        turmaId: z.number().nullable().optional(),
        programId: z.number().nullable().optional(),
        consultorId: z.number().nullable().optional(),
        macroInicio: z.string(),
        macroTermino: z.string(),
        competencias: z.array(z.object({
          competenciaId: z.number(),
          peso: z.enum(['obrigatoria', 'opcional']),
          notaCorte: z.string(),
          microInicio: z.string().nullable().optional(),
          microTermino: z.string().nullable().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { competencias, ...pdiData } = input;
        
        // Validate macro dates
        if (pdiData.macroInicio >= pdiData.macroTermino) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Data de início do macro ciclo deve ser anterior à data de término',
          });
        }
        
        // Validate micro dates against macro dates
        for (const comp of competencias) {
          if (comp.microInicio && comp.microInicio < pdiData.macroInicio) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Micro ciclo início não pode ser anterior ao macro ciclo início (${pdiData.macroInicio})`,
            });
          }
          if (comp.microTermino && comp.microTermino > pdiData.macroTermino) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Micro ciclo término não pode ser posterior ao macro ciclo término (${pdiData.macroTermino})`,
            });
          }
        }
        
        const pdiId = await db.createAssessmentPdi(pdiData, competencias);
        return { success: true, pdiId };
      }),

    // Congelar assessment PDI
    congelar: protectedProcedure
      .input(z.object({
        pdiId: z.number(),
        consultorId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.congelarAssessmentPdi(input.pdiId, input.consultorId);
        return { success: true };
      }),

    // Atualizar competência do assessment (micro ciclo, peso, nota de corte)
    atualizarCompetencia: protectedProcedure
      .input(z.object({
        id: z.number(),
        peso: z.enum(['obrigatoria', 'opcional']).optional(),
        notaCorte: z.string().optional(),
        microInicio: z.string().nullable().optional(),
        microTermino: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAssessmentCompetencia(id, data);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
