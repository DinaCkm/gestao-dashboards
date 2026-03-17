import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { processExcelBuffer, uploadExcelToStorage, generateDashboardData, validateExcelStructure, createExcelFromData, processBemExcelFile, detectBemFileType, MentoringRecord, EventRecord, PerformanceRecord } from "./excelProcessor";
import * as XLSX from 'xlsx';
import { calcularIndicadoresAlunoFiltrado, calcularPerformanceFiltrada, CompetenciaObrigatoria, CicloExecucaoData } from './indicatorsCalculator';
import { calcularIndicadoresTodosAlunos, calcularIndicadoresAluno as calcularIndicadoresAlunoV2, agregarIndicadores, gerarDashboardGeral, gerarDashboardEmpresa, obterEmpresas, obterTurmas, StudentIndicatorsV2, CicloDataV2, CaseSucessoData, MacrocicloData } from './indicatorsCalculatorV2';
import { notifyOwner } from "./_core/notification";
import { generateTemplate, validateSpreadsheet, TEMPLATE_STRUCTURES, TemplateType } from "./templateGenerator";
import { storagePut } from "./storage";

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
        credential: z.string().min(1) // CPF ou ID do aluno
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.authenticateByEmailCpf(input.email, input.credential);
        
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
        
        // Se for performance, processar e inserir dados na tabela student_performance
        let performanceInserted = 0;
        if (input.fileType === 'performance') {
          try {
            // Criar registro de upload de performance
            const perfUploadId = await db.createPerformanceUpload({
              uploadedBy: ctx.user.id,
              fileName: input.fileName,
              status: 'processing',
            });
            
            // Ler XLSX e extrair dados
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            if (data.length >= 2) {
              const headers = (data[0] as unknown[]).map((h: unknown) => String(h || '').trim());
              const colMap: Record<string, number> = {};
              headers.forEach((h, idx) => { colMap[h] = idx; });
              
              // Get existing alunos for matching
              const alunosList = await db.getAlunos();
              const alunoByName = new Map<string, number>();
              const alunoByEmail = new Map<string, number>();
              const alunoByExternalId = new Map<string, number>();
              for (const a of alunosList) {
                if (a.name) alunoByName.set(a.name.toLowerCase().trim(), a.id);
                if (a.email) alunoByEmail.set(a.email.toLowerCase().trim(), a.id);
                if (a.externalId) alunoByExternalId.set(a.externalId.trim(), a.id);
              }
              
              // Get existing turmas for matching
              const turmasList = await db.getTurmas();
              const turmaByName = new Map<string, number>();
              for (const t of turmasList) {
                if (t.name) turmaByName.set(t.name.toLowerCase().trim(), t.id);
              }
              
              // Get existing competencias for matching
              const compList = await db.getAllCompetencias();
              const compByName = new Map<string, number>();
              for (const c of compList) {
                if (c.nome) compByName.set(c.nome.toLowerCase().trim(), c.id);
              }
              
              // Delete existing data (replaceAll)
              await db.deleteAllStudentPerformance();
              
              const getXlsxVal = (row: unknown[], colName: string): string | undefined => {
                const idx = colMap[colName];
                if (idx === undefined || idx >= row.length) return undefined;
                const val = row[idx];
                if (val === null || val === undefined) return undefined;
                const str = String(val).trim();
                if (!str || str === '-') return undefined;
                return str;
              };
              
              const parseIntSafe = (val: string | undefined): number => {
                if (!val || val === '-') return 0;
                const n = parseInt(val, 10);
                return isNaN(n) ? 0 : n;
              };
              
              const parseDecimalSafe = (val: string | undefined): string | null => {
                if (!val || val === '-' || val.includes('Sem avalia')) return null;
                const n = parseFloat(val.replace(',', '.'));
                return isNaN(n) ? null : n.toFixed(2);
              };
              
              const records: any[] = [];
              let skipped = 0;
              let totalRows = 0;
              const unmatchedStudents = new Set<string>();
              const unmatchedTurmas = new Set<string>();
              
              for (let i = 1; i < data.length; i++) {
                const row = data[i] as unknown[];
                if (!row || row.length === 0) continue;
                totalRows++;
                
                const externalUserId = getXlsxVal(row, 'Id Usuário');
                const userName = getXlsxVal(row, 'Nome Usuário');
                
                if (!externalUserId || !userName) {
                  skipped++;
                  continue;
                }
                
                const userEmail = getXlsxVal(row, 'E-mail');
                const turmaName = getXlsxVal(row, 'Turma (agrupador 1)');
                const compName = getXlsxVal(row, 'Competência (agrupador 2)');
                
                // Try to match aluno by externalId first, then email, then name
                let alunoId: number | null = null;
                alunoId = alunoByExternalId.get(String(externalUserId).trim()) || null;
                if (!alunoId && userEmail) {
                  alunoId = alunoByEmail.get(userEmail.toLowerCase().trim()) || null;
                }
                if (!alunoId && userName) {
                  alunoId = alunoByName.get(userName.toLowerCase().trim()) || null;
                }
                if (!alunoId) unmatchedStudents.add(userName);
                
                // Try to match turma
                let turmaId: number | null = null;
                if (turmaName) {
                  turmaId = turmaByName.get(turmaName.toLowerCase().trim()) || null;
                  if (!turmaId) unmatchedTurmas.add(turmaName);
                }
                
                // Try to match competencia
                let competenciaId: number | null = null;
                if (compName) {
                  competenciaId = compByName.get(compName.toLowerCase().trim()) || null;
                  if (!competenciaId) {
                    const baseName = compName.replace(/\s*-\s*(Master|Essential|Essencial|Basic|B.sica|Vis.o de Futuro|Jornada.*)$/i, '').trim();
                    competenciaId = compByName.get(baseName.toLowerCase()) || null;
                  }
                }
                
                records.push({
                  alunoId,
                  externalUserId: String(externalUserId),
                  userName,
                  userEmail: userEmail || null,
                  lastAccess: getXlsxVal(row, 'Último acesso') || null,
                  turmaId,
                  externalTurmaId: getXlsxVal(row, 'Id Turma (agrupador 1)') || null,
                  turmaName: turmaName || null,
                  competenciaId,
                  externalCompetenciaId: getXlsxVal(row, 'Id Competência (agrupador 2)') || null,
                  competenciaName: compName || null,
                  dataInicio: getXlsxVal(row, 'Data de início') || null,
                  dataConclusao: getXlsxVal(row, 'Data de conclusão') || null,
                  totalAulas: parseIntSafe(getXlsxVal(row, 'Total de aulas')),
                  aulasDisponiveis: parseIntSafe(getXlsxVal(row, 'Aulas disponíveis')),
                  aulasConcluidas: parseIntSafe(getXlsxVal(row, 'Aulas concluídas')),
                  aulasEmAndamento: parseIntSafe(getXlsxVal(row, 'Aulas em andamento')),
                  aulasNaoIniciadas: parseIntSafe(getXlsxVal(row, 'Aulas não iniciadas')),
                  aulasAgendadas: parseIntSafe(getXlsxVal(row, 'Aulas agendadas')),
                  progressoTotal: parseIntSafe(getXlsxVal(row, 'Progresso Total')),
                  cargaHorariaTotal: getXlsxVal(row, 'Carga horária total') || null,
                  cargaHorariaConcluida: getXlsxVal(row, 'Carga horária concluída') || null,
                  progressoAulasDisponiveis: parseIntSafe(getXlsxVal(row, 'Progresso em aulas disponíveis')),
                  avaliacoesDiagnostico: parseIntSafe(getXlsxVal(row, 'Avaliações de diagnóstico')),
                  mediaAvaliacoesDiagnostico: parseDecimalSafe(getXlsxVal(row, 'Média das avaliações de diagnóstico')),
                  avaliacoesFinais: parseIntSafe(getXlsxVal(row, 'Avaliações finais')),
                  mediaAvaliacoesFinais: parseDecimalSafe(getXlsxVal(row, 'Média das avaliações finais')),
                  avaliacoesDisponiveis: parseIntSafe(getXlsxVal(row, 'Avaliações disponíveis')),
                  avaliacoesRespondidas: parseIntSafe(getXlsxVal(row, 'Avaliações respondidas')),
                  avaliacoesPendentes: parseIntSafe(getXlsxVal(row, 'Avaliações pendentes')),
                  avaliacoesAgendadas: parseIntSafe(getXlsxVal(row, 'Avaliações agendadas')),
                  mediaAvaliacoesDisponiveis: parseDecimalSafe(getXlsxVal(row, 'Média em avaliações disponíveis')),
                  mediaAvaliacoesRespondidas: parseDecimalSafe(getXlsxVal(row, 'Média em avaliações respondidas')),
                  concluidoDentroPrazo: getXlsxVal(row, 'Concluído dentro do prazo (%)') || null,
                  concluidoEmAtraso: getXlsxVal(row, 'Concluído em atraso (%)') || null,
                  naoConcluidoDentroPrazo: getXlsxVal(row, 'Não Concluído e dentro do prazo (%)') || null,
                  naoConcluidoEmAtraso: getXlsxVal(row, 'Não Concluído e em atraso (%)') || null,
                  uploadId: perfUploadId,
                });
              }
              
              // Insert all records
              performanceInserted = await db.insertStudentPerformanceBatch(records);
              
              // Update upload record
              await db.updatePerformanceUpload(perfUploadId, {
                totalRecords: totalRows,
                processedRecords: performanceInserted,
                skippedRecords: skipped,
                newAlunos: unmatchedStudents.size,
                updatedRecords: performanceInserted,
                status: 'completed',
                summary: {
                  unmatchedStudents: Array.from(unmatchedStudents),
                  unmatchedTurmas: Array.from(unmatchedTurmas),
                  headers,
                  totalColumns: headers.length,
                } as any,
              });
            }
            
            // Atualizar totalRecords do batch com os registros processados
            if (performanceInserted > 0) {
              const currentBatch = await db.getUploadBatchById(input.batchId);
              const newTotal = (currentBatch?.totalRecords || 0) + performanceInserted;
              await db.updateUploadBatchTotalRecords(input.batchId, newTotal);
            }
          } catch (perfError) {
            console.error('Erro ao processar performance XLSX:', perfError);
          }
        }
        
        return { 
          fileId, 
          success: true,
          performanceInserted,
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

  // Performance Report Upload
  performanceReport: router({
    // Upload e processar CSV de performance
    upload: adminProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded CSV
        replaceAll: z.boolean().default(true), // Substituir todos os dados existentes
      }))
      .mutation(async ({ ctx, input }) => {
        // Criar registro de upload
        const uploadId = await db.createPerformanceUpload({
          uploadedBy: ctx.user.id,
          fileName: input.fileName,
          status: 'processing',
        });

        try {
          // Decode CSV from base64
          const csvBuffer = Buffer.from(input.fileData, 'base64');
          const csvText = csvBuffer.toString('utf-8').replace(/^\uFEFF/, ''); // Remove BOM
          
          // Parse CSV
          const lines = csvText.split('\n');
          const headers = parseCSVLine(lines[0]);
          
          // Map column indices
          const colMap: Record<string, number> = {};
          headers.forEach((h, i) => {
            colMap[h.trim()] = i;
          });
          
          // Get existing alunos for matching
          const alunosList = await db.getAlunos();
          const alunoByName = new Map<string, number>();
          const alunoByEmail = new Map<string, number>();
          for (const a of alunosList) {
            if (a.name) alunoByName.set(a.name.toLowerCase().trim(), a.id);
            if (a.email) alunoByEmail.set(a.email.toLowerCase().trim(), a.id);
          }
          
          // Get existing turmas for matching
          const turmasList = await db.getTurmas();
          const turmaByName = new Map<string, number>();
          for (const t of turmasList) {
            if (t.name) turmaByName.set(t.name.toLowerCase().trim(), t.id);
          }
          
          // Get existing competencias for matching
          const compList = await db.getAllCompetencias();
          const compByName = new Map<string, number>();
          for (const c of compList) {
            if (c.nome) compByName.set(c.nome.toLowerCase().trim(), c.id);
          }
          
          // If replaceAll, delete existing data
          if (input.replaceAll) {
            await db.deleteAllStudentPerformance();
          }
          
          // Process each row
          const records: any[] = [];
          let skipped = 0;
          let totalRows = 0;
          const unmatchedStudents = new Set<string>();
          const unmatchedTurmas = new Set<string>();
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            totalRows++;
            
            const values = parseCSVLine(line);
            
            const externalUserId = getVal(values, colMap, 'Id Usu\u00e1rio');
            const userName = getVal(values, colMap, 'Nome Usu\u00e1rio');
            
            if (!externalUserId || !userName) {
              skipped++;
              continue;
            }
            
            const userEmail = getVal(values, colMap, 'E-mail');
            const turmaName = getVal(values, colMap, 'Turma (agrupador 1)');
            const compName = getVal(values, colMap, 'Compet\u00eancia (agrupador 2)');
            
            // Try to match aluno
            let alunoId: number | null = null;
            if (userEmail) {
              alunoId = alunoByEmail.get(userEmail.toLowerCase().trim()) || null;
            }
            if (!alunoId && userName) {
              alunoId = alunoByName.get(userName.toLowerCase().trim()) || null;
            }
            if (!alunoId) unmatchedStudents.add(userName);
            
            // Try to match turma
            let turmaId: number | null = null;
            if (turmaName) {
              turmaId = turmaByName.get(turmaName.toLowerCase().trim()) || null;
              if (!turmaId) unmatchedTurmas.add(turmaName);
            }
            
            // Try to match competencia
            let competenciaId: number | null = null;
            if (compName) {
              // Try exact match first, then partial
              competenciaId = compByName.get(compName.toLowerCase().trim()) || null;
              if (!competenciaId) {
                // Try matching without the suffix like " - Master", " - Essential", " - Basic"
                const baseName = compName.replace(/\s*-\s*(Master|Essential|Essencial|Basic|B.sica|Vis.o de Futuro|Jornada.*)$/i, '').trim();
                competenciaId = compByName.get(baseName.toLowerCase()) || null;
              }
            }
            
            const parseIntSafe = (val: string | undefined): number => {
              if (!val || val === '-') return 0;
              const n = parseInt(val, 10);
              return isNaN(n) ? 0 : n;
            };
            
            const parseDecimalSafe = (val: string | undefined): string | null => {
              if (!val || val === '-' || val.includes('Sem avalia')) return null;
              const n = parseFloat(val.replace(',', '.'));
              return isNaN(n) ? null : n.toFixed(2);
            };
            
            records.push({
              alunoId,
              externalUserId,
              userName,
              userEmail: userEmail || null,
              lastAccess: getVal(values, colMap, '\u00daltimo acesso') || null,
              turmaId,
              externalTurmaId: getVal(values, colMap, 'Id Turma (agrupador 1)') || null,
              turmaName: turmaName || null,
              competenciaId,
              externalCompetenciaId: getVal(values, colMap, 'Id Compet\u00eancia (agrupador 2)') || null,
              competenciaName: compName || null,
              dataInicio: getVal(values, colMap, 'Data de in\u00edcio') || null,
              dataConclusao: getVal(values, colMap, 'Data de conclus\u00e3o') || null,
              totalAulas: parseIntSafe(getVal(values, colMap, 'Total de aulas')),
              aulasDisponiveis: parseIntSafe(getVal(values, colMap, 'Aulas dispon\u00edveis')),
              aulasConcluidas: parseIntSafe(getVal(values, colMap, 'Aulas conclu\u00eddas')),
              aulasEmAndamento: parseIntSafe(getVal(values, colMap, 'Aulas em andamento')),
              aulasNaoIniciadas: parseIntSafe(getVal(values, colMap, 'Aulas n\u00e3o iniciadas')),
              aulasAgendadas: parseIntSafe(getVal(values, colMap, 'Aulas agendadas')),
              progressoTotal: parseIntSafe(getVal(values, colMap, 'Progresso Total')),
              cargaHorariaTotal: getVal(values, colMap, 'Carga hor\u00e1ria total') || null,
              cargaHorariaConcluida: getVal(values, colMap, 'Carga hor\u00e1ria conclu\u00edda') || null,
              progressoAulasDisponiveis: parseIntSafe(getVal(values, colMap, 'Progresso em aulas dispon\u00edveis')),
              avaliacoesDiagnostico: parseIntSafe(getVal(values, colMap, 'Avalia\u00e7\u00f5es de diagn\u00f3stico')),
              mediaAvaliacoesDiagnostico: parseDecimalSafe(getVal(values, colMap, 'M\u00e9dia das avalia\u00e7\u00f5es de diagn\u00f3stico')),
              avaliacoesFinais: parseIntSafe(getVal(values, colMap, 'Avalia\u00e7\u00f5es finais')),
              mediaAvaliacoesFinais: parseDecimalSafe(getVal(values, colMap, 'M\u00e9dia das avalia\u00e7\u00f5es finais')),
              avaliacoesDisponiveis: parseIntSafe(getVal(values, colMap, 'Avalia\u00e7\u00f5es dispon\u00edveis')),
              avaliacoesRespondidas: parseIntSafe(getVal(values, colMap, 'Avalia\u00e7\u00f5es respondidas')),
              avaliacoesPendentes: parseIntSafe(getVal(values, colMap, 'Avalia\u00e7\u00f5es pendentes')),
              avaliacoesAgendadas: parseIntSafe(getVal(values, colMap, 'Avalia\u00e7\u00f5es agendadas')),
              mediaAvaliacoesDisponiveis: parseDecimalSafe(getVal(values, colMap, 'M\u00e9dia em avalia\u00e7\u00f5es dispon\u00edveis')),
              mediaAvaliacoesRespondidas: parseDecimalSafe(getVal(values, colMap, 'M\u00e9dia em avalia\u00e7\u00f5es respondidas')),
              concluidoDentroPrazo: getVal(values, colMap, 'Conclu\u00eddo dentro do prazo (%)') || null,
              concluidoEmAtraso: getVal(values, colMap, 'Conclu\u00eddo em atraso (%)') || null,
              naoConcluidoDentroPrazo: getVal(values, colMap, 'N\u00e3o Conclu\u00eddo e dentro do prazo (%)') || null,
              naoConcluidoEmAtraso: getVal(values, colMap, 'N\u00e3o Conclu\u00eddo e em atraso (%)') || null,
              uploadId,
            });
          }
          
          // Insert all records
          const inserted = await db.insertStudentPerformanceBatch(records);
          
          // Update upload record
          const summary = {
            unmatchedStudents: Array.from(unmatchedStudents),
            unmatchedTurmas: Array.from(unmatchedTurmas),
            headers: headers,
            totalColumns: headers.length,
          };
          
          await db.updatePerformanceUpload(uploadId, {
            totalRecords: totalRows,
            processedRecords: inserted,
            skippedRecords: skipped,
            newAlunos: unmatchedStudents.size,
            updatedRecords: inserted,
            status: 'completed',
            summary: summary as any,
          });
          
          return {
            success: true,
            uploadId,
            totalRows,
            processedRecords: inserted,
            skippedRecords: skipped,
            unmatchedStudents: Array.from(unmatchedStudents),
            unmatchedTurmas: Array.from(unmatchedTurmas),
          };
        } catch (error) {
          await db.updatePerformanceUpload(uploadId, {
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Erro ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          });
        }
      }),
    
    // Listar histórico de uploads de performance
    listUploads: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getPerformanceUploads(input?.limit || 20);
      }),
    
    // Obter resumo dos dados de performance
    summary: adminProcedure.query(async () => {
      return await db.getStudentPerformanceSummary();
    }),
    
    // Obter detalhes de um upload específico
    getUpload: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPerformanceUploadById(input.id);
      }),
    
    // Obter performance de um aluno específico
    byAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStudentPerformanceByAluno(input.alunoId);
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
        dateFrom: z.string().optional(), // YYYY-MM-DD
        dateTo: z.string().optional(), // YYYY-MM-DD
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
        
        // Create report record first
        const id = await db.createReport({
          ...input,
          generatedBy: ctx.user.id
        });
        
        // Generate actual report file
        try {
          let mentoringSessions = await db.getAllMentoringSessions();
          let eventParticipations = await db.getAllEventParticipationWithDate();
          const alunosList = await db.getAlunos();
          const programsList = await db.getPrograms();
          const allPlanoItems = await db.getAllPlanoIndividual();
          const turmasList = await db.getTurmas();
          const consultorsList = await db.getConsultors();
          
          // Filtro por período (Item 4)
          const dateFrom = input.dateFrom ? new Date(input.dateFrom + 'T00:00:00') : null;
          const dateTo = input.dateTo ? new Date(input.dateTo + 'T23:59:59') : null;
          if (dateFrom || dateTo) {
            mentoringSessions = mentoringSessions.filter(s => {
              if (!s.sessionDate) return true;
              const d = new Date(s.sessionDate);
              if (dateFrom && d < dateFrom) return false;
              if (dateTo && d > dateTo) return false;
              return true;
            });
            eventParticipations = eventParticipations.filter(ep => {
              if (!ep.eventDate) return true;
              const d = new Date(ep.eventDate);
              if (dateFrom && d < dateFrom) return false;
              if (dateTo && d > dateTo) return false;
              return true;
            });
          }
          
          const alunoMap = new Map(alunosList.map(a => [a.id, a]));
          const programMap = new Map(programsList.map(p => [p.id, p]));
          const turmaMap = new Map(turmasList.map(t => [t.id, t]));
          const consultorMap = new Map(consultorsList.map(c => [c.id, c]));
          
          // Build Excel workbook
          const wb = XLSX.utils.book_new();
          const dataEmissao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          
          if (input.type === 'individual' && input.scopeId) {
            // Individual report - specific student
            const aluno = alunosList.find(a => a.id === input.scopeId);
            if (!aluno) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
            
            const program = aluno.programId ? programMap.get(aluno.programId) : null;
            const turma = aluno.turmaId ? turmaMap.get(aluno.turmaId) : null;
            const consultor = aluno.consultorId ? consultorMap.get(aluno.consultorId) : null;
            const planoItems = allPlanoItems.filter((p: any) => p.alunoId === aluno.id);
            
            // Sheet 1: Dados do Aluno
            // Buscar a data da última mentoria realizada para este aluno
            const alunoSessoes = mentoringSessions
              .filter(s => s.alunoId === aluno.id && s.sessionDate)
              .sort((a, b) => {
                const da = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
                const db2 = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
                return db2 - da;
              });
            const ultimaMentoria = alunoSessoes[0];
            const dadosAluno = [{
              'Nome': aluno.name || '',
              'Email': aluno.email || '',
              'Empresa': program?.name || '',
              'Turma': turma?.name || '',
              'Mentor(a)': consultor?.name || '',
              'Data da Última Mentoria': ultimaMentoria?.sessionDate ? new Date(ultimaMentoria.sessionDate).toLocaleDateString('pt-BR') : 'Sem sessões',
              'Total de Sessões': alunoSessoes.length,
              'Data do Relatório': new Date().toLocaleDateString('pt-BR'),
            }];
            const ws1 = XLSX.utils.json_to_sheet(dadosAluno);
            XLSX.utils.book_append_sheet(wb, ws1, 'Dados do Aluno');
            
            // Sheet 2: Sessões de Mentoria
            const alunoMentorias = mentoringSessions
              .filter(s => s.alunoId === aluno.id)
              .map(s => ({
                'Data': s.sessionDate ? String(s.sessionDate) : '',
                'Presença': s.presence || '',
                'Atividade': s.taskStatus || '',
                'Engajamento': s.engagementScore ?? '',
                'Nota Evolução': s.notaEvolucao ?? '',
                'Feedback': s.feedback || '',
              }));
            if (alunoMentorias.length > 0) {
              const ws2 = XLSX.utils.json_to_sheet(alunoMentorias);
              XLSX.utils.book_append_sheet(wb, ws2, 'Mentorias');
            }
            
            // Sheet 3: Participação em Eventos
            const alunoEventos = eventParticipations
              .filter(ep => ep.alunoId === aluno.id)
              .map(ep => ({
                'Evento': ep.eventTitle || '',
                'Data': ep.eventDate ? String(ep.eventDate) : '',
                'Status': ep.status || '',
              }));
            if (alunoEventos.length > 0) {
              const ws3 = XLSX.utils.json_to_sheet(alunoEventos);
              XLSX.utils.book_append_sheet(wb, ws3, 'Eventos');
            }
            
            // Sheet 4: Plano Individual
            if (planoItems.length > 0) {
              const planoData = planoItems.map((p: any) => ({
                'Competência': p.competenciaName || p.competenciaId || '',
                'Trilha': p.trilhaNome || '',
                'Nota Atual': p.notaAtual ?? '',
                'Meta': p.metaNota ?? '',
              }));
              const ws4 = XLSX.utils.json_to_sheet(planoData);
              XLSX.utils.book_append_sheet(wb, ws4, 'Plano Individual');
            }
          } else if (input.type === 'manager' || input.type === 'admin') {
            // Manager/Admin report - team or all data with V2 indicators
            let reportAlunos: typeof alunosList;
            if (input.type === 'manager') {
              // Se é mentor (tem consultorId), filtrar apenas seus alunos vinculados
              const userConsultorId = (ctx.user as any).consultorId;
              if (userConsultorId) {
                reportAlunos = alunosList.filter(a => a.consultorId === userConsultorId);
              } else if (ctx.user.programId) {
                reportAlunos = alunosList.filter(a => a.programId === ctx.user.programId);
              } else {
                reportAlunos = alunosList;
              }
            } else {
              reportAlunos = alunosList;
            }
            
            // Calculate V2 indicators for all students (same logic as Dashboard Gestor)
            const mentoriasV2: import('./excelProcessor').MentoringRecord[] = [];
            const eventosV2: import('./excelProcessor').EventRecord[] = [];
            const performanceV2: import('./excelProcessor').PerformanceRecord[] = [];
            for (const session of mentoringSessions) {
              const sessionAluno = alunoMap.get(session.alunoId);
              if (!sessionAluno) continue;
              const prog = sessionAluno.programId ? programMap.get(sessionAluno.programId) : null;
              const turma = sessionAluno.turmaId ? turmaMap.get(sessionAluno.turmaId) : null;
              mentoriasV2.push({
                idUsuario: sessionAluno.externalId || String(sessionAluno.id),
                nomeAluno: sessionAluno.name, empresa: prog?.name || 'Desconhecida',
                turma: turma?.name || '', trilha: '', ciclo: session.ciclo || '',
                sessao: session.sessionNumber || 0,
                dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
                presenca: session.presence as 'presente' | 'ausente',
                atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus || 'sem_tarefa') as 'entregue' | 'nao_entregue' | 'sem_tarefa'),
                engajamento: session.engagementScore || undefined,
                feedback: session.feedback || '',
              });
            }
            for (const ep of eventParticipations) {
              const epAluno = alunoMap.get(ep.alunoId);
              if (!epAluno) continue;
              const prog = epAluno.programId ? programMap.get(epAluno.programId) : null;
              eventosV2.push({
                idUsuario: epAluno.externalId || String(epAluno.id),
                nomeAluno: epAluno.name, empresa: prog?.name || 'Desconhecida',
                turma: '', trilha: '',
                tituloEvento: ep.eventTitle || 'Evento',
                dataEvento: ep.eventDate ? new Date(ep.eventDate) : undefined,
                presenca: ep.status as 'presente' | 'ausente',
              });
            }
            // === UNIFICAÇÃO: Adicionar eventos ausentes (filtrado por macroInicio) ===
            {
              const _epEvtIds3 = new Map<number, Set<number>>();
              for (const _ep3 of eventParticipations) {
                if (!_epEvtIds3.has(_ep3.alunoId)) _epEvtIds3.set(_ep3.alunoId, new Set());
                _epEvtIds3.get(_ep3.alunoId)!.add(_ep3.eventId);
              }
              const _evtsByProg3 = new Map<number, Awaited<ReturnType<typeof db.getEventsByProgram>>>();
              for (const _prog3 of programsList) {
                _evtsByProg3.set(_prog3.id, await db.getEventsByProgramOrGlobal(_prog3.id));
              }
              const _macroInicioMap3 = await db.getAlunoMacroInicioMap();
              for (const _a3 of alunosList) {
                if (!_a3.programId) continue;
                const _progEvts3 = _evtsByProg3.get(_a3.programId) || [];
                const _participated3 = _epEvtIds3.get(_a3.id) || new Set();
                const _aIdStr3 = _a3.externalId || String(_a3.id);
                const _prog3b = programMap.get(_a3.programId);
                const _macroInicio3 = _macroInicioMap3.get(_a3.id);
                for (const _evt3 of _progEvts3) {
                  if (!_participated3.has(_evt3.id)) {
                    // Só marcar ausência se o evento é posterior ao macroInicio do aluno
                    if (_macroInicio3 && _evt3.eventDate) {
                      const evtDate = new Date(_evt3.eventDate);
                      if (evtDate < _macroInicio3) continue;
                    }
                    eventosV2.push({
                      idUsuario: _aIdStr3,
                      nomeAluno: _a3.name,
                      empresa: _prog3b?.name || 'Desconhecida',
                      turma: '', trilha: '',
                      tituloEvento: _evt3.title || 'Evento',
                      dataEvento: _evt3.eventDate ? new Date(_evt3.eventDate) : undefined,
                      presenca: 'ausente' as const,
                    });
                  }
                }
              }
            }
            const studentPerfRecs = await db.getStudentPerformanceAsRecords();
            for (const spRec of studentPerfRecs) { performanceV2.push(spRec); }
            
            const ciclosPorAlunoReport = await db.getAllCiclosForCalculatorV2();
            const compIdToCodigoMapReport = await db.getCompIdToCodigoMap();
            const casesMapReport = await db.getCasesForCalculator();
            const casesDataReport: CaseSucessoData[] = [];
            for (const [, cases] of Array.from(casesMapReport.entries())) { casesDataReport.push(...cases); }
            const macrocicloPorAlunoReport = await db.getMacrocicloPorAluno();
            const todosIndicadores = calcularIndicadoresTodosAlunos(mentoriasV2, eventosV2, performanceV2, ciclosPorAlunoReport, compIdToCodigoMapReport, casesDataReport, undefined, macrocicloPorAlunoReport);
            const indicadoresMap = new Map(todosIndicadores.map(i => [i.idUsuario, i]));
            
            // Sheet 0: Resumo do Mentor (apenas para relatório gerencial de mentor)
            const userConsultorIdForSheet = (ctx.user as any).consultorId;
            if (input.type === 'manager' && userConsultorIdForSheet) {
              const mentorInfo = consultorMap.get(userConsultorIdForSheet);
              const mentorSessions = mentoringSessions.filter(s => reportAlunos.some(a => a.id === s.alunoId));
              const totalPresente = mentorSessions.filter(s => s.presence === 'presente').length;
              const totalAusente = mentorSessions.filter(s => s.presence === 'ausente').length;
              const taxaPresenca = mentorSessions.length > 0 ? ((totalPresente / mentorSessions.length) * 100).toFixed(1) : '0.0';
              
              // Sessões por mês
              const sessoesPorMes = new Map<string, number>();
              for (const s of mentorSessions) {
                if (s.sessionDate) {
                  const d = new Date(s.sessionDate);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  sessoesPorMes.set(key, (sessoesPorMes.get(key) || 0) + 1);
                }
              }
              
              const resumoData = [{
                'Mentor': mentorInfo?.name || ctx.user.name || '',
                'Total de Alunos': reportAlunos.length,
                'Total de Sessões': mentorSessions.length,
                'Sessões com Presença': totalPresente,
                'Sessões com Ausência': totalAusente,
                'Taxa de Presença (%)': taxaPresenca,
                'Período': `${input.dateFrom || 'Início'} a ${input.dateTo || 'Atual'}`,
                'Data de Emissão': dataEmissao,
              }];
              const wsResumo = XLSX.utils.json_to_sheet(resumoData);
              XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');
              
              // Aba extra: Sessões por Mês
              if (sessoesPorMes.size > 0) {
                const sessoesMesData = Array.from(sessoesPorMes.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([mes, qtd]) => ({ 'Mês': mes, 'Sessões Realizadas': qtd }));
                const wsMes = XLSX.utils.json_to_sheet(sessoesMesData);
                XLSX.utils.book_append_sheet(wb, wsMes, 'Sessões por Mês');
              }
            }
            
            // Buscar dados de macrociclos (assessment_pdi) e microciclos (assessment_competencias) para novas colunas
            const allAssessmentPdis = await db.getAllAssessmentPdis();
            const allTrilhasForReport = await db.getAllTrilhas();
            const trilhaNameMap = new Map(allTrilhasForReport.map((t: any) => [t.id, t.name]));
            // Agrupar PDIs por aluno
            const pdisByAluno = new Map<number, typeof allAssessmentPdis>();
            for (const pdi of allAssessmentPdis) {
              if (!pdisByAluno.has(pdi.alunoId)) pdisByAluno.set(pdi.alunoId, []);
              pdisByAluno.get(pdi.alunoId)!.push(pdi);
            }
            // Buscar todas as competências dos assessments para microciclos
            const allPdiIds = allAssessmentPdis.map(p => p.id);
            let allAssessmentComps: { id: number; assessmentPdiId: number; competenciaId: number; microInicio: Date | string | null; microTermino: Date | string | null }[] = [];
            if (allPdiIds.length > 0) {
              allAssessmentComps = await db.getAllAssessmentCompetenciasForReport();
            }
            // Buscar nomes das competências
            const allCompetenciasForReport = await db.getAllCompetencias();
            const compNameMap = new Map(allCompetenciasForReport.map((c: any) => [c.id, c.nome]));
            // Agrupar competências por PDI
            const compsByPdiId = new Map<number, typeof allAssessmentComps>();
            for (const comp of allAssessmentComps) {
              if (!compsByPdiId.has(comp.assessmentPdiId)) compsByPdiId.set(comp.assessmentPdiId, []);
              compsByPdiId.get(comp.assessmentPdiId)!.push(comp);
            }

            // Sheet 1: Alunos com Indicadores V2
            const sheetName1 = input.type === 'manager' ? 'Equipe' : 'Todos os Alunos';
            const alunosComIndicadores = reportAlunos.map(a => {
              const prog = a.programId ? programMap.get(a.programId) : null;
              const turma = a.turmaId ? turmaMap.get(a.turmaId) : null;
              const mentor = a.consultorId ? consultorMap.get(a.consultorId) : null;
              const idUsr = a.externalId || String(a.id);
              const ind = indicadoresMap.get(idUsr);
              // A5 FIX: Adicionar data da última mentoria e total de sessões
              const alunoSessoes = mentoringSessions
                .filter(s => s.alunoId === a.id && s.sessionDate)
                .sort((sa, sb) => {
                  const da = sa.sessionDate ? new Date(sa.sessionDate).getTime() : 0;
                  const db2 = sb.sessionDate ? new Date(sb.sessionDate).getTime() : 0;
                  return db2 - da;
                });
              const ultimaMentoria = alunoSessoes[0];
              // Montar dados de Contrato, Macrociclos e Microciclos
              const fmtDate = (d: any) => {
                if (!d) return '';
                try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return String(d); }
              };
              const contratoStr = (a.contratoInicio || a.contratoFim)
                ? `${fmtDate(a.contratoInicio)} a ${fmtDate(a.contratoFim)}`
                : 'Não definido';
              
              const alunoPdis = pdisByAluno.get(a.id) || [];
              const macrociclosStr = alunoPdis.length > 0
                ? alunoPdis.map(p => {
                    const trilhaNome = trilhaNameMap.get(p.trilhaId) || `Trilha ${p.trilhaId}`;
                    const inicio = fmtDate(p.macroInicio);
                    const termino = fmtDate(p.macroTermino);
                    const status = p.status === 'congelado' ? ' [CONGELADO]' : '';
                    return `${trilhaNome} (${inicio} - ${termino})${status}`;
                  }).join(' | ')
                : 'Sem macrociclos';
              
              const microciclosArr: string[] = [];
              for (const pdi of alunoPdis) {
                const comps = compsByPdiId.get(pdi.id) || [];
                const compsComDatas = comps.filter(c => c.microInicio || c.microTermino);
                for (const comp of compsComDatas) {
                  const compNome = compNameMap.get(comp.competenciaId) || `Comp ${comp.competenciaId}`;
                  microciclosArr.push(`${compNome} (${fmtDate(comp.microInicio)} - ${fmtDate(comp.microTermino)})`);
                }
              }
              const microciclosStr = microciclosArr.length > 0 ? microciclosArr.join(' | ') : 'Sem microciclos';
              
              return {
                'Nome': a.name || '',
                'Email': a.email || '',
                'Empresa': prog?.name || '',
                'Turma': turma?.name || '',
                'Período do Contrato': contratoStr,
                'Macrociclos (Trilhas)': macrociclosStr,
                'Microciclos (Competências)': microciclosStr,
                'Mentor(a)': mentor?.name || '',
                'Total Sessões': alunoSessoes.length,
                'Última Mentoria': ultimaMentoria?.sessionDate ? new Date(ultimaMentoria.sessionDate).toLocaleDateString('pt-BR') : 'Sem sessões',
                'Ind.1 Webinars (%)': ind ? Math.round(ind.consolidado.ind1_webinars) : 0,
                'Ind.2 Avaliações (%)': ind ? Math.round(ind.consolidado.ind2_avaliacoes) : 0,
                'Ind.3 Competências (%)': ind ? Math.round(ind.consolidado.ind3_competencias) : 0,
                'Ind.4 Tarefas (%)': ind ? Math.round(ind.consolidado.ind4_tarefas) : 0,
                'Ind.5 Engajamento (%)': ind ? Math.round(ind.consolidado.ind5_engajamento) : 0,
                'Ind.6 Case (%)': ind ? Math.round(ind.consolidado.ind6_aplicabilidade) : 0,
                'Ind.7 Engajamento Final (%)': ind ? Math.round(ind.consolidado.ind7_engajamentoFinal) : 0,
                'Classificação': ind?.classificacao || 'Sem dados',
                'Nota Final (0-10)': ind ? (ind.notaFinal).toFixed(1) : '0.0',
                'Data de Emissão': dataEmissao,
              };
            });
            const ws1 = XLSX.utils.json_to_sheet(alunosComIndicadores);
            XLSX.utils.book_append_sheet(wb, ws1, sheetName1);
            
            // Sheet 2: Mentorias
            const reportIds = new Set(reportAlunos.map(a => a.id));
            const reportMentorias = mentoringSessions
              .filter(s => reportIds.has(s.alunoId))
              .map(s => {
                const al = alunoMap.get(s.alunoId);
                const prog = al?.programId ? programMap.get(al.programId) : null;
                return {
                  'Aluno': al?.name || '',
                  ...(input.type === 'admin' ? { 'Empresa': prog?.name || '' } : {}),
                  'Data': s.sessionDate ? String(s.sessionDate) : '',
                  'Presença': s.presence || '',
                  'Atividade': s.taskStatus || '',
                  'Engajamento': s.engagementScore ?? '',
                };
              });
            if (reportMentorias.length > 0) {
              const ws2 = XLSX.utils.json_to_sheet(reportMentorias);
              XLSX.utils.book_append_sheet(wb, ws2, 'Mentorias');
            }
            
            // Sheet 3: Indicadores por Ciclo (detalhado)
            const indicadoresPorCiclo: any[] = [];
            for (const a of reportAlunos) {
              const idUsr = a.externalId || String(a.id);
              const ind = indicadoresMap.get(idUsr);
              if (!ind) continue;
              const allCiclos = [...ind.ciclosFinalizados, ...ind.ciclosEmAndamento];
              for (const ciclo of allCiclos) {
                // Formatar datas do ciclo
                const fmtCicloDate = (d: string | undefined) => {
                  if (!d) return '';
                  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
                };
                indicadoresPorCiclo.push({
                  'Aluno': a.name || '',
                  'Ciclo': ciclo.nomeCiclo || '',
                  'Início do Ciclo': fmtCicloDate(ciclo.dataInicio),
                  'Fim do Ciclo': fmtCicloDate(ciclo.dataFim),
                  'Status': ciclo.status || '',
                  'Ind.1 Webinars': Math.round(ciclo.ind1_webinars),
                  'Ind.2 Avaliações': Math.round(ciclo.ind2_avaliacoes),
                  'Ind.3 Competências': Math.round(ciclo.ind3_competencias),
                  'Ind.4 Tarefas': Math.round(ciclo.ind4_tarefas),
                  'Ind.5 Engajamento': Math.round(ciclo.ind5_engajamento),
                  'Ind.6 Case': Math.round(ciclo.ind6_aplicabilidade),
                  'Ind.7 Eng. Final': Math.round(ciclo.ind7_engajamentoFinal),
                  'Classificação': ciclo.classificacao || '',
                  'Data de Emissão': dataEmissao,
                });
              }
            }
            if (indicadoresPorCiclo.length > 0) {
              const ws3 = XLSX.utils.json_to_sheet(indicadoresPorCiclo);
              XLSX.utils.book_append_sheet(wb, ws3, 'Indicadores por Ciclo');
            }
          }
          
          // Generate buffer and upload
          const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
          const timestamp = Date.now();
          const fileKey = `reports/${ctx.user.id}/${timestamp}-${input.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
          const { url } = await storagePut(fileKey, buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          
          // Update report with file URL
          if (id) {
            await db.updateReport(id, { fileKey, fileUrl: url });
          }
        } catch (err) {
          console.error('Error generating report file:', err);
          // Report record exists but file generation failed - user can retry
        }
        
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
    addCompetencia: protectedProcedure
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
    addMultiple: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        competenciaIds: z.array(z.number())
      }))
      .mutation(async ({ input }) => {
        const success = await db.addCompetenciasToPlano(input.alunoId, input.competenciaIds);
        return { success };
      }),
    
    // Remover competência do plano
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.removeCompetenciaFromPlano(input.id);
        return { success };
      }),
    
    // Atualizar item do plano
    update: protectedProcedure
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
    clear: protectedProcedure
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
      const eventParticipations = await db.getAllEventParticipationWithDate();
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
atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa'),
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
          tituloEvento: participation.eventTitle || 'Evento',
          dataEvento: participation.eventDate ? new Date(participation.eventDate) : undefined,
          presenca: participation.status as 'presente' | 'ausente'
        });
      }
      // === UNIFICAÇÃO: Adicionar eventos ausentes (filtrado por macroInicio) ===
      {
        const _epEvtIds = new Map<number, Set<number>>();
        for (const _ep of eventParticipations) {
          if (!_epEvtIds.has(_ep.alunoId)) _epEvtIds.set(_ep.alunoId, new Set());
          _epEvtIds.get(_ep.alunoId)!.add(_ep.eventId);
        }
        const _evtsByProg = new Map<number, Awaited<ReturnType<typeof db.getEventsByProgram>>>();
        for (const _prog of programsList) {
          _evtsByProg.set(_prog.id, await db.getEventsByProgramOrGlobal(_prog.id));
        }
        const _macroInicioMap = await db.getAlunoMacroInicioMap();
        for (const _a of alunosList) {
          if (!_a.programId) continue;
          const _progEvts = _evtsByProg.get(_a.programId) || [];
          const _participated = _epEvtIds.get(_a.id) || new Set();
          const _aIdStr = _a.externalId || String(_a.id);
          const _prog = programMap.get(_a.programId);
          const _macroInicio = _macroInicioMap.get(_a.id);
          for (const _evt of _progEvts) {
            if (!_participated.has(_evt.id)) {
              // Só marcar ausência se o evento é posterior ao macroInicio do aluno
              if (_macroInicio && _evt.eventDate) {
                const evtDate = new Date(_evt.eventDate);
                if (evtDate < _macroInicio) continue;
              }
              eventos.push({
                idUsuario: _aIdStr,
                nomeAluno: _a.name,
                empresa: _prog?.name || 'Desconhecida',
                tituloEvento: _evt.title || 'Evento',
                dataEvento: _evt.eventDate ? new Date(_evt.eventDate) : undefined,
                presenca: 'ausente' as const,
              });
            }
          }
        }
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
      
      // Adicionar dados de performance da tabela student_performance (CSV de performance)
      // Estes dados contêm notas de avaliações e progresso de aulas por competência
      const studentPerfRecords = await db.getStudentPerformanceAsRecords();
      const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
      for (const spRec of studentPerfRecords) {
        const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
        if (!existingPerfKeys.has(key)) {
          performance.push(spRec);
          existingPerfKeys.add(key);
        }
      }
      
      // Buscar ciclos de execução (V2)
      const ciclosPorAluno = await db.getAllCiclosForCalculatorV2();
      const compIdToCodigoMap = await db.getCompIdToCodigoMap();
      const casesMap = await db.getCasesForCalculator();
      const casesData: CaseSucessoData[] = [];
      for (const [, cases] of Array.from(casesMap.entries())) { casesData.push(...cases); }
      
      // Buscar macrociclos
      const macrocicloPorAluno = await db.getMacrocicloPorAluno();
      
      // Calcular indicadores (V2)
      const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesData, undefined, macrocicloPorAluno);
      const dashboard = gerarDashboardGeral(indicadores);
      
      return dashboard;
    }),
    
    // Dashboard por Empresa
    porEmpresa: managerProcedure
      .input(z.object({ empresa: z.string() }))
      .query(async ({ input }) => {
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipationWithDate();
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
            dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa'),
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
            tituloEvento: participation.eventTitle || 'Evento',
            dataEvento: participation.eventDate ? new Date(participation.eventDate) : undefined,
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
      // === UNIFICAÇÃO: Adicionar eventos ausentes (filtrado por macroInicio) ===
      {
        const _epEvtIds = new Map<number, Set<number>>();
        for (const _ep of eventParticipations) {
          if (!_epEvtIds.has(_ep.alunoId)) _epEvtIds.set(_ep.alunoId, new Set());
          _epEvtIds.get(_ep.alunoId)!.add(_ep.eventId);
        }
        const _evtsByProg = new Map<number, Awaited<ReturnType<typeof db.getEventsByProgram>>>();
        for (const _prog of programsList) {
          _evtsByProg.set(_prog.id, await db.getEventsByProgramOrGlobal(_prog.id));
        }
        const _macroInicioMap = await db.getAlunoMacroInicioMap();
        for (const _a of alunosList) {
          if (!_a.programId) continue;
          const _progEvts = _evtsByProg.get(_a.programId) || [];
          const _participated = _epEvtIds.get(_a.id) || new Set();
          const _aIdStr = _a.externalId || String(_a.id);
          const _prog = programMap.get(_a.programId);
          const _macroInicio = _macroInicioMap.get(_a.id);
          for (const _evt of _progEvts) {
            if (!_participated.has(_evt.id)) {
              if (_macroInicio && _evt.eventDate) {
                const evtDate = new Date(_evt.eventDate);
                if (evtDate < _macroInicio) continue;
              }
              eventos.push({
                idUsuario: _aIdStr,
                nomeAluno: _a.name,
                empresa: _prog?.name || 'Desconhecida',
                tituloEvento: _evt.title || 'Evento',
                dataEvento: _evt.eventDate ? new Date(_evt.eventDate) : undefined,
                presenca: 'ausente' as const,
              });
            }
          }
        }
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
        
        // Adicionar dados de performance da tabela student_performance (CSV)
        const studentPerfRecords = await db.getStudentPerformanceAsRecords();
        const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
        for (const spRec of studentPerfRecords) {
          const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
          if (!existingPerfKeys.has(key)) {
            performance.push(spRec);
            existingPerfKeys.add(key);
          }
        }
        
        const ciclosPorAluno = await db.getAllCiclosForCalculatorV2();
        const compIdToCodigoMap = await db.getCompIdToCodigoMap();
        const casesMapEmp = await db.getCasesForCalculator();
        const casesDataEmp: CaseSucessoData[] = [];
        for (const [, cases] of Array.from(casesMapEmp.entries())) { casesDataEmp.push(...cases); }
        const macrocicloPorAlunoEmp = await db.getMacrocicloPorAluno();
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesDataEmp, undefined, macrocicloPorAlunoEmp);
        const dashboard = gerarDashboardEmpresa(indicadores, input.empresa);
        
        // Enriquecer alunos com turma, trilha, ciclo, competências
        const turmasList = await db.getTurmas();
        const turmaMap = new Map(turmasList.map(t => [t.id, t]));
        const consultorsList = await db.getConsultors();
        const consultorMap = new Map(consultorsList.map(c => [c.id, c]));
        
        // Buscar trilhas reais dos alunos via assessment_pdi
        const trilhasReaisPorAluno = await db.getTrilhasReaisPorAluno();
        
        // Buscar PDIs congelados por aluno
        const allAssessmentPdis = await db.getAllAssessmentPdis();
        const allTrilhasLookup = await db.getAllTrilhas();
        const trilhaLookupMap = new Map(allTrilhasLookup.map(t => [t.id, t.name]));
        const pdisCongeladosPorAluno = new Map<number, { trilhaNome: string; motivoCongelamento: string | null }[]>();
        for (const pdi of allAssessmentPdis) {
          if (pdi.status === 'congelado') {
            if (!pdisCongeladosPorAluno.has(pdi.alunoId)) pdisCongeladosPorAluno.set(pdi.alunoId, []);
            pdisCongeladosPorAluno.get(pdi.alunoId)!.push({
              trilhaNome: trilhaLookupMap.get(pdi.trilhaId) || 'Trilha',
              motivoCongelamento: pdi.motivoCongelamento || null,
            });
          }
        }
        
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
          
          // Trilhas reais do aluno (via assessment_pdi)
          const trilhasReais = alunoDb ? (trilhasReaisPorAluno.get(alunoDb.id) || [trilhaNome]) : [trilhaNome];
          
          // PDIs congelados do aluno
          const pdisCongelados = alunoDb ? (pdisCongeladosPorAluno.get(alunoDb.id) || []) : [];
          
          return {
            ...ind,
            alunoDbId: alunoDb?.id || 0,
            turmaNome: turma?.name || 'Não definida',
            trilhaNome,
            trilhasReais,
            cicloAtual,
            mentorNome: mentor?.name || 'Não definido',
            competencias,
            totalCompetencias: competencias.length,
            competenciasComNota: competencias.filter(c => c.nota !== null).length,
            pdisCongelados,
            temPdiCongelado: pdisCongelados.length > 0,
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
        const eventParticipations = await db.getAllEventParticipationWithDate();
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
            dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa'),
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
            tituloEvento: participation.eventTitle || 'Evento',
            dataEvento: participation.eventDate ? new Date(participation.eventDate) : undefined,
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
      // === UNIFICAÇÃO: Adicionar eventos ausentes (filtrado por macroInicio) ===
      {
        const _epEvtIds = new Map<number, Set<number>>();
        for (const _ep of eventParticipations) {
          if (!_epEvtIds.has(_ep.alunoId)) _epEvtIds.set(_ep.alunoId, new Set());
          _epEvtIds.get(_ep.alunoId)!.add(_ep.eventId);
        }
        const _evtsByProg = new Map<number, Awaited<ReturnType<typeof db.getEventsByProgram>>>();
        for (const _prog of programsList) {
          _evtsByProg.set(_prog.id, await db.getEventsByProgramOrGlobal(_prog.id));
        }
        const _macroInicioMap = await db.getAlunoMacroInicioMap();
        for (const _a of alunosList) {
          if (!_a.programId) continue;
          const _progEvts = _evtsByProg.get(_a.programId) || [];
          const _participated = _epEvtIds.get(_a.id) || new Set();
          const _aIdStr = _a.externalId || String(_a.id);
          const _prog = programMap.get(_a.programId);
          const _macroInicio = _macroInicioMap.get(_a.id);
          for (const _evt of _progEvts) {
            if (!_participated.has(_evt.id)) {
              if (_macroInicio && _evt.eventDate) {
                const evtDate = new Date(_evt.eventDate);
                if (evtDate < _macroInicio) continue;
              }
              eventos.push({
                idUsuario: _aIdStr,
                nomeAluno: _a.name,
                empresa: _prog?.name || 'Desconhecida',
                tituloEvento: _evt.title || 'Evento',
                dataEvento: _evt.eventDate ? new Date(_evt.eventDate) : undefined,
                presenca: 'ausente' as const,
              });
            }
          }
        }
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
        
        // Adicionar dados de performance da tabela student_performance (CSV)
        const studentPerfRecords = await db.getStudentPerformanceAsRecords();
        const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
        for (const spRec of studentPerfRecords) {
          const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
          if (!existingPerfKeys.has(key)) {
            performance.push(spRec);
            existingPerfKeys.add(key);
          }
        }
        
        const ciclosPorAluno = await db.getAllCiclosForCalculatorV2();
        const compIdToCodigoMap = await db.getCompIdToCodigoMap();
        const casesMapTurma = await db.getCasesForCalculator();
        const casesDataTurma: CaseSucessoData[] = [];
        for (const [, cases] of Array.from(casesMapTurma.entries())) { casesDataTurma.push(...cases); }
        const macrocicloPorAlunoTurma = await db.getMacrocicloPorAluno();
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesDataTurma, undefined, macrocicloPorAlunoTurma);
        const agregado = agregarIndicadores(indicadores, 'turma', String(input.turmaId));
        const alunos = indicadores.filter(i => i.turma === String(input.turmaId));
        
        return { visaoTurma: agregado, alunos };
      }),
    
    // Dashboard Individual (por aluno)
    porAluno: protectedProcedure
      .input(z.object({ alunoId: z.string() }))
      .query(async ({ input }) => {
        const mentoringSessions = await db.getAllMentoringSessions();
        const eventParticipations = await db.getAllEventParticipationWithDate();
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
            dataSessao: session.sessionDate ? new Date(session.sessionDate) : undefined,
            presenca: session.presence as 'presente' | 'ausente',
            atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa'),
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
            tituloEvento: participation.eventTitle || 'Evento',
            dataEvento: participation.eventDate ? new Date(participation.eventDate) : undefined,
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
        // === UNIFICAÇÃO: Adicionar eventos ausentes (filtrado por macroInicio) ===
        {
          const _epEvtIds = new Map<number, Set<number>>();
          for (const _ep of eventParticipations) {
            if (!_epEvtIds.has(_ep.alunoId)) _epEvtIds.set(_ep.alunoId, new Set());
            _epEvtIds.get(_ep.alunoId)!.add(_ep.eventId);
          }
          const _evtsByProg = new Map<number, Awaited<ReturnType<typeof db.getEventsByProgram>>>();
          for (const _prog of programsList) {
            _evtsByProg.set(_prog.id, await db.getEventsByProgramOrGlobal(_prog.id));
          }
          const _macroInicioMap = await db.getAlunoMacroInicioMap();
          for (const _a of alunosList) {
            if (!_a.programId) continue;
            const _progEvts = _evtsByProg.get(_a.programId) || [];
            const _participated = _epEvtIds.get(_a.id) || new Set();
            const _aIdStr = _a.externalId || String(_a.id);
            const _prog2 = programMap.get(_a.programId);
            const _macroInicio = _macroInicioMap.get(_a.id);
            for (const _evt of _progEvts) {
              if (!_participated.has(_evt.id)) {
                if (_macroInicio && _evt.eventDate) {
                  const evtDate = new Date(_evt.eventDate);
                  if (evtDate < _macroInicio) continue;
                }
                eventos.push({
                  idUsuario: _aIdStr,
                  nomeAluno: _a.name,
                  empresa: _prog2?.name || 'Desconhecida',
                  tituloEvento: _evt.title || 'Evento',
                  dataEvento: _evt.eventDate ? new Date(_evt.eventDate) : undefined,
                  presenca: 'ausente' as const,
                });
              }
            }
          }
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
        
        // Adicionar dados de performance da tabela student_performance (CSV)
        const studentPerfRecords = await db.getStudentPerformanceAsRecords();
        const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
        for (const spRec of studentPerfRecords) {
          const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
          if (!existingPerfKeys.has(key)) {
            performance.push(spRec);
            existingPerfKeys.add(key);
          }
        }
        
        const ciclosPorAluno = await db.getAllCiclosForCalculatorV2();
        const compIdToCodigoMap = await db.getCompIdToCodigoMap();
        const casesMapInd = await db.getCasesForCalculator();
        const casesDataInd: CaseSucessoData[] = [];
        for (const [, cases] of Array.from(casesMapInd.entries())) { casesDataInd.push(...cases); }
        const macrocicloPorAlunoInd = await db.getMacrocicloPorAluno();
        const indicadores = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMap, casesDataInd, undefined, macrocicloPorAlunoInd);
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
        const eventParticipations = await db.getAllEventParticipationWithDate();
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
            atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus as 'entregue' | 'nao_entregue' | 'sem_tarefa') || 'sem_tarefa'),
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
            tituloEvento: participation.eventTitle || 'Evento',
            dataEvento: participation.eventDate ? new Date(participation.eventDate) : undefined,
            presenca: participation.status as 'presente' | 'ausente'
          });
        }
        // === UNIFICAÇÃO: Adicionar eventos ausentes (filtrado por macroInicio) ===
        {
          const _epEvtIds = new Map<number, Set<number>>();
          for (const _ep of eventParticipations) {
            if (!_epEvtIds.has(_ep.alunoId)) _epEvtIds.set(_ep.alunoId, new Set());
            _epEvtIds.get(_ep.alunoId)!.add(_ep.eventId);
          }
          const _evtsByProg = new Map<number, Awaited<ReturnType<typeof db.getEventsByProgram>>>();
          for (const _prog of programsList) {
            _evtsByProg.set(_prog.id, await db.getEventsByProgramOrGlobal(_prog.id));
          }
          const _macroInicioMap = await db.getAlunoMacroInicioMap();
          for (const _a of alunosList) {
            if (!_a.programId) continue;
            const _progEvts = _evtsByProg.get(_a.programId) || [];
            const _participated = _epEvtIds.get(_a.id) || new Set();
            const _aIdStr = _a.externalId || String(_a.id);
            const _prog2 = programMap.get(_a.programId);
            const _macroInicio = _macroInicioMap.get(_a.id);
            for (const _evt of _progEvts) {
              if (!_participated.has(_evt.id)) {
                if (_macroInicio && _evt.eventDate) {
                  const evtDate = new Date(_evt.eventDate);
                  if (evtDate < _macroInicio) continue;
                }
                eventos.push({
                  idUsuario: _aIdStr,
                  nomeAluno: _a.name,
                  empresa: _prog2?.name || 'Desconhecida',
                  tituloEvento: _evt.title || 'Evento',
                  dataEvento: _evt.eventDate ? new Date(_evt.eventDate) : undefined,
                  presenca: 'ausente' as const,
                });
              }
            }
          }
        }
        
        // Adicionar dados de performance da tabela student_performance (CSV)
        const studentPerfRecords = await db.getStudentPerformanceAsRecords();
        const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
        for (const spRec of studentPerfRecords) {
          const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
          if (!existingPerfKeys.has(key)) {
            performance.push(spRec);
            existingPerfKeys.add(key);
          }
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

        // === V2: Calcular indicadores simplificados por ciclo ===
        const ciclosV2 = ciclosAluno.map(c => ({
          ...c,
          trilhaNome: c.nomeCiclo.split(' - ')[0] || 'Geral',
        }));
        const compIdToCodigoMap = await db.getCompIdToCodigoMap();
        const casesAluno = await db.getCasesSucessoByAluno(input.alunoId);
        const casesDataAluno: CaseSucessoData[] = casesAluno.map(c => ({
          alunoId: c.alunoId,
          trilhaId: c.trilhaId,
          trilhaNome: c.trilhaNome,
          entregue: c.entregue === 1,
        }));
        // Buscar macrociclo do aluno
        const macrocicloPorAlunoMap = await db.getMacrocicloPorAluno();
        const macrocicloAluno = macrocicloPorAlunoMap.get(idUsuario);
        const indicadoresV2 = calcularIndicadoresAlunoV2(
          idUsuario, mentorias, eventos, performance, ciclosV2, compIdToCodigoMap, casesDataAluno, undefined, macrocicloAluno
        );
        
        return {
          aluno: {
            id: aluno.id,
            nome: aluno.name,
            externalId: aluno.externalId
          },
          indicadores,
          indicadoresV2: {
            ciclosFinalizados: indicadoresV2.ciclosFinalizados,
            ciclosEmAndamento: indicadoresV2.ciclosEmAndamento,
            consolidado: indicadoresV2.consolidado,
            alertaCasePendente: indicadoresV2.alertaCasePendente,
          },
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
      const allEventParticipations = await db.getAllEventParticipationWithDate();
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
          atividadeEntregue: session.isAssessment ? 'sem_tarefa' : ((session.taskStatus || 'sem_tarefa') as 'entregue' | 'nao_entregue' | 'sem_tarefa'),
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
          tituloEvento: ep.eventTitle || 'Evento',
          dataEvento: ep.eventDate ? new Date(ep.eventDate) : undefined,
          presenca: ep.status as 'presente' | 'ausente',
        });
      }

      // === UNIFICAÇÃO DE FONTE DE DADOS DE EVENTOS (filtrado por macroInicio) ===
      // Para cada aluno, adicionar registros de 'ausente' para eventos do programa
      // onde o aluno NÃO tem registro de participação.
      // Só marca ausência em eventos cuja data seja >= macroInicio do aluno.
      const eventParticipationEventIds = new Map<number, Set<number>>(); // alunoId -> Set<eventId>
      for (const ep of allEventParticipations) {
        if (!eventParticipationEventIds.has(ep.alunoId)) {
          eventParticipationEventIds.set(ep.alunoId, new Set());
        }
        eventParticipationEventIds.get(ep.alunoId)!.add(ep.eventId);
      }
      // Buscar todos os eventos por programa
      const eventsByProgram = new Map<number, Awaited<ReturnType<typeof db.getEventsByProgram>>>();
      for (const prog of programsList) {
        const progEvents = await db.getEventsByProgramOrGlobal(prog.id);
        eventsByProgram.set(prog.id, progEvents);
      }
      const macroInicioMapMeuDash = await db.getAlunoMacroInicioMap();
      // Para cada aluno, adicionar eventos ausentes (sem registro de participação)
      for (const a of alunosList) {
        if (!a.programId) continue;
        const progEvents = eventsByProgram.get(a.programId) || [];
        const alunoParticipatedEvents = eventParticipationEventIds.get(a.id) || new Set();
        const alunoIdStr = a.externalId || String(a.id);
        const program = programMap.get(a.programId);
        const macroInicioAluno = macroInicioMapMeuDash.get(a.id);
        for (const evt of progEvents) {
          if (!alunoParticipatedEvents.has(evt.id)) {
            // Só marcar ausência se o evento é posterior ao macroInicio do aluno
            if (macroInicioAluno && evt.eventDate) {
              const evtDate = new Date(evt.eventDate);
              if (evtDate < macroInicioAluno) continue;
            }
            eventos.push({
              idUsuario: alunoIdStr,
              nomeAluno: a.name,
              empresa: program?.name || 'Desconhecida',
              turma: '',
              trilha: '',
              tituloEvento: evt.title || 'Evento',
              dataEvento: evt.eventDate ? new Date(evt.eventDate) : undefined,
              presenca: 'ausente' as const,
            });
          }
        }
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

      // Adicionar dados de performance da tabela student_performance (CSV)
      const studentPerfRecords = await db.getStudentPerformanceAsRecords();
      const existingPerfKeys = new Set(performance.map(p => `${p.idUsuario}|${p.idCompetencia}`));
      for (const spRec of studentPerfRecords) {
        const key = `${spRec.idUsuario}|${spRec.idCompetencia}`;
        if (!existingPerfKeys.has(key)) {
          performance.push(spRec);
          existingPerfKeys.add(key);
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

      // === V2: Calcular indicadores simplificados por ciclo ===
      const ciclosV2 = ciclosAluno.map(c => ({
        ...c,
        trilhaNome: c.nomeCiclo.split(' - ')[0] || 'Geral',
      }));
      const compIdToCodigoMap = await db.getCompIdToCodigoMap();
      const casesAluno = await db.getCasesSucessoByAluno(aluno.id);
      const casesDataAluno: CaseSucessoData[] = casesAluno.map(c => ({
        alunoId: c.alunoId,
        trilhaId: c.trilhaId,
        trilhaNome: c.trilhaNome,
        entregue: c.entregue === 1,
      }));
      // Buscar macrociclo do aluno
      const macrocicloPorAlunoPortal = await db.getMacrocicloPorAluno();
      const macrocicloAlunoPortal = macrocicloPorAlunoPortal.get(idUsuario);
      const indicadoresV2 = calcularIndicadoresAlunoV2(
        idUsuario, mentorias, eventos, performance, ciclosV2, compIdToCodigoMap, casesDataAluno, undefined, macrocicloAlunoPortal
      );

      // Buscar sessões individuais do aluno para histórico
      const sessoesAluno = await db.getMentoringSessionsByAluno(aluno.id);

      // Buscar participações em eventos do aluno com detalhes
      const eventosAluno = await db.getEventParticipationByAluno(aluno.id);
      // Buscar detalhes dos eventos
      const allEvents = aluno.programId ? await db.getEventsByProgramOrGlobal(aluno.programId) : [];
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
          reflexao: ep.reflexao || null,
          selfReportedAt: ep.selfReportedAt || null,
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

      // Calcular ranking na empresa usando V2 (mesma lógica do Dashboard Gestor)
      // Isso garante que o ranking aqui seja idêntico ao mostrado no Dashboard Gestor
      const ciclosPorAluno = await db.getAllCiclosForCalculatorV2();
      const compIdToCodigoMapAll = await db.getCompIdToCodigoMap();
      const casesMapAll = await db.getCasesForCalculator();
      const casesDataAll: CaseSucessoData[] = [];
      for (const [, cases] of Array.from(casesMapAll.entries())) { casesDataAll.push(...cases); }
      const macrocicloPorAlunoRanking = await db.getMacrocicloPorAluno();
      const todosIndicadoresV2 = calcularIndicadoresTodosAlunos(mentorias, eventos, performance, ciclosPorAluno, compIdToCodigoMapAll, casesDataAll, undefined, macrocicloPorAlunoRanking);

      let ranking = { posicao: 0, totalAlunos: 0 };
      if (aluno.programId) {
        const programa = programMap.get(aluno.programId);
        const empresaNome = programa?.name || '';
        // Filtrar alunos da mesma empresa (mesma lógica de gerarDashboardEmpresa)
        const alunosEmpresaV2 = todosIndicadoresV2
          .filter(i => i.empresa === empresaNome)
          .sort((a, b) => b.notaFinal - a.notaFinal);
        const posicao = alunosEmpresaV2.findIndex(i => i.idUsuario === idUsuario) + 1;
        ranking = { posicao, totalAlunos: alunosEmpresaV2.length };
      }

      // Usar indicadores V2 do aluno para notaFinal e performanceGeral consistentes
      const alunoIndicadoresV2Global = todosIndicadoresV2.find(i => i.idUsuario === idUsuario);

      return {
        found: true as const,
        aluno: {
          id: aluno.id,
          name: aluno.name,
          email: aluno.email,
          telefone: (aluno as any).telefone || null,
          cargo: (aluno as any).cargo || null,
          areaAtuacao: (aluno as any).areaAtuacao || null,
          minicurriculo: (aluno as any).minicurriculo || null,
          quemEVoce: (aluno as any).quemEVoce || null,
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
          mentorEmail: mentorAluno?.email || null,
          mentorEspecialidade: mentorAluno?.especialidade || null,
          mentorId: mentorAluno?.id || null,
        },
        indicadores: {
          // Usar V2 para notaFinal e performanceGeral (consistente com Dashboard Gestor)
          participacaoMentorias: alunoIndicadoresV2Global?.participacaoMentorias ?? indicadores.participacaoMentorias,
          atividadesPraticas: alunoIndicadoresV2Global?.atividadesPraticas ?? indicadores.atividadesPraticas,
          engajamento: alunoIndicadoresV2Global?.engajamento ?? indicadores.engajamento,
          performanceCompetencias: alunoIndicadoresV2Global?.performanceCompetencias ?? indicadores.performanceCompetencias,
          performanceAprendizado: alunoIndicadoresV2Global?.performanceAprendizado ?? indicadores.performanceAprendizado,
          participacaoEventos: alunoIndicadoresV2Global?.participacaoEventos ?? indicadores.participacaoEventos,
          performanceGeral: alunoIndicadoresV2Global?.performanceGeral ?? indicadores.performanceGeral,
          notaFinal: alunoIndicadoresV2Global?.notaFinal ?? indicadores.notaFinal,
          classificacao: alunoIndicadoresV2Global?.classificacao ?? indicadores.classificacao,
          totalMentorias: alunoIndicadoresV2Global?.totalMentorias ?? indicadores.totalMentorias,
          mentoriasPresente: alunoIndicadoresV2Global?.mentoriasPresente ?? indicadores.mentoriasPresente,
          totalAtividades: alunoIndicadoresV2Global?.totalAtividades ?? indicadores.totalAtividades,
          atividadesEntregues: alunoIndicadoresV2Global?.atividadesEntregues ?? indicadores.atividadesEntregues,
          totalEventos: alunoIndicadoresV2Global?.totalEventos ?? indicadores.totalEventos,
          eventosPresente: alunoIndicadoresV2Global?.eventosPresente ?? indicadores.eventosPresente,
          totalCompetencias: alunoIndicadoresV2Global?.totalCompetencias ?? indicadores.totalCompetencias,
          competenciasAprovadas: alunoIndicadoresV2Global?.competenciasAprovadas ?? indicadores.competenciasAprovadas,
          mediaEngajamentoRaw: alunoIndicadoresV2Global?.mediaEngajamentoRaw ?? indicadores.mediaEngajamentoRaw,
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
        // Flag para indicar se o aluno tem PDIs congelados
        pdisCongelados: (await db.getAssessmentsByAluno(aluno.id)).filter(a => a.status === 'congelado').map(a => ({
          id: a.id,
          trilhaNome: a.trilhaNome,
          motivoCongelamento: a.motivoCongelamento,
          congeladoEm: a.congeladoEm,
          congeladoPorNome: a.congeladoPorNome,
        })),
        sessionProgress: await db.getSessionProgressByAluno(aluno.id),
        // Ciclos detalhados com competências e notas (enriquecidos com student_performance)
        ciclosDetalhados: await (async () => {
          const ciclos = await db.getCiclosByAluno(aluno!.id);
          // Criar mapa de performance por codigoIntegracao para lookup rápido
          const perfByCodigoMap = new Map<string, typeof studentPerfRecords[0]>();
          const alunoExternalId = aluno!.externalId || String(aluno!.id);
          for (const sp of studentPerfRecords) {
            if (sp.idUsuario === alunoExternalId) {
              perfByCodigoMap.set(sp.idCompetencia.toLowerCase(), sp);
              if (sp.nomeCompetencia) {
                perfByCodigoMap.set(sp.nomeCompetencia.toLowerCase(), sp);
              }
            }
          }
          return ciclos.map(c => {
            const today = new Date();
            const inicio = new Date(c.dataInicio);
            const fim = new Date(c.dataFim);
            let status: 'finalizado' | 'em_andamento' | 'futuro' = 'futuro';
            if (today > fim) status = 'finalizado';
            else if (today >= inicio && today <= fim) status = 'em_andamento';
            return {
              id: c.id,
              nomeCiclo: c.nomeCiclo,
              dataInicio: typeof c.dataInicio === 'string' ? c.dataInicio : new Date(c.dataInicio).toISOString().split('T')[0],
              dataFim: typeof c.dataFim === 'string' ? c.dataFim : new Date(c.dataFim).toISOString().split('T')[0],
              status,
              competencias: c.competencias.map(comp => {
                const planoItem = planoItems.find(p => p.competenciaId === comp.competenciaId);
                // Buscar nota do student_performance pelo codigoIntegracao
                let nota: number | null = planoItem?.notaAtual ? parseFloat(planoItem.notaAtual) : null;
                let progressoPlataforma: number | null = null;
                const codigoInt = planoItem?.competenciaCodigo || comp.competenciaCodigo;
                if (codigoInt) {
                  const perfRec = perfByCodigoMap.get(codigoInt.toLowerCase());
                  if (perfRec) {
                    if (nota === null) {
                      nota = perfRec.notaAvaliacao; // já em escala 0-10
                    }
                    progressoPlataforma = perfRec.progressoAulas || null;
                  }
                }
                const meta = planoItem?.metaNota ? parseFloat(planoItem.metaNota) : 7;
                return {
                  id: comp.competenciaId,
                  nome: comp.competenciaNome || 'Competência',
                  nota,
                  meta,
                  progressoPlataforma,
                  status: nota !== null && nota >= meta ? 'concluida' as const :
                         (nota !== null || (progressoPlataforma !== null && progressoPlataforma > 0)) ? 'em_progresso' as const : 'pendente' as const,
                };
              }),
            };
          });
        })(),
        // Alertas de micro ciclo - competências obrigatórias com prazo próximo
        alertasMicroCiclo: await (async () => {
          return await db.getAlertasMicroCiclo(aluno!.id);
        })(),
        // === V2: Indicadores simplificados por ciclo ===
        indicadoresV2: {
          ciclosFinalizados: indicadoresV2.ciclosFinalizados,
          ciclosEmAndamento: indicadoresV2.ciclosEmAndamento,
          consolidado: indicadoresV2.consolidado,
          alertaCasePendente: await (async () => {
            // Enriquecer alertas com trilhaId (resolver trilhaNome -> trilhaId)
            const allTrilhasForAlert = await db.getAllTrilhas();
            const trilhaNameToId = new Map(allTrilhasForAlert.map(t => [t.name.toLowerCase(), t.id]));
            return indicadoresV2.alertaCasePendente.map(a => ({
              ...a,
              trilhaId: trilhaNameToId.get(a.trilhaNome?.toLowerCase() || '') || null,
            }));
          })(),
        },
        // Cases de sucesso do aluno
        casesAluno: casesAluno.map(c => ({
          id: c.id,
          trilhaId: c.trilhaId,
          trilhaNome: c.trilhaNome,
          entregue: c.entregue === 1,
          dataEntrega: c.dataEntrega,
          titulo: c.titulo,
          descricao: c.descricao,
          fileUrl: c.fileUrl,
          fileName: c.fileName,
          observacao: c.observacao,
        })),
        // Trilhas disponíveis para o aluno (para saber quais cases pode enviar)
        trilhasDisponiveis: await (async () => {
          const allTrilhas = await db.getAllTrilhas();
          return allTrilhas.filter(t => t.isActive === 1).map(t => ({
            id: t.id,
            name: t.name,
            codigo: t.codigo,
          }));
        })(),
      };
    }),
  }),

  // Mentor/Consultor routes
  mentor: router({
    // Lista mentores ativos (para seleção no Onboarding do aluno)
    list: protectedProcedure.query(async () => {
      return await db.getActiveMentorsForOnboarding();
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
        sessionDate: z.string().optional(),
        notaEvolucao: z.number().min(0).max(10).optional(),
        engagementScore: z.number().min(0).max(10).optional(),
        feedback: z.string().optional(),
        mensagemAluno: z.string().optional(),
        taskId: z.number().nullable().optional(),
        taskDeadline: z.string().nullable().optional(),
        taskStatus: z.enum(["entregue", "nao_entregue", "sem_tarefa"]).optional(),
        presence: z.enum(["presente", "ausente"]).optional(),
        customTaskTitle: z.string().nullable().optional(),
        customTaskDescription: z.string().nullable().optional(),
        taskMode: z.enum(["biblioteca", "personalizada", "livre", "sem_tarefa"]).optional(),
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
        customTaskTitle: z.string().nullable().optional(),
        customTaskDescription: z.string().nullable().optional(),
        taskMode: z.enum(["biblioteca", "personalizada", "livre", "sem_tarefa"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar consultor vinculado ao usuário logado
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.loginId === ctx.user.openId || (ctx.user.consultorId && c.id === ctx.user.consultorId));
        
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
          customTaskTitle: input.customTaskTitle ?? null,
          customTaskDescription: input.customTaskDescription ?? null,
          taskMode: input.taskMode ?? "sem_tarefa",
        });

        // Notificar o aluno sobre a nova sessão registrada (Item 7)
        try {
          const allUsers = await db.getAllUsers();
          const alunoUser = allUsers.find((u: any) => u.alunoId === input.alunoId);
          if (alunoUser) {
            const hasTask = input.taskId || input.taskDeadline;
            await db.createNotification({
              userId: alunoUser.id,
              title: `Sessão de Mentoria #${nextSessionNumber} Registrada`,
              message: hasTask 
                ? `Sua mentora registrou a sessão #${nextSessionNumber}. Você tem uma nova tarefa para realizar!`
                : `Sua mentora registrou a sessão #${nextSessionNumber}. Confira o feedback no seu portal.`,
              type: hasTask ? 'action' : 'info',
              category: 'mentoria',
              link: '/meu-dashboard',
            });
          }
        } catch (e) { /* notificação não deve bloquear registro */ }

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
    
    // Mentor valida a entrega de uma atividade prática (idempotente)
    validateTask: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se é mentor (consultor)
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.loginId === ctx.user.openId || (ctx.user.consultorId && c.id === ctx.user.consultorId));
        if (!consultor && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas mentores podem validar atividades' });
        }

        const session = await db.getMentoringSessionById(input.sessionId);
        if (!session) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        }

        // Idempotência: se já está validada, retorna sucesso sem duplicar
        if (session.taskStatus === 'validada') {
          return { success: true, alreadyValidated: true };
        }

        // Só pode validar se está entregue
        if (session.taskStatus !== 'entregue') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Só é possível validar atividades com status ENTREGUE' });
        }

        await db.updateMentoringSession(input.sessionId, {
          taskStatus: 'validada',
          validatedBy: consultor?.id || ctx.user.id,
          validatedAt: new Date(),
        });

        return { success: true, alreadyValidated: false };
      }),

    // Mentor visualiza detalhe da entrega de um aluno
    getSubmissionDetail: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const session = await db.getMentoringSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        const task = session.taskId ? await db.getTaskLibraryById(session.taskId) : null;
        const comments = await db.getCommentsBySessionId(input.sessionId);
        const allAlunos = await db.getAlunos();
        const aluno = allAlunos.find(a => a.id === session.alunoId);
        const consultors = await db.getConsultors();
        const validador = session.validatedBy ? consultors.find(c => c.id === session.validatedBy) : null;
        return {
          sessionId: session.id,
          alunoId: session.alunoId,
          alunoNome: aluno?.name || 'Aluno não encontrado',
          sessionNumber: session.sessionNumber,
          sessionDate: session.sessionDate,
          taskId: session.taskId,
          taskName: task?.nome || '',
          taskCompetencia: task?.competencia || '',
          taskResumo: task?.resumo || '',
          taskOQueFazer: task?.oQueFazer || '',
          taskDeadline: session.taskDeadline,
          taskStatus: session.taskStatus,
          evidenceLink: session.evidenceLink,
          evidenceImageUrl: session.evidenceImageUrl,
          submittedAt: session.submittedAt,
          validatedBy: session.validatedBy,
          validatedByName: validador?.name || null,
          validatedAt: session.validatedAt,
          relatoAluno: session.relatoAluno,
          comments,
        };
      }),

    // Mentor adiciona comentário em uma entrega
    addTaskComment: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        comment: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.loginId === ctx.user.openId || (ctx.user.consultorId && c.id === ctx.user.consultorId));
        const authorRole = ctx.user.role === 'admin' ? 'admin' : 'mentor';
        const authorName = consultor?.name || ctx.user.name || 'Mentor';

        const id = await db.addActivityComment({
          sessionId: input.sessionId,
          authorId: ctx.user.id,
          authorRole: authorRole as 'mentor' | 'admin',
          authorName,
          comment: input.comment,
        });

        return { success: true, commentId: id };
      }),

    // Mentor: listar sessões com tarefas dos seus alunos (para acompanhamento)
    taskSubmissions: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.loginId === ctx.user.openId || (ctx.user.consultorId && c.id === ctx.user.consultorId));
        if (!consultor) return [];

        const sessions = await db.getMentoringSessionsByConsultor(consultor.id);
        const sessionsWithTask = sessions.filter(s => s.taskId !== null && s.taskId !== undefined);
        
        // Filtrar por status se fornecido
        const filtered = input?.status 
          ? sessionsWithTask.filter(s => s.taskStatus === input.status)
          : sessionsWithTask;

        const allAlunos = await db.getAlunos();
        const alunoMap = new Map(allAlunos.map(a => [a.id, a]));

        const result = await Promise.all(
          filtered.map(async (s) => {
            const task = await db.getTaskLibraryById(s.taskId!);
            const aluno = alunoMap.get(s.alunoId);
            return {
              sessionId: s.id,
              alunoId: s.alunoId,
              alunoNome: aluno?.name || 'Aluno não encontrado',
              sessionNumber: s.sessionNumber,
              sessionDate: s.sessionDate,
              taskName: task?.nome || 'Tarefa não encontrada',
              taskCompetencia: task?.competencia || '',
              taskDeadline: s.taskDeadline,
              taskStatus: s.taskStatus,
              evidenceLink: s.evidenceLink,
              evidenceImageUrl: s.evidenceImageUrl,
              submittedAt: s.submittedAt,
              validatedAt: s.validatedAt,
            };
          })
        );
        return result;
      }),

    // Perfil do mentor (foto + minicurrículo)
    getProfile: protectedProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        const consultor = await db.getConsultorById(input.consultorId);
        if (!consultor) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Mentor não encontrado' });
        }
        return {
          id: consultor.id,
          name: consultor.name,
          email: consultor.email,
          especialidade: consultor.especialidade,
          photoUrl: consultor.photoUrl,
          miniCurriculo: consultor.miniCurriculo,
        };
      }),

    // Atualizar perfil do mentor (foto + minicurrículo)
    updateProfile: protectedProcedure
      .input(z.object({
        consultorId: z.number(),
        miniCurriculo: z.string().optional(),
        especialidade: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { consultorId, ...data } = input;
        const success = await db.updateConsultor(consultorId, data);
        return { success };
      }),

    // Upload de foto do mentor
    uploadPhoto: protectedProcedure
      .input(z.object({
        consultorId: z.number(),
        photoBase64: z.string(),
        mimeType: z.string().default('image/jpeg'),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.photoBase64, 'base64');
        const ext = input.mimeType === 'image/png' ? 'png' : 'jpg';
        const key = `mentors/${input.consultorId}/photo-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await db.updateConsultor(input.consultorId, { photoUrl: url });
        return { url, success: true };
      }),

    // ==================== AGENDA DO MENTOR ====================
    // Listar disponibilidade do mentor
    getAvailability: protectedProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMentorAvailability(input.consultorId);
      }),

    // Salvar/atualizar disponibilidade do mentor
    saveAvailability: managerProcedure
      .input(z.object({
        consultorId: z.number(),
        slots: z.array(z.object({
          id: z.number().optional(), // Se existir, atualiza; se não, cria
          dayOfWeek: z.number().min(0).max(6),
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          slotDurationMinutes: z.number().min(15).max(240).default(60),
          googleMeetLink: z.string().optional(),
          isActive: z.number().default(1),
        })),
      }))
      .mutation(async ({ input }) => {
        return await db.saveMentorAvailability(input.consultorId, input.slots);
      }),

    // Remover slot de disponibilidade
    removeAvailability: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.removeMentorAvailability(input.id);
      }),

    // ===== AGENDA POR DATA ESPECÍFICA =====
    
    // Listar disponibilidade por data específica do mentor
    getDateAvailability: protectedProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMentorDateAvailability(input.consultorId);
      }),

    // Salvar/atualizar disponibilidade por data específica
    saveDateAvailability: managerProcedure
      .input(z.object({
        consultorId: z.number(),
        slots: z.array(z.object({
          id: z.number().optional(),
          specificDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          slotDurationMinutes: z.number().min(15).max(240).default(60),
          googleMeetLink: z.string().optional(),
          isActive: z.number().default(1),
        })),
      }))
      .mutation(async ({ input }) => {
        return await db.saveMentorDateAvailability(input.consultorId, input.slots);
      }),

    // Remover slot de data específica
    removeDateAvailability: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.removeMentorDateAvailability(input.id);
      }),

    // Listar agendamentos do mentor
    getAppointments: protectedProcedure
      .input(z.object({
        consultorId: z.number(),
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getMentorAppointments(input.consultorId, input);
      }),

    // Criar sessão de grupo (mentor define data/hora, convida alunos)
    createGroupSession: managerProcedure
      .input(z.object({
        consultorId: z.number(),
        title: z.string().min(3),
        description: z.string().optional(),
        scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        googleMeetLink: z.string().optional(),
        alunoIds: z.array(z.number()).min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createGroupAppointment({
          consultorId: input.consultorId,
          title: input.title,
          description: input.description || null,
          scheduledDate: input.scheduledDate,
          startTime: input.startTime,
          endTime: input.endTime,
          googleMeetLink: input.googleMeetLink || null,
          alunoIds: input.alunoIds,
          createdBy: ctx.user.id,
        });
      }),

    // Aluno agenda sessão individual (escolhe horário disponível)
    bookAppointment: protectedProcedure
      .input(z.object({
        consultorId: z.number(),
        availabilityId: z.number(),
        scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se o aluno está vinculado
        const alunoId = (ctx.user as any).alunoId;
        if (!alunoId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Usuário não é um aluno' });

        // A4 FIX: Validar dia da semana contra a disponibilidade do mentor
        const avail = await db.getMentorAvailability(input.consultorId);
        const dateObj = new Date(input.scheduledDate + 'T12:00:00');
        const dayOfWeek = dateObj.getDay();
        const matchingSlot = avail.find(a => a.dayOfWeek === dayOfWeek && a.startTime === input.startTime && a.isActive === 1);
        if (!matchingSlot) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'O mentor não tem disponibilidade neste dia/horário. Verifique a agenda.' });
        }

        // Verificar se o horário já não está ocupado
        const existing = await db.checkAppointmentConflict(input.consultorId, input.scheduledDate, input.startTime);
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Este horário já está ocupado. Escolha outro.' });

        return await db.createIndividualAppointment({
          consultorId: input.consultorId,
          availabilityId: input.availabilityId,
          scheduledDate: input.scheduledDate,
          startTime: input.startTime,
          endTime: input.endTime,
          googleMeetLink: null, // Herda do availability
          alunoId,
          notes: input.notes || null,
          createdBy: ctx.user.id,
        });
      }),

    // Aluno confirma/recusa convite de grupo
    respondToInvite: protectedProcedure
      .input(z.object({
        appointmentId: z.number(),
        response: z.enum(['confirmado', 'recusado']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const alunoId = (ctx.user as any).alunoId;
        if (!alunoId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Usuário não é um aluno' });
        return await db.respondToAppointmentInvite(input.appointmentId, alunoId, input.response, input.notes || null);
      }),

    // Cancelar agendamento
    cancelAppointment: protectedProcedure
      .input(z.object({ appointmentId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.cancelAppointment(input.appointmentId);
      }),

    // Listar convites pendentes do aluno
    getMyInvites: protectedProcedure
      .query(async ({ ctx }) => {
        const alunoId = (ctx.user as any).alunoId;
        if (!alunoId) return [];
        return await db.getAlunoInvites(alunoId);
      }),

    // Listar agendamentos do aluno (individuais + grupo confirmados)
    getMyAppointments: protectedProcedure
      .query(async ({ ctx }) => {
        const alunoId = (ctx.user as any).alunoId;
        if (!alunoId) return [];
        return await db.getAlunoAppointments(alunoId);
      }),

    // Obter slots disponíveis para uma data específica
    getAvailableSlots: protectedProcedure
      .input(z.object({
        consultorId: z.number(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(async ({ input }) => {
        const dayOfWeek = new Date(input.date + 'T12:00:00').getDay();
        const availability = await db.getMentorAvailability(input.consultorId);
        const daySlots = availability.filter(a => a.dayOfWeek === dayOfWeek && a.isActive === 1);

        // Gerar slots baseado na duração
        const allSlots: { startTime: string; endTime: string; availabilityId: number; googleMeetLink: string | null }[] = [];
        for (const slot of daySlots) {
          const [sh, sm] = slot.startTime.split(':').map(Number);
          const [eh, em] = slot.endTime.split(':').map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          const duration = slot.slotDurationMinutes;

          for (let t = startMin; t + duration <= endMin; t += duration) {
            const sH = String(Math.floor(t / 60)).padStart(2, '0');
            const sM = String(t % 60).padStart(2, '0');
            const eH = String(Math.floor((t + duration) / 60)).padStart(2, '0');
            const eM = String((t + duration) % 60).padStart(2, '0');
            allSlots.push({
              startTime: `${sH}:${sM}`,
              endTime: `${eH}:${eM}`,
              availabilityId: slot.id,
              googleMeetLink: slot.googleMeetLink,
            });
          }
        }

        // Remover slots já ocupados
        const appointments = await db.getAppointmentsForDate(input.consultorId, input.date);
        const occupiedTimes = new Set(appointments.map(a => a.startTime));
        return allSlots.filter(s => !occupiedTimes.has(s.startTime));
      }),

    // Dashboard consolidado de todos os mentores
    dashboardGeral: managerProcedure.query(async () => {
      const consultors = await db.getConsultors();
      // Filtrar apenas mentores ativos (excluir gerentes)
      const mentoresAtivos = consultors.filter(c => c.role === 'mentor' && c.isActive === 1);
      const allStats = [];
      
      for (const consultor of mentoresAtivos) {
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
        totalMentores: mentoresAtivos.length,
        mentores: allStats.sort((a, b) => b.totalMentorias - a.totalMentorias)
      };
    }),

    // Relatório financeiro de mentorias por período
    relatorioFinanceiro: managerProcedure
      .input(z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getRelatorioFinanceiroMentorias(input?.dateFrom, input?.dateTo);
      }),
  }),

  // ==================== ATIVIDADES PRÁTICAS (ADMIN) ====================
  practicalActivities: router({
    // Admin: consulta de entregas com filtros
    submissions: adminProcedure
      .input(z.object({
        consultorId: z.number().optional(),
        alunoId: z.number().optional(),
        turmaId: z.number().optional(),
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const sessions = await db.getActivitySubmissionsForAdmin(input);
        const allAlunos = await db.getAlunos();
        const alunoMap = new Map(allAlunos.map(a => [a.id, a]));
        const consultors = await db.getConsultors();
        const consultorMap = new Map(consultors.map(c => [c.id, c]));
        const programs = await db.getPrograms();
        const programMap = new Map(programs.map(p => [p.id, p]));

        const result = await Promise.all(
          sessions.map(async (s) => {
            const task = s.taskId ? await db.getTaskLibraryById(s.taskId) : null;
            const aluno = alunoMap.get(s.alunoId);
            const consultor = consultorMap.get(s.consultorId);
            const program = aluno?.programId ? programMap.get(aluno.programId) : null;
            // Determinar nome da tarefa: customTaskTitle > biblioteca > fallback
            const taskName = s.customTaskTitle || task?.nome || '';
            const taskCompetencia = task?.competencia || '';
            return {
              sessionId: s.id,
              alunoId: s.alunoId,
              alunoNome: aluno?.name || 'Aluno não encontrado',
              empresaNome: program?.name || 'N/A',
              consultorId: s.consultorId,
              consultorNome: consultor?.name || 'Mentor não encontrado',
              sessionNumber: s.sessionNumber,
              sessionDate: s.sessionDate,
              taskMode: s.taskMode || 'sem_tarefa',
              taskName,
              taskCompetencia,
              taskDeadline: s.taskDeadline,
              taskStatus: s.taskStatus,
              evidenceLink: s.evidenceLink,
              evidenceImageUrl: s.evidenceImageUrl,
              submittedAt: s.submittedAt,
              validatedAt: s.validatedAt,
              validatedBy: s.validatedBy,
            };
          })
        );
        return result;
      }),

    // Admin: detalhe de uma entrega
    submissionDetail: adminProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const session = await db.getMentoringSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
        const task = session.taskId ? await db.getTaskLibraryById(session.taskId) : null;
        const comments = await db.getCommentsBySessionId(input.sessionId);
        const allAlunos = await db.getAlunos();
        const aluno = allAlunos.find(a => a.id === session.alunoId);
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.id === session.consultorId);
        const validador = session.validatedBy ? consultors.find(c => c.id === session.validatedBy) : null;
        return {
          sessionId: session.id,
          alunoId: session.alunoId,
          alunoNome: aluno?.name || 'Aluno não encontrado',
          consultorNome: consultor?.name || 'Mentor não encontrado',
          sessionNumber: session.sessionNumber,
          sessionDate: session.sessionDate,
          taskId: session.taskId,
          taskMode: session.taskMode || 'sem_tarefa',
          taskName: session.customTaskTitle || task?.nome || '',
          taskCompetencia: task?.competencia || '',
          taskResumo: session.customTaskDescription || task?.resumo || '',
          taskOQueFazer: task?.oQueFazer || session.customTaskDescription || '',
          customTaskTitle: session.customTaskTitle,
          customTaskDescription: session.customTaskDescription,
          taskDeadline: session.taskDeadline,
          taskStatus: session.taskStatus,
          evidenceLink: session.evidenceLink,
          evidenceImageUrl: session.evidenceImageUrl,
          submittedAt: session.submittedAt,
          validatedBy: session.validatedBy,
          validatedByName: validador?.name || null,
          validatedAt: session.validatedAt,
          relatoAluno: session.relatoAluno,
          comments,
        };
      }),

    // Admin: adicionar comentário
    addComment: adminProcedure
      .input(z.object({
        sessionId: z.number(),
        comment: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addActivityComment({
          sessionId: input.sessionId,
          authorId: ctx.user.id,
          authorRole: 'admin',
          authorName: ctx.user.name || 'Administrador',
          comment: input.comment,
        });
        return { success: true, commentId: id };
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
    // Lista TODOS os mentores (ativos e inativos) - para tabela de Cadastros
    listMentores: adminProcedure.query(async () => {
      return await db.getAllMentores();
    }),
    // Lista apenas mentores ATIVOS - para dropdowns de seleção/filtro
    listMentoresAtivos: adminProcedure.query(async () => {
      return await db.getActiveMentores();
    }),
    
     createMentor: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        cpf: z.string().min(11, "CPF deve conter 11 dígitos"),
        especialidade: z.string().optional(),
        loginId: z.string().optional(),
        programId: z.number().optional(),
        valorSessao: z.string().optional(),
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
        valorSessao: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { consultorId, ...data } = input;
        return await db.updateConsultor(consultorId, data);
      }),
    
    // Ativar/Inativar mentor
    toggleMentorStatus: adminProcedure
      .input(z.object({ consultorId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.toggleConsultorStatus(input.consultorId);
      }),

    // Verificar se mentor tem agenda disponível nos próximos 10 dias
    checkAvailabilityNext10Days: protectedProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        const hasAvailability = await db.checkMentorHasAvailabilityNext10Days(input.consultorId);
        return { hasAvailability };
      }),

    // Precificação flexível de sessões do mentor
    getMentorPricing: adminProcedure
      .input(z.object({ consultorId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMentorSessionPricing(input.consultorId);
      }),

    setMentorPricing: adminProcedure
      .input(z.object({
        consultorId: z.number(),
        rules: z.array(z.object({
          sessionFrom: z.number().min(1),
          sessionTo: z.number().min(1),
          valor: z.string(),
          descricao: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        // Validar que sessionTo >= sessionFrom
        for (const rule of input.rules) {
          if (rule.sessionTo < rule.sessionFrom) {
            throw new Error(`Sessão final (${rule.sessionTo}) não pode ser menor que sessão inicial (${rule.sessionFrom})`);
          }
        }
        // Validar que não há sobreposição de faixas
        const sorted = [...input.rules].sort((a, b) => a.sessionFrom - b.sessionFrom);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].sessionFrom <= sorted[i - 1].sessionTo) {
            throw new Error(`Faixas de sessão não podem se sobrepor: sessões ${sorted[i - 1].sessionFrom}-${sorted[i - 1].sessionTo} e ${sorted[i].sessionFrom}-${sorted[i].sessionTo}`);
          }
        }
        await db.setMentorSessionPricing(input.consultorId, input.rules);
        return { success: true };
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
        // Criar registro na tabela consultors com role 'gerente'
        const gerenteResult = await db.createGerente(input);
        
        // Se tem CPF, criar também registro na tabela users para login
        // IMPORTANTE: Gerentes NÃO devem ter consultorId vinculado,
        // pois o DashboardLayout usa consultorId para distinguir mentor vs gerente.
        // Se consultorId estiver presente, o sistema interpreta como Mentor.
        if (input.cpf) {
          await db.createAccessUser({
            name: input.name,
            email: input.email,
            cpf: input.cpf,
            role: 'manager' as const,
            programId: input.managedProgramId,
            consultorId: null, // Gerente não deve ter consultorId
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
        programId: z.number().optional(),
        contratoInicio: z.string().optional(),
        contratoFim: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createAluno(input);

        // Enviar email de boas-vindas ao aluno
        try {
          const { sendEmail, buildOnboardingInviteEmail } = await import('./emailService');
          let empresaName: string | undefined;
          if (input.programId) {
            const allPrograms = await db.getPrograms();
            const program = allPrograms.find(p => p.id === input.programId);
            empresaName = program?.name;
          }
          const emailData = buildOnboardingInviteEmail({
            alunoName: input.name,
            alunoEmail: input.email,
            alunoId: input.externalId,
            empresaName,
            loginUrl: 'https://ecolider.evoluirckm.com/',
          });
          await sendEmail({
            to: input.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          });
        } catch (emailErr) {
          console.warn('[Cadastro] Erro ao enviar email de boas-vindas:', emailErr);
        }

        return result;
      }),

    updateAluno: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        cpf: z.string().nullable().optional(),
        programId: z.number().nullable().optional(),
        consultorId: z.number().nullable().optional(),
        turmaId: z.number().nullable().optional(),
        contratoInicio: z.string().nullable().optional(),
        contratoFim: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { alunoId, contratoInicio, contratoFim, ...data } = input;
        const updateData: any = { ...data };
        if (contratoInicio !== undefined) updateData.contratoInicio = contratoInicio ? new Date(contratoInicio) : null;
        if (contratoFim !== undefined) updateData.contratoFim = contratoFim ? new Date(contratoFim) : null;
        return await db.updateAluno(alunoId, updateData);
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
        consultorId: z.number().nullable().optional(),
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

    // ============ GERENTES DE EMPRESA (VISÃO DUPLA) ============
    
    // Listar gerentes de empresa com info completa
    listGerentesEmpresa: adminProcedure.query(async () => {
      return await db.getGerentesEmpresa();
    }),

    // Buscar alunos de uma empresa (para select de promoção)
    alunosByProgram: adminProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAlunosByProgram(input.programId);
      }),

    // Promover aluno a gerente de empresa
    promoteToGerente: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        programId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.promoteAlunoToGerente(input.alunoId, input.programId);
      }),

    // Criar gerente puro (sem perfil de aluno)
    createGerentePuro: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        cpf: z.string().optional(),
        programId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.createGerentePuro(input);
      }),

    // Remover papel de gerente
    removeGerente: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.removeGerenteRole(input.userId);
      }),

    // Cadastro Direto de Aluno pelo Admin (com bypass de onboarding)
    createAlunoDireto: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        cpf: z.string().min(1),
        programId: z.number(),
        consultorId: z.number(), // mentor vinculado
        turmaId: z.number().nullable().optional(),
        contratoInicio: z.string().optional(),
        contratoFim: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createAlunoDireto(input);

        // Enviar email de boas-vindas ao aluno
        try {
          const { sendEmail, buildOnboardingInviteEmail } = await import('./emailService');
          const allPrograms = await db.getPrograms();
          const program = allPrograms.find(p => p.id === input.programId);
          const emailData = buildOnboardingInviteEmail({
            alunoName: input.name,
            alunoEmail: input.email,
            alunoId: input.cpf,
            empresaName: program?.name,
            loginUrl: 'https://ecolider.evoluirckm.com/',
          });
          await sendEmail({
            to: input.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          });
        } catch (emailErr) {
          console.warn('[Cadastro Direto] Erro ao enviar email de boas-vindas:', emailErr);
        }

        return result;
      }),

    // Check aluno dependencies before deletion
    getAlunoDependencies: adminProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAlunoDependencies(input.alunoId);
      }),

    // Toggle ativar/inativar aluno
    toggleAlunoStatus: adminProcedure
      .input(z.object({ alunoId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.toggleAlunoStatus(input.alunoId);
      }),

    // Delete aluno and all related data
    deleteAluno: adminProcedure
      .input(z.object({ alunoId: z.number(), confirmCascade: z.boolean().default(false) }))
      .mutation(async ({ input }) => {
        // First check dependencies
        const deps = await db.getAlunoDependencies(input.alunoId);
        if (!deps) return { success: false, message: "Erro ao verificar dependências" };
        
        // If has related data and no confirmation, return deps info
        if (deps.totalRelated > 0 && !input.confirmCascade) {
          return { success: false, message: "Aluno possui dados relacionados", dependencies: deps, requiresConfirmation: true };
        }
        
        return await db.deleteAluno(input.alunoId);
      }),

    // ============ PAINEL DE AGENDAMENTOS ============
    allAppointments: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        consultorId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllAppointments(input);
       }),

    // ============ EDITAR MENTORIAS (PARAMETRIZAÇÃO) ============
    listMentoringSessions: adminProcedure
      .input(z.object({
        programId: z.number().optional(),
        turmaId: z.number().optional(),
        alunoId: z.number().optional(),
        consultorId: z.number().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      }))
      .query(async ({ input }) => {
        const filters = input;
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 50;
        const offset = (page - 1) * pageSize;

        const dbInstance = await (await import('./db')).getDb();
        if (!dbInstance) return { sessions: [], total: 0 };

        const { mentoringSessions, alunos: alunosTable, consultors: consultorsTable, turmas: turmasTable, programs: programsTable, trilhas: trilhasTable } = await import('../drizzle/schema');
        const { eq, and, sql, desc } = await import('drizzle-orm');

        // Build conditions
        const conditions: any[] = [];
        if (filters.alunoId) conditions.push(eq(mentoringSessions.alunoId, filters.alunoId));
        if (filters.consultorId) conditions.push(eq(mentoringSessions.consultorId, filters.consultorId));
        if (filters.turmaId) conditions.push(eq(mentoringSessions.turmaId, filters.turmaId));

        // If programId filter, get turma IDs for that program
        if (filters.programId && !filters.turmaId) {
          const turmasForProgram = await dbInstance.select({ id: turmasTable.id }).from(turmasTable).where(eq(turmasTable.programId, filters.programId));
          const turmaIds = turmasForProgram.map(t => t.id);
          if (turmaIds.length > 0) {
            conditions.push(sql`${mentoringSessions.turmaId} IN (${sql.raw(turmaIds.join(','))})`);
          } else {
            return { sessions: [], total: 0 };
          }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Count total
        const [countResult] = await dbInstance.select({ count: sql<number>`COUNT(*)` }).from(mentoringSessions).where(whereClause);
        const total = Number(countResult?.count || 0);

        // Get sessions with pagination
        let query = dbInstance.select().from(mentoringSessions).where(whereClause).orderBy(desc(mentoringSessions.sessionDate), desc(mentoringSessions.id)).limit(pageSize).offset(offset);
        const sessions = await query;

        // Get related data for display
        const alunoIds = Array.from(new Set(sessions.map(s => s.alunoId)));
        const consultorIds = Array.from(new Set(sessions.filter(s => s.consultorId).map(s => s.consultorId!)));
        const turmaIds = Array.from(new Set(sessions.filter(s => s.turmaId).map(s => s.turmaId!)));
        const trilhaIds = Array.from(new Set(sessions.filter(s => s.trilhaId).map(s => s.trilhaId!)));

        const alunosList = alunoIds.length > 0 ? await dbInstance.select({ id: alunosTable.id, name: alunosTable.name }).from(alunosTable).where(sql`${alunosTable.id} IN (${sql.raw(alunoIds.join(','))})`) : [];
        const consultorsList = consultorIds.length > 0 ? await dbInstance.select({ id: consultorsTable.id, name: consultorsTable.name }).from(consultorsTable).where(sql`${consultorsTable.id} IN (${sql.raw(consultorIds.join(','))})`) : [];
        const turmasList = turmaIds.length > 0 ? await dbInstance.select({ id: turmasTable.id, name: turmasTable.name }).from(turmasTable).where(sql`${turmasTable.id} IN (${sql.raw(turmaIds.join(','))})`) : [];
        const trilhasList = trilhaIds.length > 0 ? await dbInstance.select({ id: trilhasTable.id, name: trilhasTable.name }).from(trilhasTable).where(sql`${trilhasTable.id} IN (${sql.raw(trilhaIds.join(','))})`) : [];

        const alunoMap = new Map(alunosList.map(a => [a.id, a.name]));
        const consultorMap = new Map(consultorsList.map(c => [c.id, c.name]));
        const turmaMap = new Map(turmasList.map(t => [t.id, t.name]));
        const trilhaMap = new Map(trilhasList.map(t => [t.id, t.name]));

        const enrichedSessions = sessions.map(s => ({
          ...s,
          alunoNome: alunoMap.get(s.alunoId) || 'Desconhecido',
          consultorNome: s.consultorId ? consultorMap.get(s.consultorId) || 'Desconhecido' : null,
          turmaNome: s.turmaId ? turmaMap.get(s.turmaId) || null : null,
          trilhaNome: s.trilhaId ? trilhaMap.get(s.trilhaId) || null : null,
        }));

        return { sessions: enrichedSessions, total };
      }),

    updateSessionDate: adminProcedure
      .input(z.object({
        sessionId: z.number(),
        sessionDate: z.string().optional(),
        sessionNumber: z.number().optional(),
        consultorId: z.number().optional(),
        taskStatus: z.enum(["entregue", "nao_entregue", "sem_tarefa", "validada"]).optional(),
        presence: z.enum(["presente", "ausente"]).optional(),
      }))
      .mutation(async ({ input }) => {
        // If sessionNumber is being changed, validate no duplicate for same aluno
        if (input.sessionNumber !== undefined) {
          const session = await db.getMentoringSessionById(input.sessionId);
          if (session) {
            const existingSessions = await db.getMentoringSessionsByAluno(session.alunoId);
            const duplicate = existingSessions.find(
              (s: any) => s.sessionNumber === input.sessionNumber && s.id !== input.sessionId
            );
            if (duplicate) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: `Este aluno já possui uma sessão #${input.sessionNumber}. Escolha outro número.`,
              });
            }
          }
        }

        const updateData: Record<string, any> = {};
        if (input.sessionDate !== undefined) updateData.sessionDate = input.sessionDate;
        if (input.sessionNumber !== undefined) updateData.sessionNumber = input.sessionNumber;
        if (input.consultorId !== undefined) updateData.consultorId = input.consultorId;
        if (input.taskStatus !== undefined) updateData.taskStatus = input.taskStatus;
        if (input.presence !== undefined) updateData.presence = input.presence;

        const success = await db.updateMentoringSession(input.sessionId, updateData);
        return { success };
      }),

    deleteSession: adminProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const success = await db.deleteMentoringSession(input.sessionId);
        return { success };
      }),

    adminCreateSession: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        consultorId: z.number(),
        sessionDate: z.string(),
        sessionNumber: z.number().min(1),
        presence: z.enum(["presente", "ausente"]),
        taskStatus: z.enum(["entregue", "nao_entregue", "sem_tarefa"]),
        notaEvolucao: z.number().min(0).max(10).nullable().optional(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Verificar se já existe sessão com mesmo número para o mesmo aluno
        const existingSessions = await db.getMentoringSessionsByAluno(input.alunoId);
        const duplicate = existingSessions.find(s => s.sessionNumber === input.sessionNumber);
        if (duplicate) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Já existe uma sessão #${input.sessionNumber} para este aluno`,
          });
        }

        // Buscar dados do aluno para turma e trilha
        const aluno = await db.getAlunoById(input.alunoId);
        if (!aluno) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }

        const sessionId = await db.createMentoringSession({
          alunoId: input.alunoId,
          consultorId: input.consultorId,
          turmaId: aluno.turmaId,
          trilhaId: aluno.trilhaId,
          sessionNumber: input.sessionNumber,
          sessionDate: input.sessionDate,
          presence: input.presence,
          taskStatus: input.taskStatus,
          engagementScore: null,
          notaEvolucao: input.notaEvolucao ?? null,
          feedback: input.feedback,
          mensagemAluno: undefined,
          taskId: null,
          taskDeadline: null,
          customTaskTitle: null,
          customTaskDescription: null,
          taskMode: "sem_tarefa",
        });

        // Notificar admin por e-mail com cópia para dina@makiyama.com.br
        try {
          const { sendEmail } = await import('./emailService');
          const { ENV } = await import('./_core/env');
          const consultors = await db.getConsultors();
          const mentor = consultors.find(c => c.id === input.consultorId);
          const mentorNome = mentor?.name || 'Não definido';
          const alunoNome = aluno.name || 'Não definido';
          const dataFormatada = new Date(input.sessionDate + 'T12:00:00').toLocaleDateString('pt-BR');

          await sendEmail({
            to: ENV.smtpUser,
            cc: 'dina@makiyama.com.br',
            subject: `[ECOSSISTEMA DO BEM] Nova Sessão de Mentoria Criada - ${alunoNome}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0f3d5c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="margin: 0;">Nova Sessão de Mentoria Criada</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Aluno:</td><td style="padding: 8px;">${alunoNome}</td></tr>
                    <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold; color: #374151;">Mentor:</td><td style="padding: 8px;">${mentorNome}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Sessão:</td><td style="padding: 8px;">#${input.sessionNumber}</td></tr>
                    <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold; color: #374151;">Data:</td><td style="padding: 8px;">${dataFormatada}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; color: #374151;">Presença:</td><td style="padding: 8px;">${input.presence === 'presente' ? 'Presente' : 'Ausente'}</td></tr>
                    <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold; color: #374151;">Tarefa:</td><td style="padding: 8px;">${input.taskStatus === 'entregue' ? 'Entregue' : input.taskStatus === 'nao_entregue' ? 'Não entregue' : 'Sem tarefa'}</td></tr>
                  </table>
                  <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">Esta sessão foi criada manualmente pelo administrador.</p>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('[AdminCreateSession] Erro ao enviar notificação por e-mail:', emailError);
        }

        return { success: true, sessionId };
      }),
  }),
  // Status de onboarding do aluno logado
  aluno: router({
    onboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      return await db.getAlunoOnboardingStatus(ctx.user);
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
        totalSessoesPrevistas: z.number().min(1).nullable().optional(),
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
        
        // Auto-sincronizar plano_individual com as competências do assessment
        try {
          await db.syncPlanoFromAssessment(input.alunoId);
        } catch (e) { /* sync não deve bloquear criação */ }
        
        // Notificar o aluno que o assessment foi criado (Item 7)
        try {
          // Buscar o userId do aluno pelo alunoId
          const alunoInfo = await db.getAlunoById(input.alunoId);
          if (alunoInfo) {
            // Buscar user vinculado ao aluno
            const allUsers = await db.getAllUsers();
            const alunoUser = allUsers.find((u: any) => u.alunoId === input.alunoId);
            if (alunoUser) {
              await db.createNotification({
                userId: alunoUser.id,
                title: 'Assessment PDI Criado',
                message: `Sua mentora criou um novo Assessment PDI para você. Seu portal completo já está disponível!`,
                type: 'success',
                category: 'assessment',
                link: '/meu-dashboard',
              });
            }
          }
        } catch (e) { /* notificação não deve bloquear criação */ }
        
        return { success: true, pdiId };
      }),

    // Congelar assessment PDI (com motivo obrigatório)
    congelar: protectedProcedure
      .input(z.object({
        pdiId: z.number(),
        consultorId: z.number(),
        motivo: z.string().min(1, 'Motivo é obrigatório'),
      }))
      .mutation(async ({ input }) => {
        await db.congelarAssessmentPdi(input.pdiId, input.consultorId, input.motivo);
        return { success: true };
      }),

    // Descongelar assessment PDI (reverter para ativo)
    descongelar: protectedProcedure
      .input(z.object({
        pdiId: z.number(),
        consultorId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.descongelarAssessmentPdi(input.pdiId, input.consultorId);
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

    // Atualizar assessment PDI (trilha, datas macro, mentora, etc.)
    atualizar: protectedProcedure
      .input(z.object({
        pdiId: z.number(),
        trilhaId: z.number().optional(),
        consultorId: z.number().nullable().optional(),
        turmaId: z.number().nullable().optional(),
        programId: z.number().nullable().optional(),
        macroInicio: z.string().optional(),
        macroTermino: z.string().optional(),
        totalSessoesPrevistas: z.number().min(1).nullable().optional(),
        observacoes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { pdiId, ...data } = input;
        // Validate macro dates if both provided
        if (data.macroInicio && data.macroTermino && data.macroInicio >= data.macroTermino) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Data de início deve ser anterior à data de término',
          });
        }
        await db.updateAssessmentPdi(pdiId, data);
        return { success: true };
      }),

    // Adicionar competência a um assessment existente
    adicionarCompetencia: protectedProcedure
      .input(z.object({
        assessmentPdiId: z.number(),
        competenciaId: z.number(),
        peso: z.enum(['obrigatoria', 'opcional']),
        notaCorte: z.string().optional(),
        microInicio: z.string().nullable().optional(),
        microTermino: z.string().nullable().optional(),
        nivelAtual: z.string().nullable().optional(),
        metaCiclo1: z.string().nullable().optional(),
        metaCiclo2: z.string().nullable().optional(),
        metaFinal: z.string().nullable().optional(),
        justificativa: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { assessmentPdiId, ...data } = input;
        const id = await db.addCompetenciaToAssessment(assessmentPdiId, data);
        // Auto-sincronizar plano_individual
        try {
          const allPdis = await db.getAllAssessmentPdis();
          const pdi = allPdis.find((p: any) => p.id === assessmentPdiId);
          if (pdi) await db.syncPlanoFromAssessment(pdi.alunoId);
        } catch (e) { /* sync não deve bloquear */ }
        return { success: true, id };
      }),

    // Remover competência de um assessment
    removerCompetencia: protectedProcedure
      .input(z.object({
        assessmentCompetenciaId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.removeCompetenciaFromAssessment(input.assessmentCompetenciaId);
        return { success: true };
      }),

    // Excluir assessment PDI completo
    excluir: protectedProcedure
      .input(z.object({
        pdiId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteAssessmentPdi(input.pdiId);
        return { success: true };
      }),
  }),

  // ==================== WEBINARS MANAGEMENT ====================
  webinars: router({
    list: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.listWebinars(input?.status);
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getWebinarById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        theme: z.string().optional(),
        speaker: z.string().optional(),
        speakerBio: z.string().optional(),
        eventDate: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        duration: z.number().optional(),
        meetingLink: z.string().optional(),
        youtubeLink: z.string().optional(),
        targetAudience: z.enum(['all', 'sebrae_to', 'sebrae_acre', 'embrapii', 'banrisul']).optional(),
        status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const eventDate = new Date(input.eventDate);
        const startDate = input.startDate ? new Date(input.startDate) : eventDate;
        const endDate = input.endDate ? new Date(input.endDate) : new Date(eventDate.getTime() + (input.duration || 60) * 60000);
        const id = await db.createWebinar({
          ...input,
          eventDate,
          startDate,
          endDate,
          createdBy: ctx.user.id,
        });
        // Se o webinar já foi criado como published, criar automaticamente o evento na tabela events
        if (input.status === 'published') {
          await db.ensureEventForWebinar(id);
        }
        return { id, success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        theme: z.string().optional(),
        speaker: z.string().optional(),
        speakerBio: z.string().optional(),
        eventDate: z.string().optional(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        duration: z.number().optional(),
        meetingLink: z.string().optional(),
        youtubeLink: z.string().optional(),
        targetAudience: z.enum(['all', 'sebrae_to', 'sebrae_acre', 'embrapii', 'banrisul']).optional(),
        status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.eventDate) updateData.eventDate = new Date(data.eventDate);
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        await db.updateWebinar(id, updateData);
        // Se o status mudou para published, garantir que existe o evento na tabela events
        if (data.status === 'published') {
          await db.ensureEventForWebinar(id);
        }
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteWebinar(input.id);
        return { success: true };
      }),

    uploadCard: adminProcedure
      .input(z.object({
        webinarId: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const ext = input.fileName.split('.').pop() || 'png';
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const fileKey = `webinar-cards/webinar-${input.webinarId}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        await db.updateWebinar(input.webinarId, {
          cardImageUrl: url,
          cardImageKey: fileKey,
        });
        return { url, success: true };
      }),

    sendReminder: adminProcedure
      .input(z.object({ webinarId: z.number() }))
      .mutation(async ({ input }) => {
        const webinar = await db.getWebinarById(input.webinarId);
        if (!webinar) throw new TRPCError({ code: 'NOT_FOUND', message: 'Webinar não encontrado' });
        
        // Get all active student emails
        const students = await db.getStudentEmailsByProgram();
        const validEmails = students.filter(s => s.email).map(s => ({ email: s.email!, name: s.name || 'Aluno' }));
        
        if (validEmails.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum aluno com email cadastrado encontrado' });
        }
        
        // Send notification to owner about the reminder
        const eventDateStr = webinar.eventDate ? new Date(webinar.eventDate).toLocaleDateString('pt-BR') : 'Data não definida';
        await notifyOwner({
          title: `Lembrete de Webinar Enviado`,
          content: `Lembrete do webinar "${webinar.title}" (${eventDateStr}) enviado para ${validEmails.length} alunos.`,
        });
        
        // Update reminder status
        await db.updateWebinar(input.webinarId, {
          reminderSent: 1,
          reminderSentAt: new Date(),
        });
        
        return { success: true, emailsSent: validEmails.length };
      }),

    // Public endpoint for students to see upcoming webinars
    upcoming: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.listUpcomingWebinars(input?.limit || 10);
      }),

    past: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.listPastWebinars(input?.limit || 10);
      }),
  }),

  // ==================== ANNOUNCEMENTS ====================
  announcements: router({
    // Avisos ativos para alunos (filtrado por programa)
    activeForStudent: protectedProcedure
      .query(async ({ ctx }) => {
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        return await db.listActiveAnnouncementsForStudent(aluno?.programId || undefined);
      }),
    list: adminProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return await db.listAnnouncements(input?.activeOnly);
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAnnouncementById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().optional(),
        type: z.enum(['webinar', 'course', 'activity', 'notice', 'news']),
        imageUrl: z.string().optional(),
        actionUrl: z.string().optional(),
        actionLabel: z.string().optional(),
        targetAudience: z.enum(['all', 'sebrae_to', 'sebrae_acre', 'embrapii', 'banrisul']).optional(),
        priority: z.number().optional(),
        publishAt: z.string().optional(),
        expiresAt: z.string().optional(),
        isActive: z.number().optional(),
        webinarId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const data: any = { ...input, createdBy: ctx.user.id };
        if (input.publishAt) data.publishAt = new Date(input.publishAt);
        if (input.expiresAt) data.expiresAt = new Date(input.expiresAt);
        const id = await db.createAnnouncement(data);
        return { id, success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(['webinar', 'course', 'activity', 'notice', 'news']).optional(),
        imageUrl: z.string().optional(),
        actionUrl: z.string().optional(),
        actionLabel: z.string().optional(),
        targetAudience: z.enum(['all', 'sebrae_to', 'sebrae_acre', 'embrapii', 'banrisul']).optional(),
        priority: z.number().optional(),
        publishAt: z.string().optional(),
        expiresAt: z.string().optional(),
        isActive: z.number().optional(),
        webinarId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.publishAt) updateData.publishAt = new Date(data.publishAt);
        if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);
        await db.updateAnnouncement(id, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAnnouncement(input.id);
        return { success: true };
      }),

    // Public endpoint for students
    active: protectedProcedure
      .query(async () => {
        return await db.listActiveAnnouncementsForStudent();
      }),
  }),

  // ==================== ATTENDANCE (Presença + Reflexão) ====================
  attendance: router({
    // Aluno marca presença e envia reflexão (funciona para webinários agendados e eventos importados)
    markPresence: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        reflexao: z.string().min(20, 'A reflexão deve ter pelo menos 20 caracteres'),
      }))
      .mutation(async ({ input, ctx }) => {
        // Buscar alunoId pelo userId logado
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        if (!aluno) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }

        let realEventId = input.eventId;

        // Se o eventId é sintético (>900000), significa que veio de scheduled_webinars
        // e ainda não existe na tabela events. Criar automaticamente.
        if (input.eventId > 900000) {
          const scheduledWebinarId = input.eventId - 900000;
          realEventId = await db.ensureEventForWebinar(scheduledWebinarId);
        }

        // Buscar o evento na tabela events
        const eventRecord = await db.getEventById(realEventId);
        if (!eventRecord) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento não encontrado.' });
        }

        // Verificar se é um webinário agendado (tem endDate) - verificar se já iniciou
        const allWebinars = await db.listWebinars();
        const matchingWebinar = allWebinars.find((w: any) => 
          w.title?.toLowerCase().trim() === eventRecord.title?.toLowerCase().trim()
        );
        if (matchingWebinar) {
          // É um webinário agendado - verificar se já iniciou (regra: libera assim que inicia)
          const startDate = matchingWebinar.startDate || matchingWebinar.eventDate;
          if (startDate && new Date(startDate) > new Date()) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'A marcação de presença só é liberada após o início do evento.' });
          }
        }
        // Para eventos importados (sem webinar agendado correspondente), permite marcar presença a qualquer momento

        const result = await db.markWebinarAttendance(aluno.id, realEventId, input.reflexao);
        return { success: true, ...result };
      }),

    // Listar TODOS os eventos do aluno (lista unificada com status)
    pending: protectedProcedure
      .query(async ({ ctx }) => {
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        if (!aluno) return { events: [], periodoInicio: null, periodoFim: null };
        const events = await db.getWebinarsPendingAttendance(aluno.id);
        // Buscar período do macrociclo para exibir ao aluno
        const macroInicioMap = await db.getAlunoMacroInicioMap();
        const macroInicio = macroInicioMap.get(aluno.id);
        // Período fim: macroInicio + 6 meses (padrão do macrociclo)
        let periodoFim: Date | null = null;
        if (macroInicio) {
          periodoFim = new Date(macroInicio);
          periodoFim.setMonth(periodoFim.getMonth() + 6);
        }
        return {
          events,
          periodoInicio: macroInicio ? macroInicio.toISOString() : null,
          periodoFim: periodoFim ? periodoFim.toISOString() : null,
        };
      }),

    // Admin: atualizar videoLink de um evento importado
    updateVideoLink: adminProcedure
      .input(z.object({
        eventId: z.number(),
        videoLink: z.string().min(1, 'Link do vídeo é obrigatório'),
      }))
      .mutation(async ({ input }) => {
        await db.updateEventVideoLink(input.eventId, input.videoLink);
        return { success: true };
      }),

    // Listar webinars já confirmados pelo aluno (com reflexão)
    myAttendance: protectedProcedure
      .query(async ({ ctx }) => {
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        if (!aluno) return [];
        const participations = await db.getEventParticipationByAluno(aluno.id);
        // Buscar events pelos IDs das participacoes (sem filtrar por programa)
        const eventIds = participations.map(p => p.eventId);
        const eventsArr = await Promise.all(eventIds.map(id => db.getEventById(id)));
        const allScheduled = await db.listWebinars();
        const eventMap = new Map<number, NonNullable<Awaited<ReturnType<typeof db.getEventById>>>>();
        for (const e of eventsArr) { if (e) eventMap.set(e.id, e); }
        const scheduledByTitle = new Map(allScheduled.map(sw => [sw.title?.toLowerCase().trim(), sw]));

        // Filtrar apenas presenças confirmadas (status="presente")
        // Alunos com status "ausente" podem marcar presença depois
        return participations
          .filter(p => p.status === 'presente')
          .map(p => {
            const evt = eventMap.get(p.eventId);
            const matchedWebinar = evt ? scheduledByTitle.get(evt.title?.toLowerCase().trim() || '') : null;
            return {
              eventId: p.eventId,
              scheduledWebinarId: matchedWebinar?.id || null,
              reflexao: p.reflexao,
              selfReportedAt: p.selfReportedAt,
              status: p.status,
            };
          });
      }),

    // Tarefas práticas atribuídas ao aluno pelo mentor
    myTasks: protectedProcedure
      .query(async ({ ctx }) => {
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        if (!aluno) return [];
        const sessions = await db.getMentoringSessionsByAluno(aluno.id);
        // Incluir sessões com qualquer modo de tarefa (biblioteca, personalizada, livre)
        // Excluir apenas sem_tarefa e sessões sem nenhum dado de tarefa
        const sessionsWithTask = sessions.filter(s => {
          // Tem taskId (biblioteca ou personalizada com base)
          if (s.taskId !== null && s.taskId !== undefined) return true;
          // Tem modo personalizada ou livre com título customizado
          if (s.taskMode === 'personalizada' || s.taskMode === 'livre') return true;
          // Tem customTaskTitle preenchido (fallback)
          if (s.customTaskTitle) return true;
          return false;
        });
        // Buscar detalhes de cada tarefa
        const tasks = await Promise.all(
          sessionsWithTask.map(async (s) => {
            const task = s.taskId ? await db.getTaskLibraryById(s.taskId) : null;
            const comments = await db.getCommentsBySessionId(s.id);
            
            // Determinar nome da tarefa: customTaskTitle > biblioteca > fallback
            let taskName = 'Tarefa não encontrada';
            if (s.customTaskTitle) {
              taskName = s.customTaskTitle;
            } else if (task?.nome) {
              taskName = task.nome;
            }
            
            // Determinar descrição: customTaskDescription > biblioteca resumo
            const taskResumo = s.customTaskDescription || task?.resumo || '';
            const taskOQueFazer = task?.oQueFazer || s.customTaskDescription || '';
            const taskOQueGanha = task?.oQueGanha || '';
            const taskCompetencia = task?.competencia || '';
            
            return {
              sessionId: s.id,
              sessionNumber: s.sessionNumber,
              sessionDate: s.sessionDate,
              taskId: s.taskId,
              taskMode: s.taskMode || 'sem_tarefa',
              taskDeadline: s.taskDeadline,
              taskStatus: s.taskStatus,
              taskName,
              taskCompetencia,
              taskResumo,
              taskOQueFazer,
              taskOQueGanha,
              customTaskTitle: s.customTaskTitle,
              customTaskDescription: s.customTaskDescription,
              // Campos de evidência
              evidenceLink: s.evidenceLink,
              evidenceImageUrl: s.evidenceImageUrl,
              submittedAt: s.submittedAt,
              // Campos de validação
              validatedBy: s.validatedBy,
              validatedAt: s.validatedAt,
              relatoAluno: s.relatoAluno,
              // Comentários
              comments,
            };
          })
        );
        return tasks;
      }),

    // Aluno envia evidência (link e/ou imagem) para uma tarefa
    submitEvidence: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        evidenceLink: z.string().url().optional(),
        evidenceImageBase64: z.string().optional(), // Base64 da imagem
        evidenceImageName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        if (!aluno) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });

        // Verificar se a sessão pertence ao aluno
        const session = await db.getMentoringSessionById(input.sessionId);
        if (!session || session.alunoId !== aluno.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sessão não pertence a este aluno' });
        }

        // Verificar se já está validada
        if (session.taskStatus === 'validada') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Atividade já foi validada, não pode ser alterada' });
        }

        // Exigir pelo menos link ou imagem
        if (!input.evidenceLink && !input.evidenceImageBase64) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Envie pelo menos um link ou uma imagem como evidência' });
        }

        let imageUrl: string | null = null;
        let imageKey: string | null = null;

        // Upload de imagem para S3 se fornecida
        if (input.evidenceImageBase64) {
          const buffer = Buffer.from(input.evidenceImageBase64, 'base64');
          // Validar tamanho (5MB)
          if (buffer.length > 5 * 1024 * 1024) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Imagem deve ter no máximo 5MB' });
          }
          const ext = input.evidenceImageName?.split('.').pop()?.toLowerCase() || 'jpg';
          if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Formato de imagem inválido. Use JPG, PNG ou WebP' });
          }
          const randomSuffix = Math.random().toString(36).substring(2, 10);
          const fileKey = `evidence/${aluno.id}-${input.sessionId}-${randomSuffix}.${ext}`;
          const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          const result = await storagePut(fileKey, buffer, contentType);
          imageUrl = result.url;
          imageKey = result.key;
        }

        // Atualizar sessão com evidência
        await db.updateMentoringSession(input.sessionId, {
          evidenceLink: input.evidenceLink || null,
          evidenceImageUrl: imageUrl,
          evidenceImageKey: imageKey,
          submittedAt: new Date(),
          taskStatus: 'entregue',
        });

        return { success: true };
      }),

    // Aluno visualiza comentários de uma sessão
    myTaskComments: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        if (!aluno) return [];
        // Verificar se a sessão pertence ao aluno
        const session = await db.getMentoringSessionById(input.sessionId);
        if (!session || session.alunoId !== aluno.id) return [];
        return await db.getCommentsBySessionId(input.sessionId);
      }),

    // Admin: visualizar reflexões dos alunos
    reflections: adminProcedure
      .input(z.object({ eventId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getWebinarReflections(input?.eventId);
      }),
  }),

  // ============ CONTRATOS DO ALUNO ============
  contratos: router({
    // Listar contratos de um aluno
    byAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContratosByAluno(input.alunoId);
      }),

    // Obter contrato por ID
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getContratoById(input.id);
      }),

    // Criar contrato (admin)
    create: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        programId: z.number(),
        turmaId: z.number().optional(),
        periodoInicio: z.string(),
        periodoTermino: z.string(),
        totalSessoesContratadas: z.number().min(1),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createContrato({
          ...input,
          periodoInicio: new Date(input.periodoInicio),
          periodoTermino: new Date(input.periodoTermino),
          criadoPor: ctx.user.id,
        } as any);
        return { id, success: true };
      }),

    // Atualizar contrato (admin)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        programId: z.number().optional(),
        turmaId: z.number().optional(),
        periodoInicio: z.string().optional(),
        periodoTermino: z.string().optional(),
        totalSessoesContratadas: z.number().min(1).optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.periodoInicio) updateData.periodoInicio = new Date(data.periodoInicio);
        if (data.periodoTermino) updateData.periodoTermino = new Date(data.periodoTermino);
        await db.updateContrato(id, updateData);
        return { success: true };
      }),

    // Excluir contrato (soft delete - admin)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContrato(input.id);
        return { success: true };
      }),

    // Saldo de sessões do aluno
    saldo: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSaldoSessoes(input.alunoId);
      }),
  }),

  // ============ JORNADA DO ALUNO ============
  jornada: router({
    // Jornada completa (Contrato + Macro Jornadas + Micro Jornadas)
    completa: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getJornadaCompleta(input.alunoId);
      }),

    // Jornada do aluno logado (para o Portal do Aluno)
    minha: protectedProcedure
      .query(async ({ ctx }) => {
        const aluno = await db.getAlunoByEmail(ctx.user.email || '');
        if (!aluno) return null;
        return await db.getJornadaCompleta(aluno.id);
      }),

    // Atualizar nível e metas de competência (mentora)
    updateNivel: protectedProcedure
      .input(z.object({
        assessmentCompetenciaId: z.number(),
        nivelAtual: z.number().min(0).max(100).optional(),
        metaCiclo1: z.number().min(0).max(100).optional(),
        metaCiclo2: z.number().min(0).max(100).optional(),
        metaFinal: z.number().min(0).max(100).optional(),
        justificativa: z.string().optional(),
        sessaoReferencia: z.number().optional(),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update all provided fields directly on assessment_competencias
        const updates: Record<string, any> = {};
        if (input.nivelAtual !== undefined) updates.nivelAtual = String(input.nivelAtual);
        if (input.metaCiclo1 !== undefined) updates.metaCiclo1 = String(input.metaCiclo1);
        if (input.metaCiclo2 !== undefined) updates.metaCiclo2 = String(input.metaCiclo2);
        if (input.metaFinal !== undefined) updates.metaFinal = String(input.metaFinal);
        if (input.justificativa !== undefined) updates.justificativa = input.justificativa;
        
        if (Object.keys(updates).length > 0) {
          await db.updateAssessmentCompetenciaFields(input.assessmentCompetenciaId, updates);
        }
        
        // Also log to history if nivelAtual changed
        if (input.nivelAtual !== undefined) {
          await db.updateNivelCompetencia(
            input.assessmentCompetenciaId,
            input.nivelAtual,
            ctx.user.id,
            input.sessaoReferencia,
            input.observacao
          );
        }
        return { success: true };
      }),

    // Definir meta final de competência (mentora - no assessment)
    setMeta: protectedProcedure
      .input(z.object({
        assessmentCompetenciaId: z.number(),
        metaFinal: z.number().min(0).max(100),
        justificativa: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.setMetaFinalCompetencia(
          input.assessmentCompetenciaId,
          input.metaFinal,
          input.justificativa
        );
        return { success: true };
      }),

    // Histórico de evolução de uma competência
    historico: protectedProcedure
      .input(z.object({ assessmentCompetenciaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getHistoricoNivel(input.assessmentCompetenciaId);
      }),

    // Verificar se precisa reavaliar (gatilho a cada 3 sessões)
    checkReavaliacao: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.checkReavaliacaoPendente(input.alunoId);
      }),

    // Jornadas agrupadas por turma (para Dashboard Gestor)
    porTurma: managerProcedure
      .input(z.object({ empresa: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getJornadasPorTurma(input.empresa);
      }),
  }),

  // Cases de Sucesso routes
  cases: router({
    // Listar cases de um aluno
    byAluno: adminProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCasesSucessoByAluno(input.alunoId);
      }),
    
    // Listar todos os cases (admin)
    list: adminProcedure.query(async () => {
      return await db.getAllCasesSucesso();
    }),
    
    // Criar case de sucesso
    create: adminProcedure
      .input(z.object({
        alunoId: z.number(),
        trilhaId: z.number().optional(),
        trilhaNome: z.string().optional(),
        entregue: z.number().min(0).max(1),
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCaseSucesso({
          alunoId: input.alunoId,
          trilhaId: input.trilhaId || null,
          trilhaNome: input.trilhaNome || null,
          entregue: input.entregue,
          titulo: input.titulo || null,
          descricao: input.descricao || null,
          observacao: input.observacao || null,
          dataEntrega: input.entregue === 1 ? new Date() : null,
        });
        return { id };
      }),
    
    // Atualizar case de sucesso
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        entregue: z.number().min(0).max(1).optional(),
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.entregue === 1) {
          updateData.dataEntrega = new Date();
        }
        await db.updateCaseSucesso(id, updateData);
        return { success: true };
      }),
    
    // Deletar case de sucesso
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCaseSucesso(input.id);
        return { success: true };
      }),

    // === PROCEDURES DO ALUNO (protectedProcedure, não admin) ===

    // Listar meus cases (aluno logado)
    meusCases: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      let aluno: Awaited<ReturnType<typeof db.getAlunoByEmail>> | undefined;
      if (ctx.user.alunoId) {
        const allAlunos = await db.getAlunos();
        aluno = allAlunos.find(a => a.id === ctx.user!.alunoId) || undefined;
      }
      if (!aluno && ctx.user.email) aluno = await db.getAlunoByEmail(ctx.user.email);
      if (!aluno) aluno = await db.getAlunoByExternalId(ctx.user.openId);
      if (!aluno) return [];
      return await db.getCasesSucessoByAluno(aluno.id);
    }),

    // Enviar case de sucesso (aluno logado)
    enviar: protectedProcedure
      .input(z.object({
        trilhaId: z.number(),
        trilhaNome: z.string(),
        titulo: z.string().min(1, 'Título é obrigatório'),
        descricao: z.string().optional(),
        fileBase64: z.string().min(1, 'Arquivo é obrigatório'),
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        let aluno: Awaited<ReturnType<typeof db.getAlunoByEmail>> | undefined;
        if (ctx.user.alunoId) {
          const allAlunos = await db.getAlunos();
          aluno = allAlunos.find(a => a.id === ctx.user!.alunoId) || undefined;
        }
        if (!aluno && ctx.user.email) aluno = await db.getAlunoByEmail(ctx.user.email);
        if (!aluno) aluno = await db.getAlunoByExternalId(ctx.user.openId);
        if (!aluno) throw new TRPCError({ code: 'NOT_FOUND', message: 'Perfil de aluno não encontrado' });

        // Upload do arquivo para S3
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const ext = input.fileName.split('.').pop() || 'pdf';
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const fileKey = `cases-sucesso/aluno-${aluno.id}/case-trilha-${input.trilhaId}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Verificar se já existe um case para esta trilha
        const casesExistentes = await db.getCasesSucessoByAluno(aluno.id);
        const caseExistente = casesExistentes.find(c => c.trilhaId === input.trilhaId);

        if (caseExistente) {
          // Atualizar o case existente
          await db.updateCaseSucesso(caseExistente.id, {
            titulo: input.titulo,
            descricao: input.descricao || null,
            fileUrl: url,
            fileKey: fileKey,
            fileName: input.fileName,
            entregue: 1,
            dataEntrega: new Date(),
          });
          return { id: caseExistente.id, url, updated: true };
        } else {
          // Criar novo case
          const id = await db.createCaseSucesso({
            alunoId: aluno.id,
            trilhaId: input.trilhaId,
            trilhaNome: input.trilhaNome,
            titulo: input.titulo,
            descricao: input.descricao || null,
            fileUrl: url,
            fileKey: fileKey,
            fileName: input.fileName,
            entregue: 1,
            dataEntrega: new Date(),
          });
          return { id, url, updated: false };
        }
      }),
  }),

  // ============ METAS DE DESENVOLVIMENTO ============
  metas: router({
    // Listar metas de um aluno (para mentora e gestor)
    listar: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        assessmentPdiId: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getMetasDetalhadas(input.alunoId);
      }),

    // Listar metas por competência específica
    porCompetencia: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        assessmentCompetenciaId: z.number()
      }))
      .query(async ({ input }) => {
        return await db.getMetasByCompetencia(input.alunoId, input.assessmentCompetenciaId);
      }),

    // Criar nova meta (mentora)
    criar: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        assessmentCompetenciaId: z.number(),
        competenciaId: z.number(),
        assessmentPdiId: z.number(),
        taskLibraryId: z.number().nullable().optional(),
        titulo: z.string().min(1),
        descricao: z.string().nullable().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        // Buscar consultor pelo openId do usuário logado ou pelo consultorId
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.loginId === ctx.user.openId || (ctx.user.consultorId && c.id === ctx.user.consultorId));
        return await db.createMeta({
          ...input,
          taskLibraryId: input.taskLibraryId ?? null,
          descricao: input.descricao ?? null,
          definidaPor: consultor?.id ?? null
        });
      }),

    // Atualizar meta existente
    atualizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().min(1).optional(),
        descricao: z.string().nullable().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateMeta(id, data);
      }),

    // Remover meta (soft delete)
    remover: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteMeta(input.id);
      }),

    // Registrar acompanhamento mensal
    registrarAcompanhamento: protectedProcedure
      .input(z.object({
        metaId: z.number(),
        alunoId: z.number(),
        mes: z.number().min(1).max(12),
        ano: z.number().min(2024).max(2030),
        status: z.enum(['cumprida', 'nao_cumprida', 'parcial']),
        observacao: z.string().nullable().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const consultors = await db.getConsultors();
        const consultor = consultors.find(c => c.loginId === ctx.user.openId || (ctx.user.consultorId && c.id === ctx.user.consultorId));
        return await db.upsertMetaAcompanhamento({
          ...input,
          observacao: input.observacao ?? null,
          registradoPor: consultor?.id ?? null
        });
      }),

    // Listar acompanhamentos de uma meta
    acompanhamentos: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        metaId: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getMetaAcompanhamentos(input.alunoId, input.metaId);
      }),

    // Resumo de metas de um aluno (para cards e dashboards)
    resumo: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMetasResumo(input.alunoId);
      }),

    // Resumo de metas de todos os alunos (para Dashboard Gestor)
    resumoTodos: protectedProcedure
      .query(async () => {
        return await db.getMetasResumoTodos();
      }),

    // Minhas metas (para o aluno logado ver no seu dashboard)
    minhas: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        // Encontrar alunoId do user logado
        let alunoId: number | null = ctx.user.alunoId || null;
        if (!alunoId && ctx.user.email) {
          const aluno = await db.getAlunoByEmail(ctx.user.email);
          if (aluno) alunoId = aluno.id;
        }
        if (!alunoId) {
          const aluno = await db.getAlunoByExternalId(ctx.user.openId);
          if (aluno) alunoId = aluno.id;
        }
        if (!alunoId) return { alunoId: null, metas: [], resumo: { total: 0, cumpridas: 0, percentual: 0, porCompetencia: [] } };
        const metasDetalhadas = await db.getMetasDetalhadas(alunoId);
        const resumo = await db.getMetasResumo(alunoId);
        return { alunoId, metas: metasDetalhadas, resumo };
      }),

    // Listar itens da biblioteca de ações (para seleção)
    biblioteca: protectedProcedure
      .input(z.object({
        competencia: z.string().optional()
      }).optional())
      .query(async ({ input }) => {
        const all = await db.getAllTaskLibrary();
        if (input?.competencia) {
          return all.filter(t => t.competencia.toLowerCase().includes(input.competencia!.toLowerCase()));
        }
        return all;
      }),

    // Sugerir meta/desafio com IA para uma competência
    sugerirComIA: protectedProcedure
      .input(z.object({
        competencia: z.string(),
        alunoNome: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em desenvolvimento de lideranças e coaching executivo. Sua tarefa é sugerir desafios práticos e concretos que ajudem uma pessoa a desenvolver uma competência específica no ambiente de trabalho.

Regras:
- Sugira UM desafio prático, concreto e realizável em até 30 dias
- O desafio deve ser uma ação que a pessoa possa exercitar no dia a dia do trabalho
- Seja específico: inclua números, prazos ou contextos quando possível
- O desafio deve ser desafiador mas alcançável
- Foque em ações que gerem aprendizado pela prática

Responda APENAS em JSON com o formato:
{"titulo": "Título curto do desafio (máx 80 caracteres)", "descricao": "Descrição detalhada do desafio, explicando o que fazer, como fazer e o que se espera como resultado (2-3 frases)"}`
            },
            {
              role: "user",
              content: `Sugira um desafio prático para desenvolver a competência: "${input.competencia}"${input.alunoNome ? ` para o(a) profissional ${input.alunoNome}` : ''}.`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sugestao_meta",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  titulo: { type: "string", description: "Título curto do desafio" },
                  descricao: { type: "string", description: "Descrição detalhada do desafio" }
                },
                required: ["titulo", "descricao"],
                additionalProperties: false
              }
            }
          }
        });
        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao gerar sugestão com IA" });
        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        try {
          return JSON.parse(contentStr) as { titulo: string; descricao: string };
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Resposta da IA em formato inválido" });
        }
      }),

    // Verificar se precisa atualizar metas (a cada 3 meses ou 3 sessões)
    alertaAtualizacao: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        const { alunoId } = input;
        return await db.getAlertaAtualizacaoMetas(alunoId);
      }),
  }),

  // ============ TESTE DISC + AUTOPERCEPÇÃO ============
  disc: router({
    // Buscar blocos do teste DISC (escolha forçada)
    perguntas: publicProcedure.query(() => {
      const { DISC_BLOCOS, DISC_PERFIS } = require('../shared/discData');
      return { blocos: DISC_BLOCOS, totalBlocos: DISC_BLOCOS.length };
    }),

    // Salvar respostas e calcular resultado DISC (escolha forçada)
    salvarRespostas: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        respostas: z.array(z.object({
          blocoIndex: z.number(),
          maisId: z.string(),
          menosId: z.string(),
          maisDimensao: z.enum(["D", "I", "S", "C"]),
          menosDimensao: z.enum(["D", "I", "S", "C"]),
        }))
      }))
      .mutation(async ({ input }) => {
        const { calcularDiscScores } = require('../shared/discData');
        
        // Determinar ciclo
        const existingResult = await db.getDiscResultado(input.alunoId);
        const ciclo = existingResult ? existingResult.ciclo + 1 : 1;
        
        // Salvar respostas no formato escolha forçada
        await db.saveDiscRespostas(input.alunoId, ciclo, input.respostas);

        // Calcular scores ipsativos
        const resultado = calcularDiscScores(input.respostas);

        // Salvar resultado com novos campos
        await db.saveDiscResultado({
          alunoId: input.alunoId,
          scoreD: String(resultado.scores.D),
          scoreI: String(resultado.scores.I),
          scoreS: String(resultado.scores.S),
          scoreC: String(resultado.scores.C),
          scoreBrutoD: resultado.scoresBrutos.D,
          scoreBrutoI: resultado.scoresBrutos.I,
          scoreBrutoS: resultado.scoresBrutos.S,
          scoreBrutoC: resultado.scoresBrutos.C,
          perfilPredominante: resultado.perfilPredominante,
          perfilSecundario: resultado.perfilSecundario,
          indiceConsistencia: resultado.indiceConsistencia,
          alertaBaixaDiferenciacao: resultado.alertaBaixaDiferenciacao,
          metodoCalculo: 'ipsativo',
        });

        return resultado;
      }),

    // Buscar resultado DISC de um aluno
    resultado: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDiscResultado(input.alunoId);
      }),

    // Buscar perfis DISC (descrições)
    perfis: publicProcedure.query(() => {
      const { DISC_PERFIS } = require('../shared/discData');
      return DISC_PERFIS;
    }),

    // Buscar histórico completo de resultados DISC de um aluno (todos os ciclos)
    historico: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllDiscResultadosByAluno(input.alunoId);
      }),

    // Comparativo de evolução entre ciclos DISC
    comparativo: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        const resultados = await db.getAllDiscResultadosByAluno(input.alunoId);
        if (resultados.length < 2) return null;

        const primeiro = resultados[0];
        const ultimo = resultados[resultados.length - 1];

        const evolucao = {
          D: Number(ultimo.scoreD) - Number(primeiro.scoreD),
          I: Number(ultimo.scoreI) - Number(primeiro.scoreI),
          S: Number(ultimo.scoreS) - Number(primeiro.scoreS),
          C: Number(ultimo.scoreC) - Number(primeiro.scoreC),
        };

        return {
          cicloInicial: {
            ciclo: primeiro.ciclo,
            data: primeiro.completedAt,
            scores: { D: Number(primeiro.scoreD), I: Number(primeiro.scoreI), S: Number(primeiro.scoreS), C: Number(primeiro.scoreC) },
            perfilPredominante: primeiro.perfilPredominante,
          },
          cicloAtual: {
            ciclo: ultimo.ciclo,
            data: ultimo.completedAt,
            scores: { D: Number(ultimo.scoreD), I: Number(ultimo.scoreI), S: Number(ultimo.scoreS), C: Number(ultimo.scoreC) },
            perfilPredominante: ultimo.perfilPredominante,
          },
          evolucao,
          totalCiclos: resultados.length,
          todosResultados: resultados.map(r => ({
            ciclo: r.ciclo,
            data: r.completedAt,
            scores: { D: Number(r.scoreD), I: Number(r.scoreI), S: Number(r.scoreS), C: Number(r.scoreC) },
            perfilPredominante: r.perfilPredominante,
          })),
        };
      }),

    // Admin: resetar teste DISC de um aluno (permite refazer)
    resetAluno: adminProcedure
      .input(z.object({ alunoId: z.number() }))
      .mutation(async ({ input }) => {
        // Verificar se o aluno existe
        const aluno = await db.getAlunoById(input.alunoId);
        if (!aluno) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Resetar respostas e resultados DISC
        const resultado = await db.resetDiscAluno(input.alunoId);
        
        return {
          success: true,
          alunoNome: aluno.name,
          respostasRemovidas: resultado.respostasRemovidas,
          resultadosRemovidos: resultado.resultadosRemovidos,
        };
      }),

    // Verificar se o aluno é elegível para reassessment (contrato vencido ou próximo do vencimento)
    verificarReassessment: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        // Buscar contrato do aluno
        const contratos = await db.getContratosByAluno(input.alunoId);
        if (!contratos || contratos.length === 0) {
          return { elegivel: false, motivo: 'Sem contrato ativo' };
        }

        const contratoAtivo = contratos.find((c: any) => c.status === 'ativo') || contratos[contratos.length - 1];
        const termino = contratoAtivo.periodoTermino ? new Date(contratoAtivo.periodoTermino) : null;
        const agora = new Date();

        if (!termino) {
          return { elegivel: false, motivo: 'Contrato sem data de término definida' };
        }

        // Elegível se o contrato já venceu ou está a menos de 30 dias do vencimento
        const diasParaVencimento = Math.ceil((termino.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
        const elegivel = diasParaVencimento <= 30;

        // Buscar resultado DISC mais recente
        const discAtual = await db.getDiscResultado(input.alunoId);

        return {
          elegivel,
          motivo: elegivel
            ? (diasParaVencimento <= 0 ? 'Contrato finalizado' : `Faltam ${diasParaVencimento} dias para o término`)
            : `Faltam ${diasParaVencimento} dias para o término (mínimo 30 dias)`,
          contratoTermino: termino.toISOString(),
          diasParaVencimento,
          cicloAtual: discAtual?.ciclo || 1,
        };
      }),
  }),

  // ============ AUTOPERCEPÇÃO DE COMPETÊNCIAS ============
  autopercepção: router({
    // Salvar autoavaliação de competências
    salvar: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        avaliacoes: z.array(z.object({
          competenciaId: z.number(),
          trilhaId: z.number(),
          nota: z.number().min(1).max(5),
        }))
      }))
      .mutation(async ({ input }) => {
        await db.saveAutopercepcoes(input.alunoId, input.avaliacoes.map(a => ({
          alunoId: input.alunoId,
          competenciaId: a.competenciaId,
          trilhaId: a.trilhaId,
          nota: a.nota,
        })));
        return { success: true };
      }),

    // Buscar autoavaliação de um aluno
    porAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAutopercepcoes(input.alunoId);
      }),
  }),

  // ============ CONTRIBUIÇÕES DA MENTORA ============
  contribuicoesMentora: router({
    // Adicionar contribuição
    adicionar: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        consultorId: z.number(),
        tipo: z.enum(["disc", "competencia", "geral"]),
        competenciaId: z.number().nullable().optional(),
        conteudo: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.saveContribuicaoMentora({
          alunoId: input.alunoId,
          consultorId: input.consultorId,
          tipo: input.tipo,
          competenciaId: input.competenciaId ?? null,
          conteudo: input.conteudo,
        });
        return { success: true };
      }),

    // Atualizar contribuição
    atualizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        conteudo: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.updateContribuicaoMentora(input.id, input.conteudo);
        return { success: true };
      }),

    // Remover contribuição
    remover: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContribuicaoMentora(input.id);
        return { success: true };
      }),

    // Listar contribuições de um aluno
    porAluno: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContribuicoesMentora(input.alunoId);
      }),
  }),

  // ============ PROGRESSO DO ONBOARDING ============
  onboarding: router({
    // Salvar dados do cadastro (etapa 1)
    salvarCadastro: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        nome: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        cargo: z.string().optional(),
        areaAtuacao: z.string().optional(),
        minicurriculo: z.string().optional(),
        quemEVoce: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { alunoId, nome, email, telefone, cargo, areaAtuacao, minicurriculo, quemEVoce } = input;
        const result = await db.updateAluno(alunoId, {
          name: nome,
          email,
          telefone: telefone || null,
          cargo: cargo || null,
          areaAtuacao: areaAtuacao || null,
          minicurriculo: minicurriculo || null,
          quemEVoce: quemEVoce || null,
        });
        return result;
      }),

    // Escolher mentora (etapa 3)
    escolherMentora: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        consultorId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { alunoId, consultorId } = input;
        const result = await db.updateAluno(alunoId, { consultorId });

        // Notificar a mentora por email
        try {
          const consultor = await db.getConsultorById(consultorId);
          const aluno = await db.getAlunoById(alunoId);
          if (consultor?.email && aluno) {
            const { sendEmail } = await import('./emailService');
            await sendEmail({
              to: consultor.email,
              subject: `Parabéns! Você foi escolhida como mentora por ${aluno.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #0A1E3E, #2D5A87); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0; font-size: 22px;">\uD83C\uDF89 Parabéns, ${consultor.name}!</h2>
                    <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Você foi escolhida como mentora!</p>
                  </div>
                  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 15px; line-height: 1.6;">O aluno <strong>${aluno.name}</strong> escolheu você como mentora durante o processo de onboarding do programa de mentoria. Isso é uma grande conquista e demonstra a confiança que ele deposita em você!</p>
                    
                    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                      <p style="margin: 0 0 8px; font-weight: bold; color: #166534; font-size: 14px;">\uD83D\uDCCB Dados do Aluno:</p>
                      <p style="margin: 4px 0; font-size: 14px;"><strong>Nome:</strong> ${aluno.name}</p>
                      ${aluno.email ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${aluno.email}</p>` : ''}
                    </div>

                    <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
                      <p style="margin: 0 0 8px; font-weight: bold; color: #92400e; font-size: 14px;">\u26A0\uFE0F Prepara\u00e7\u00e3o Importante:</p>
                      <p style="margin: 4px 0; font-size: 14px; color: #78350f; line-height: 1.5;">Antes da sess\u00e3o de assessment, pedimos que voc\u00ea acesse a plataforma e:</p>
                      <ul style="margin: 8px 0; padding-left: 20px; font-size: 14px; color: #78350f; line-height: 1.8;">
                        <li>Leia o <strong>curr\u00edculo e perfil</strong> do aluno</li>
                        <li>Estude os <strong>resultados do teste DISC</strong> e da <strong>autoavalia\u00e7\u00e3o de compet\u00eancias</strong></li>
                        <li>Prepare-se para conduzir uma sess\u00e3o de assessment personalizada</li>
                      </ul>
                    </div>

                    <div style="text-align: center; margin: 24px 0;">
                      <a href="https://ecolider.evoluirckm.com/" style="display: inline-block; background: #0A1E3E; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Acessar a Plataforma</a>
                    </div>

                    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">Em breve o aluno far\u00e1 o agendamento do primeiro encontro. Voc\u00ea receber\u00e1 uma notifica\u00e7\u00e3o com a data e hor\u00e1rio escolhidos.</p>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">Ecossistema do Bem - Programa de Mentoria</p>
                  </div>
                </div>
              `,
            });
          }
        } catch (emailErr) {
          console.warn('[Onboarding] Erro ao enviar notificação de novo aluno para mentora:', emailErr);
        }

        // Notificar o owner também
        try {
          const { notifyOwner } = await import('./_core/notification');
          const aluno = await db.getAlunoById(alunoId);
          const consultor = await db.getConsultorById(consultorId);
          await notifyOwner({
            title: 'Novo aluno escolheu mentora',
            content: `O aluno ${aluno?.name || 'N/A'} escolheu a mentora ${consultor?.name || 'N/A'} durante o onboarding.`,
          });
        } catch (notifErr) {
          console.warn('[Onboarding] Erro ao notificar owner:', notifErr);
        }

        return result;
      }),

    // Criar agendamento (etapa 4)
    criarAgendamento: protectedProcedure
      .input(z.object({
        alunoId: z.number(),
        consultorId: z.number(),
        scheduledDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        googleMeetLink: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { alunoId, consultorId, scheduledDate, startTime, endTime, googleMeetLink, notes } = input;
        // Criar o agendamento na tabela mentor_appointments
        const result = await db.createGroupAppointment({
          consultorId,
          title: 'Encontro Inicial - Onboarding',
          description: notes || 'Primeiro encontro de mentoria agendado pelo onboarding',
          scheduledDate,
          startTime,
          endTime,
          googleMeetLink: googleMeetLink || null,
          alunoIds: [alunoId],
          createdBy: ctx.user.id,
        });
        // Formatar data para exibição
        const dateFormatted = (() => {
          try {
            const [y, m, d] = scheduledDate.split('-');
            const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
            const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            return `${dias[dateObj.getDay()]}, ${d} de ${meses[dateObj.getMonth()]} de ${y}`;
          } catch { return scheduledDate; }
        })();

        // Buscar dados do aluno e mentora
        const consultor = await db.getConsultorById(consultorId);
        const aluno = await db.getAlunoById(alunoId);

        // 1) Email para a MENTORA - informando agendamento e pedindo que estude o currículo/testes
        try {
          if (consultor?.email && aluno) {
            const { sendEmail } = await import('./emailService');
            const adminEmail = process.env.SMTP_USER || '';
            await sendEmail({
              to: consultor.email,
              cc: adminEmail || undefined,
              subject: `Encontro Inicial agendado com ${aluno.name} - Prepare-se!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #0A1E3E, #2D5A87); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0; font-size: 20px;">Encontro Inicial Agendado!</h2>
                    <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Seu aluno ${aluno.name} agendou a sessão de assessment</p>
                  </div>
                  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 15px; line-height: 1.6;">Olá, <strong>${consultor.name}</strong>!</p>
                    <p style="font-size: 14px; line-height: 1.6;">O aluno <strong>${aluno.name}</strong> agendou o primeiro encontro de mentoria com você. Confira os detalhes abaixo:</p>
                    
                    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                      <p style="margin: 0 0 8px; font-weight: bold; color: #166534; font-size: 14px;">Detalhes do Encontro:</p>
                      <p style="margin: 4px 0; font-size: 14px;">Data: <strong>${dateFormatted}</strong></p>
                      <p style="margin: 4px 0; font-size: 14px;">Horário: <strong>${startTime} - ${endTime}</strong></p>
                      ${googleMeetLink ? `<p style="margin: 4px 0; font-size: 14px;">Link da Sala: <a href="${googleMeetLink}" style="color: #0A1E3E; font-weight: bold;">${googleMeetLink}</a></p>` : ''}
                    </div>

                    <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
                      <p style="margin: 0 0 8px; font-weight: bold; color: #92400e; font-size: 14px;">Preparação para a Sessão:</p>
                      <p style="margin: 4px 0; font-size: 14px; color: #78350f; line-height: 1.5;">Antes do encontro, pedimos que você acesse a plataforma e:</p>
                      <ul style="margin: 8px 0; padding-left: 20px; font-size: 14px; color: #78350f; line-height: 1.8;">
                        <li>Leia o <strong>currículo e perfil completo</strong> do aluno</li>
                        <li>Estude os <strong>resultados do teste DISC</strong></li>
                        <li>Analise a <strong>autoavaliação de competências</strong></li>
                        <li>Prepare-se para conduzir uma sessão de assessment personalizada</li>
                      </ul>
                    </div>

                    <div style="text-align: center; margin: 24px 0;">
                      <a href="https://ecolider.evoluirckm.com/" style="display: inline-block; background: #0A1E3E; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Acessar a Plataforma</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">Ecossistema do Bem - Programa de Mentoria</p>
                  </div>
                </div>
              `,
            });
          }
        } catch (emailErr) {
          console.warn('[Onboarding] Erro ao enviar notificação de agendamento para mentora:', emailErr);
        }

        // 2) Email para o ALUNO - confirmação do agendamento
        try {
          if (aluno?.email && consultor) {
            const { sendEmail } = await import('./emailService');
            await sendEmail({
              to: aluno.email,
              subject: `Agendamento confirmado - Encontro Inicial com ${consultor.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #0A1E3E, #2D5A87); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0; font-size: 20px;">Agendamento Confirmado!</h2>
                    <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Seu Encontro Inicial está marcado</p>
                  </div>
                  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 15px; line-height: 1.6;">Olá, <strong>${aluno.name}</strong>!</p>
                    <p style="font-size: 14px; line-height: 1.6;">Seu primeiro encontro de mentoria foi agendado com sucesso. Confira os detalhes:</p>
                    
                    <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                      <p style="margin: 0 0 8px; font-weight: bold; color: #166534; font-size: 14px;">Detalhes do Encontro:</p>
                      <p style="margin: 4px 0; font-size: 14px;">Mentora: <strong>${consultor.name}</strong></p>
                      <p style="margin: 4px 0; font-size: 14px;">Data: <strong>${dateFormatted}</strong></p>
                      <p style="margin: 4px 0; font-size: 14px;">Horário: <strong>${startTime} - ${endTime}</strong></p>
                      ${googleMeetLink ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #bbf7d0;">
                          <p style="margin: 0 0 4px; font-size: 13px; color: #166534; font-weight: bold;">Link da Sala de Entrevista:</p>
                          <a href="${googleMeetLink}" style="display: inline-block; background: #0A1E3E; color: white; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold;">${googleMeetLink}</a>
                        </div>
                      ` : ''}
                    </div>

                    <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">Guarde este email! No dia do encontro, acesse o link da sala no horário marcado. Esteja preparado(a) e pontual.</p>
                    </div>

                    <div style="text-align: center; margin: 24px 0;">
                      <a href="https://ecolider.evoluirckm.com/onboarding" style="display: inline-block; background: #0A1E3E; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Acessar a Plataforma</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px;">Ecossistema do Bem - Programa de Mentoria</p>
                  </div>
                </div>
              `,
            });
          }
        } catch (emailErr) {
          console.warn('[Onboarding] Erro ao enviar confirmação de agendamento para aluno:', emailErr);
        }

        return { success: result.success, appointmentId: result.id };
      }),

    // Marcar que o aluno assistiu o vídeo DISC
    markDiscVideoWatched: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.markDiscVideoWatched(input.alunoId);
      }),

    // Verificar se o aluno já assistiu o vídeo DISC
    hasWatchedDiscVideo: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        const watched = await db.hasWatchedDiscVideo(input.alunoId);
        return { watched };
      }),

    // Retorna o step atual do onboarding baseado nos dados do banco
    progresso: protectedProcedure
      .input(z.object({ alunoId: z.number() }))
      .query(async ({ input }) => {
        const { alunoId } = input;
        if (!alunoId || alunoId === 0) return { step: 1, discCompleto: false, mentoraEscolhida: false, agendamentoFeito: false };

        // Verificar se fez o teste DISC
        const discResult = await db.getDiscResultado(alunoId);
        const discCompleto = !!discResult;

        // Verificar se fez a autopercepção
        const autopercepcoes = await db.getAutopercepcoes(alunoId);
        const autopercepCompleta = autopercepcoes.length > 0;

        // Verificar se tem mentora vinculada
        const aluno = await db.getAlunoById(alunoId);
        const mentoraEscolhida = !!(aluno?.consultorId);

        // Verificar se tem agendamento
        let agendamentoFeito = false;
        let agendamentoData: string | null = null;
        let agendamentoHora: string | null = null;
        let agendamentoMeetLink: string | null = null;
        if (mentoraEscolhida) {
          const agendamentos = await db.getAlunoAppointments(alunoId);
          agendamentoFeito = agendamentos.length > 0;
          if (agendamentoFeito && agendamentos[0]) {
            agendamentoData = agendamentos[0].scheduledDate;
            agendamentoHora = agendamentos[0].startTime;
            agendamentoMeetLink = agendamentos[0].googleMeetLink || null;
          }
        }

        // Verificar se a mentora registrou presença (sessão de mentoria)
        const sessoes = await db.getMentoringSessionsByAluno(alunoId);
        const presencaRegistrada = sessoes.some(s => s.presence === 'presente');

        // Verificar se a mentora fez o assessment/PDI do aluno
        const assessments = await db.getAssessmentsByAluno(alunoId);
        const assessmentFeito = assessments.length > 0;

        // Verificar se a mentora fez o relatório (sessão com feedback preenchido)
        const relatorioFeito = sessoes.some(s => s.presence === 'presente' && (s.feedback || s.notaEvolucao));

        // O encontro só é considerado realizado quando a mentora:
        // 1. Registrou presença do aluno
        // 2. Fez o assessment/PDI
        const encontroRealizado = presencaRegistrada && assessmentFeito;

        // Verificar se o onboarding está completo (aluno já tem trilha/PDI definido)
        // Quando completo, o onboarding entra em modo somente leitura
        const onboardingCompleto = encontroRealizado;

        // Verificar contrato do aluno para reassessment
        const contratos = await db.getContratosByAluno(alunoId);
        const contratoAtivo = contratos.find((c: any) => c.isActive === 1);
        let reassessmentElegivel = false;
        let contratoTermino: string | null = null;
        if (contratoAtivo) {
          contratoTermino = contratoAtivo.periodoTermino ? String(contratoAtivo.periodoTermino) : null;
          // Elegível para reassessment se a data de término do contrato já passou
          const hoje = new Date();
          const termino = new Date(contratoAtivo.periodoTermino);
          reassessmentElegivel = hoje >= termino;
        }

        // Contar quantos ciclos de DISC o aluno já fez
        const todosDisc = await db.getAllDiscResultados(alunoId);
        const cicloAtual = todosDisc.length;

        // Verificar se o cadastro foi preenchido (tem pelo menos nome e email)
        const cadastroPreenchido = !!(aluno?.name && aluno?.email);

        // Determinar step atual
        let step = 1;
        if (cadastroPreenchido) step = 2; // Cadastro feito, vai para assessment
        if (cadastroPreenchido && discCompleto && autopercepCompleta) step = 3; // Pula para mentora
        if (cadastroPreenchido && discCompleto && autopercepCompleta && mentoraEscolhida) step = 4; // Pula para agendamento
        if (cadastroPreenchido && discCompleto && autopercepCompleta && mentoraEscolhida && agendamentoFeito) step = 5; // Pula para 1º encontro

        // Quando onboarding está completo, forçar step 5 para que todas as etapas
        // apareçam como concluídas e o aluno possa navegar livremente em modo visualização
        if (onboardingCompleto) step = 5;

        return {
          step,
          cadastroPreenchido,
          discCompleto,
          autopercepCompleta,
          mentoraEscolhida,
          mentoraId: aluno?.consultorId || null,
          agendamentoFeito,
          agendamentoData,
          agendamentoHora,
          agendamentoMeetLink,
          presencaRegistrada,
          assessmentFeito,
          relatorioFeito,
          encontroRealizado,
          onboardingCompleto,
          reassessmentElegivel,
          contratoTermino,
          cicloAtual,
        };
      }),
  }),

  // ============ IN-APP NOTIFICATIONS ============
  notifications: router({
    // Listar notificações do usuário logado
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getNotificationsByUser(ctx.user.id, input?.limit || 50);
      }),

    // Contar notificações não lidas
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),

    // Marcar uma notificação como lida
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationRead(input.notificationId, ctx.user.id);
        return { success: true };
      }),

    // Marcar todas como lidas
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),

    // Criar notificação (admin only - para testes e envio manual)
    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(["info", "warning", "success", "action"]).optional(),
        category: z.string().optional(),
        link: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNotification({
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type || "info",
          category: input.category || "sistema",
          link: input.link,
        });
        return { id, success: true };
      }),
  }),

  // ============ BIBLIOTECA DE TAREFAS ============
  taskLibrary: router({
    list: adminProcedure.query(async () => {
      return await db.getAllTaskLibraryIncludingInactive();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const item = await db.getTaskLibraryById(input.id);
        if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tarefa não encontrada' });
        return item;
      }),

    create: adminProcedure
      .input(z.object({
        competencia: z.string().min(1, 'Competência é obrigatória'),
        nome: z.string().min(1, 'Nome é obrigatório'),
        resumo: z.string().nullable().optional(),
        oQueFazer: z.string().nullable().optional(),
        oQueGanha: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTaskLibraryItem({
          competencia: input.competencia,
          nome: input.nome,
          resumo: input.resumo ?? null,
          oQueFazer: input.oQueFazer ?? null,
          oQueGanha: input.oQueGanha ?? null,
        });
        return { id, success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        competencia: z.string().min(1, 'Competência é obrigatória'),
        nome: z.string().min(1, 'Nome é obrigatório'),
        resumo: z.string().nullable().optional(),
        oQueFazer: z.string().nullable().optional(),
        oQueGanha: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTaskLibraryItem(id, {
          competencia: data.competencia,
          nome: data.nome,
          resumo: data.resumo ?? null,
          oQueFazer: data.oQueFazer ?? null,
          oQueGanha: data.oQueGanha ?? null,
        });
        return { success: true };
      }),

    toggleActive: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        await db.toggleTaskLibraryActive(input.id, input.isActive);
        return { success: true };
      }),

    generateWithAI: adminProcedure
      .input(z.object({
        competencia: z.string().min(1, 'Competência é obrigatória'),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em desenvolvimento de lideranças, coaching executivo e programas de mentoria corporativa. Sua tarefa é criar uma tarefa prática para a biblioteca de tarefas de um programa de desenvolvimento de líderes.

A tarefa deve ajudar o participante a desenvolver a competência informada através de uma ação prática no ambiente de trabalho.

Regras:
- O nome deve ser curto e descritivo (máx 80 caracteres)
- O resumo deve explicar brevemente o objetivo da tarefa (1-2 frases)
- O "oQueFazer" deve detalhar passo a passo o que o participante deve fazer (3-5 passos concretos)
- O "oQueGanha" deve explicar os benefícios e aprendizados que o participante terá ao realizar a tarefa (2-3 frases)
- Seja específico, prático e orientado à ação
- A tarefa deve ser realizável em até 30 dias
- Foque em ações que gerem aprendizado pela prática no ambiente corporativo

Responda APENAS em JSON com o formato especificado.`
            },
            {
              role: "user",
              content: `Crie uma tarefa prática completa para desenvolver a competência: "${input.competencia}".`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tarefa_biblioteca",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Nome curto e descritivo da tarefa" },
                  resumo: { type: "string", description: "Resumo breve do objetivo da tarefa" },
                  oQueFazer: { type: "string", description: "Descrição detalhada passo a passo do que fazer" },
                  oQueGanha: { type: "string", description: "Benefícios e aprendizados ao realizar a tarefa" }
                },
                required: ["nome", "resumo", "oQueFazer", "oQueGanha"],
                additionalProperties: false
              }
            }
          }
        });
        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao gerar tarefa com IA" });
        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        try {
          return JSON.parse(contentStr) as { nome: string; resumo: string; oQueFazer: string; oQueGanha: string };
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Resposta da IA em formato inválido" });
        }
      }),
  }),

  // ============ CURSOS DISPONÍVEIS ============
  courses: router({
    // Lista todos os cursos (admin)
    list: adminProcedure.query(async () => {
      return await db.getAllCourses();
    }),

    // Lista cursos ativos (para alunos)
    listActive: protectedProcedure.query(async () => {
      return await db.getActiveCourses();
    }),

    // Buscar curso por ID
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const course = await db.getCourseById(input.id);
        if (!course) throw new TRPCError({ code: 'NOT_FOUND', message: 'Curso não encontrado' });
        return course;
      }),

    // Criar curso
    create: adminProcedure
      .input(z.object({
        titulo: z.string().min(1, 'Título é obrigatório'),
        descricao: z.string().nullable().optional(),
        categoria: z.string().nullable().optional(),
        competenciaRelacionada: z.string().nullable().optional(),
        tipo: z.enum(['gratuito', 'online_pago', 'presencial']).default('gratuito'),
        youtubeUrl: z.string().nullable().optional(),
        thumbnailUrl: z.string().nullable().optional(),
        duracao: z.string().nullable().optional(),
        instrutor: z.string().nullable().optional(),
        nivel: z.enum(['iniciante', 'intermediario', 'avancado']).default('iniciante'),
        programId: z.number().nullable().optional(),
        ordem: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCourse({
          titulo: input.titulo,
          descricao: input.descricao ?? null,
          categoria: input.categoria ?? null,
          competenciaRelacionada: input.competenciaRelacionada ?? null,
          tipo: input.tipo,
          youtubeUrl: input.youtubeUrl ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          duracao: input.duracao ?? null,
          instrutor: input.instrutor ?? null,
          nivel: input.nivel,
          programId: input.programId ?? null,
          ordem: input.ordem,
          createdBy: ctx.user.id,
        });
        return { id, success: true };
      }),

    // Atualizar curso
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().min(1, 'Título é obrigatório'),
        descricao: z.string().nullable().optional(),
        categoria: z.string().nullable().optional(),
        competenciaRelacionada: z.string().nullable().optional(),
        tipo: z.enum(['gratuito', 'online_pago', 'presencial']).default('gratuito'),
        youtubeUrl: z.string().nullable().optional(),
        thumbnailUrl: z.string().nullable().optional(),
        duracao: z.string().nullable().optional(),
        instrutor: z.string().nullable().optional(),
        nivel: z.enum(['iniciante', 'intermediario', 'avancado']).default('iniciante'),
        programId: z.number().nullable().optional(),
        ordem: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCourse(id, {
          titulo: data.titulo,
          descricao: data.descricao ?? null,
          categoria: data.categoria ?? null,
          competenciaRelacionada: data.competenciaRelacionada ?? null,
          tipo: data.tipo,
          youtubeUrl: data.youtubeUrl ?? null,
          thumbnailUrl: data.thumbnailUrl ?? null,
          duracao: data.duracao ?? null,
          instrutor: data.instrutor ?? null,
          nivel: data.nivel,
          programId: data.programId ?? null,
          ordem: data.ordem,
        });
        return { success: true };
      }),

    // Ativar/desativar curso
    toggleActive: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        await db.toggleCourseActive(input.id, input.isActive);
        return { success: true };
      }),

    // Deletar curso
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCourse(input.id);
        return { success: true };
      }),
  }),

  // ============================================================
  // Activities (Atividades Extras) router
  // ============================================================
  activities: router({
    // Listar atividades (admin vê todas, aluno vê só ativas)
    list: protectedProcedure.query(async ({ ctx }) => {
      const all = await db.listActivities();
      if (ctx.user.role === 'admin') return all;
      return all.filter(a => a.isActive === 1);
    }),

    // Obter atividade por ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getActivityById(input.id);
      }),

    // Criar atividade (admin)
    create: adminProcedure
      .input(z.object({
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        tipo: z.enum(["workshop", "treinamento", "palestra", "evento", "outro"]),
        modalidade: z.enum(["presencial", "online", "hibrido"]),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        local: z.string().optional(),
        vagas: z.number().optional(),
        instrutor: z.string().optional(),
        imagemUrl: z.string().optional(),
        competenciaRelacionada: z.string().optional(),
        programId: z.number().optional(),
        turmaIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { turmaIds, ...rest } = input;
        const id = await db.createActivity({
          ...rest,
          dataInicio: rest.dataInicio ? new Date(rest.dataInicio) : null,
          dataFim: rest.dataFim ? new Date(rest.dataFim) : null,
          vagas: rest.vagas ?? null,
          programId: rest.programId ?? null,
          createdBy: ctx.user.id,
        });
        // Vincular turmas se informadas
        if (turmaIds && turmaIds.length > 0) {
          await db.setActivityTurmas(id, turmaIds);
        }
        return { id };
      }),

    // Atualizar atividade (admin)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().min(1).optional(),
        descricao: z.string().optional(),
        tipo: z.enum(["workshop", "treinamento", "palestra", "evento", "outro"]).optional(),
        modalidade: z.enum(["presencial", "online", "hibrido"]).optional(),
        dataInicio: z.string().optional().nullable(),
        dataFim: z.string().optional().nullable(),
        local: z.string().optional(),
        vagas: z.number().optional().nullable(),
        instrutor: z.string().optional(),
        imagemUrl: z.string().optional(),
        competenciaRelacionada: z.string().optional(),
        programId: z.number().optional().nullable(),
        turmaIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, dataInicio, dataFim, turmaIds, ...rest } = input;
        const updateData: any = { ...rest };
        if (dataInicio !== undefined) updateData.dataInicio = dataInicio ? new Date(dataInicio) : null;
        if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
        // Só chama updateActivity se houver campos para atualizar
        if (Object.keys(updateData).length > 0) {
          await db.updateActivity(id, updateData);
        }
        // Atualizar turmas vinculadas se informadas
        if (turmaIds !== undefined) {
          await db.setActivityTurmas(id, turmaIds);
        }
        return { success: true };
      }),

    // Toggle ativo/inativo (admin)
    toggleActive: adminProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        await db.toggleActivityActive(input.id, input.isActive);
        return { success: true };
      }),

    // Deletar atividade (admin) - também remove vinculações de turmas
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.setActivityTurmas(input.id, []); // Limpar vinculações
        await db.deleteActivity(input.id);
        return { success: true };
      }),

    // Obter turmas vinculadas a uma atividade
    getTurmas: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .query(async ({ input }) => {
        return db.getActivityTurmas(input.activityId);
      }),

    // Obter mapa de todas as vinculações atividade-turma (admin)
    getAllTurmasMap: adminProcedure.query(async () => {
      const map = await db.getAllActivityTurmasMap();
      // Converter Map para objeto serializável
      const obj: Record<number, number[]> = {};
      map.forEach((v, k) => { obj[k] = v; });
      return obj;
    }),

    // Listar atividades filtradas por turma do aluno
    listForStudent: protectedProcedure.query(async ({ ctx }) => {
      // Buscar o aluno vinculado ao usuário
      const aluno = await db.getAlunoByUserId(ctx.user.id);
      if (aluno && aluno.turmaId) {
        return db.getActivitiesForTurma(aluno.turmaId);
      }
      // Se não tem turma, retorna todas as ativas
      const all = await db.listActivities();
      return all.filter(a => a.isActive === 1);
    }),

    // Contar inscrições de uma atividade
    countRegistrations: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .query(async ({ input }) => {
        return db.countRegistrations(input.activityId);
      }),

    // Listar inscrições de uma atividade (admin)
    listRegistrations: adminProcedure
      .input(z.object({ activityId: z.number() }))
      .query(async ({ input }) => {
        return db.listActivityRegistrations(input.activityId);
      }),

    // Verificar se o usuário está inscrito
    myRegistration: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getRegistrationByUserAndActivity(ctx.user.id, input.activityId);
      }),

    // Inscrever-se em uma atividade
    register: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se já está inscrito
        const existing = await db.getRegistrationByUserAndActivity(ctx.user.id, input.activityId);
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Você já está inscrito nesta atividade' });
        // Verificar vagas
        const activity = await db.getActivityById(input.activityId);
        if (!activity) throw new TRPCError({ code: 'NOT_FOUND', message: 'Atividade não encontrada' });
        if (activity.vagas) {
          const count = await db.countRegistrations(input.activityId);
          if (count >= activity.vagas) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Vagas esgotadas' });
        }
        const id = await db.registerForActivity({
          activityId: input.activityId,
          userId: ctx.user.id,
          status: 'inscrito',
        });
        return { id };
      }),

    // Cancelar inscrição
    unregister: protectedProcedure
      .input(z.object({ activityId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.cancelRegistration(ctx.user.id, input.activityId);
        return { success: true };
      }),

    // Atualizar status de inscrição (admin)
    updateRegistrationStatus: adminProcedure
      .input(z.object({
        registrationId: z.number(),
        status: z.enum(["inscrito", "confirmado", "cancelado", "presente", "ausente"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateRegistrationStatus(input.registrationId, input.status);
        return { success: true };
      }),
  }),

  // ============ ALERTAS DE MENTORIA (EMAIL) ============
  alertasMentoria: router({
    // Verificar alunos sem mentoria há 30+ dias e enviar e-mails
    enviarAlertas: adminProcedure
      .input(z.object({
        diasMinimo: z.number().min(1).default(30),
        dryRun: z.boolean().default(false), // Se true, apenas lista sem enviar
      }).optional())
      .mutation(async ({ input }) => {
        const diasMinimo = input?.diasMinimo || 30;
        const dryRun = input?.dryRun || false;
        
        const { sendEmail, buildMentoringAlertEmail } = await import('./emailService');
        const { ENV } = await import('./_core/env');
        
        // Get all active alunos (excluding those from inactive programs)
        const allAlunosRaw = await db.getAlunos();
        const allConsultores = await db.getConsultors();
        const consultorMap = new Map(allConsultores.map(c => [c.id, c]));
        
        // Filter out alunos from inactive programs
        const activePrograms = await db.getPrograms();
        const activeProgramIds = new Set(activePrograms.map(p => p.id));
        const allAlunos = allAlunosRaw.filter(a => !a.programId || activeProgramIds.has(a.programId));
        
        // Get all mentoring sessions
        const dbInstance = await (await import('./db')).getDb();
        if (!dbInstance) return { success: false, error: 'Database not available', alertas: [] };
        
        const { mentoringSessions: msTable } = await import('../drizzle/schema');
        const allSessions = await dbInstance.select().from(msTable);
        
        // Calculate last session per aluno (with any mentor)
        const lastSessionByAluno = new Map<number, { date: Date; consultorId: number }>();
        for (const session of allSessions) {
          if (!session.sessionDate) continue;
          const sessionDate = new Date(session.sessionDate);
          const current = lastSessionByAluno.get(session.alunoId);
          if (!current || sessionDate > current.date) {
            lastSessionByAluno.set(session.alunoId, { date: sessionDate, consultorId: session.consultorId });
          }
        }
        
        // Get session progress to check cicloCompleto (skip alunos who completed all sessions)
        const allProgress = await db.getAllStudentsSessionProgress();
        const cicloCompletoAlunoIds = new Set(
          allProgress.filter(p => p.cicloCompleto).map(p => p.alunoId)
        );
        
        // Find alunos sem mentoria há 30+ dias
        const now = Date.now();
        const alertas: Array<{
          alunoId: number;
          alunoName: string;
          alunoEmail: string;
          mentorName: string;
          mentorEmail: string;
          diasSemSessao: number;
          ultimaSessao: string | null;
          emailEnviado: boolean;
          erro?: string;
        }> = [];
        
        for (const aluno of allAlunos) {
          if (!aluno.email) continue;
          
          // Skip alunos who completed all their sessions (ciclo completo)
          if (cicloCompletoAlunoIds.has(aluno.id)) continue;
          
          // Get current mentor
          const mentor = aluno.consultorId ? consultorMap.get(aluno.consultorId) : null;
          if (!mentor) continue; // Skip alunos without mentor
          
          const lastSession = lastSessionByAluno.get(aluno.id);
          let diasSemSessao: number;
          let ultimaSessaoDate: string | null = null;
          
          if (lastSession) {
            diasSemSessao = Math.floor((now - lastSession.date.getTime()) / (1000 * 60 * 60 * 24));
            ultimaSessaoDate = lastSession.date.toISOString();
          } else {
            // Never had a session
            diasSemSessao = 999;
          }
          
          if (diasSemSessao >= diasMinimo) {
            const alertaItem: typeof alertas[0] = {
              alunoId: aluno.id,
              alunoName: aluno.name,
              alunoEmail: aluno.email,
              mentorName: mentor.name,
              mentorEmail: mentor.email || '',
              diasSemSessao,
              ultimaSessao: ultimaSessaoDate,
              emailEnviado: false,
            };
            
            if (!dryRun && aluno.email) {
              try {
                const loginUrl = process.env.VITE_OAUTH_PORTAL_URL || 'https://ecolider.evoluirckm.com';
                const emailData = buildMentoringAlertEmail({
                  alunoName: aluno.name,
                  mentorName: mentor.name,
                  diasSemSessao,
                  ultimaSessaoDate,
                  loginUrl,
                });
                
                // Build CC list: mentor + admin
                const ccList = [mentor.email, ENV.smtpUser].filter(Boolean).join(', ');
                
                const result = await sendEmail({
                  to: aluno.email,
                  cc: ccList,
                  subject: emailData.subject,
                  html: emailData.html,
                  text: emailData.text,
                });
                
                alertaItem.emailEnviado = result.success;
                if (!result.success) alertaItem.erro = result.error;
              } catch (err: any) {
                alertaItem.erro = err.message;
              }
            }
            
            alertas.push(alertaItem);
          }
        }
        
        // Sort by dias sem sessao (most urgent first)
        alertas.sort((a, b) => b.diasSemSessao - a.diasSemSessao);
        
        return {
          success: true,
          dryRun,
          diasMinimo,
          totalAlunos: allAlunos.length,
          totalAlertas: alertas.length,
          emailsEnviados: alertas.filter(a => a.emailEnviado).length,
          alertas,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ============ CSV HELPER FUNCTIONS ============

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Get value from parsed CSV row by column name
 */
function getVal(values: string[], colMap: Record<string, number>, colName: string): string | undefined {
  const idx = colMap[colName];
  if (idx === undefined || idx >= values.length) return undefined;
  const val = values[idx]?.trim();
  if (!val || val === '-') return undefined;
  return val;
}
