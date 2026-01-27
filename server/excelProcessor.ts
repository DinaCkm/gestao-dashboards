import * as XLSX from 'xlsx';
import { storagePut, storageGet } from './storage';
import { nanoid } from 'nanoid';

export interface ProcessedSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
}

export interface ExcelProcessingResult {
  success: boolean;
  sheets: ProcessedSheet[];
  error?: string;
  totalRows: number;
  totalColumns: number;
}

/**
 * Process Excel file from buffer
 */
export function processExcelBuffer(buffer: Buffer): ExcelProcessingResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets: ProcessedSheet[] = [];
    let totalRows = 0;
    let totalColumns = 0;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
      
      if (jsonData.length === 0) continue;

      const headerRow = jsonData[0] as unknown[];
      const headers = headerRow.map((h, i) => 
        h ? String(h) : `Column_${i + 1}`
      );
      
      const rows: Record<string, unknown>[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) continue;
        
        const rowObj: Record<string, unknown> = {};
        headers.forEach((header, idx) => {
          rowObj[header] = row[idx] ?? null;
        });
        rows.push(rowObj);
      }

      sheets.push({
        sheetName,
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length
      });

      totalRows += rows.length;
      totalColumns = Math.max(totalColumns, headers.length);
    }

    return {
      success: true,
      sheets,
      totalRows,
      totalColumns
    };
  } catch (error) {
    return {
      success: false,
      sheets: [],
      error: error instanceof Error ? error.message : 'Unknown error processing Excel file',
      totalRows: 0,
      totalColumns: 0
    };
  }
}

/**
 * Upload Excel file to S3 and return the key and URL
 */
export async function uploadExcelToStorage(
  buffer: Buffer,
  fileName: string,
  userId: number
): Promise<{ fileKey: string; fileUrl: string }> {
  const ext = fileName.split('.').pop() || 'xlsx';
  const fileKey = `uploads/${userId}/${Date.now()}-${nanoid(8)}.${ext}`;
  
  const contentType = ext === 'xls' 
    ? 'application/vnd.ms-excel'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  
  const result = await storagePut(fileKey, buffer, contentType);
  
  return {
    fileKey: result.key,
    fileUrl: result.url
  };
}

/**
 * Extract metrics from processed sheets
 */
export function extractMetrics(
  sheets: ProcessedSheet[],
  metricColumns: string[] = []
): { metricName: string; values: number[]; average: number; sum: number; min: number; max: number }[] {
  const metrics: { metricName: string; values: number[]; average: number; sum: number; min: number; max: number }[] = [];

  for (const sheet of sheets) {
    const columnsToProcess = metricColumns.length > 0 
      ? metricColumns.filter(col => sheet.headers.includes(col))
      : sheet.headers.filter(header => {
          // Auto-detect numeric columns
          const firstValue = sheet.rows[0]?.[header];
          return typeof firstValue === 'number' || !isNaN(Number(firstValue));
        });

    for (const column of columnsToProcess) {
      const values: number[] = [];
      
      for (const row of sheet.rows) {
        const value = row[column];
        if (value !== null && value !== undefined && value !== '') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            values.push(numValue);
          }
        }
      }

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        metrics.push({
          metricName: `${sheet.sheetName}_${column}`,
          values,
          average,
          sum,
          min,
          max
        });
      }
    }
  }

  return metrics;
}

/**
 * Generate summary statistics for dashboard
 */
export function generateDashboardData(
  sheets: ProcessedSheet[],
  previousData?: ProcessedSheet[]
): {
  totalRecords: number;
  metrics: { name: string; current: number; previous?: number; change?: number; trend: 'up' | 'down' | 'stable' }[];
  chartData: { name: string; data: { label: string; value: number }[] }[];
} {
  const currentMetrics = extractMetrics(sheets);
  const previousMetrics = previousData ? extractMetrics(previousData) : [];

  const metrics = currentMetrics.map(metric => {
    const prev = previousMetrics.find(p => p.metricName === metric.metricName);
    const change = prev ? ((metric.average - prev.average) / prev.average) * 100 : undefined;
    
    return {
      name: metric.metricName,
      current: metric.average,
      previous: prev?.average,
      change,
      trend: change === undefined ? 'stable' as const : 
             change > 1 ? 'up' as const : 
             change < -1 ? 'down' as const : 'stable' as const
    };
  });

  const chartData = currentMetrics.slice(0, 5).map(metric => ({
    name: metric.metricName,
    data: metric.values.slice(0, 10).map((value, idx) => ({
      label: `Item ${idx + 1}`,
      value
    }))
  }));

  return {
    totalRecords: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
    metrics,
    chartData
  };
}

/**
 * Validate Excel file structure
 */
export function validateExcelStructure(
  sheets: ProcessedSheet[],
  requiredColumns?: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (sheets.length === 0) {
    errors.push('O arquivo não contém planilhas válidas');
    return { valid: false, errors };
  }

  for (const sheet of sheets) {
    if (sheet.rowCount === 0) {
      errors.push(`A planilha "${sheet.sheetName}" está vazia`);
    }

    if (requiredColumns) {
      const missingColumns = requiredColumns.filter(col => !sheet.headers.includes(col));
      if (missingColumns.length > 0) {
        errors.push(`A planilha "${sheet.sheetName}" não possui as colunas obrigatórias: ${missingColumns.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create Excel file from data
 */
export function createExcelFromData(
  data: Record<string, unknown>[],
  sheetName: string = 'Relatório'
): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}


// ============================================
// NOVOS PROCESSADORES ESPECÍFICOS PARA B.E.M.
// ============================================

/**
 * Tipos de arquivos suportados pelo sistema ECOSSISTEMA DO BEM
 */
export type BemFileType = 
  | 'sebraeacre_mentorias'
  | 'sebraeacre_eventos'
  | 'sebraeto_mentorias'
  | 'sebraeto_eventos'
  | 'embrapii_mentorias'
  | 'embrapii_eventos'
  | 'performance';

/**
 * Mapeamento de nome de arquivo para tipo
 */
export function detectBemFileType(fileName: string): BemFileType | null {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('sebraeacre') && lowerName.includes('mentoria')) {
    return 'sebraeacre_mentorias';
  }
  if (lowerName.includes('sebraeacre') && lowerName.includes('evento')) {
    return 'sebraeacre_eventos';
  }
  if ((lowerName.includes('sebraeto') || lowerName.includes('bs2sebraeto')) && 
      (lowerName.includes('mentoria') || lowerName.includes('tutoria'))) {
    return 'sebraeto_mentorias';
  }
  if ((lowerName.includes('sebraeto') || lowerName.includes('bs2sebraeto')) && lowerName.includes('evento')) {
    return 'sebraeto_eventos';
  }
  if (lowerName.includes('embrapii') && lowerName.includes('mentoria')) {
    return 'embrapii_mentorias';
  }
  if (lowerName.includes('embrapii') && lowerName.includes('evento')) {
    return 'embrapii_eventos';
  }
  if (lowerName.includes('performance') || lowerName.includes('relatorio-de-performance')) {
    return 'performance';
  }
  
  return null;
}

/**
 * Estrutura de dados para sessão de mentoria
 */
export interface MentoringRecord {
  idUsuario: string;
  nomeAluno: string;
  emailAluno?: string;
  turma?: string;
  trilha?: string;
  consultor?: string;
  ciclo?: string;
  sessao?: number;
  dataSessao?: Date;
  presenca: 'presente' | 'ausente';
  atividadeEntregue: 'entregue' | 'nao_entregue' | 'sem_tarefa';
  engajamento?: number; // 1-5
  feedback?: string;
  empresa: string;
}

/**
 * Estrutura de dados para participação em eventos
 */
export interface EventRecord {
  idUsuario: string;
  nomeAluno: string;
  emailAluno?: string;
  turma?: string;
  trilha?: string;
  tituloEvento: string;
  tipoEvento?: string;
  dataEvento?: Date;
  presenca: 'presente' | 'ausente';
  empresa: string;
}

/**
 * Estrutura de dados para performance de competências
 */
export interface PerformanceRecord {
  idUsuario: string;
  idTurma?: string;
  idCompetencia?: string;
  nomeCompetencia?: string;
  progressoAulas?: number; // percentual
  notaAvaliacao?: number;
  aprovado?: boolean;
  dataConclusao?: Date;
}

/**
 * Resultado do processamento de uma planilha B.E.M.
 */
export interface BemProcessingResult {
  success: boolean;
  fileType: BemFileType;
  empresa?: string;
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  mentoringRecords?: MentoringRecord[];
  eventRecords?: EventRecord[];
  performanceRecords?: PerformanceRecord[];
}

/**
 * Normaliza valor de presença
 */
function normalizePresence(value: unknown): 'presente' | 'ausente' {
  if (!value) return 'ausente';
  const str = String(value).toLowerCase().trim();
  if (str.includes('presente') || str === 'sim' || str === 'yes' || str === '1') {
    return 'presente';
  }
  return 'ausente';
}

/**
 * Normaliza valor de entrega de atividade
 */
function normalizeTaskStatus(value: unknown): 'entregue' | 'nao_entregue' | 'sem_tarefa' {
  if (!value) return 'sem_tarefa';
  const str = String(value).toLowerCase().trim();
  if (str.includes('entregue') || str === 'sim' || str === 'yes' || str === '1') {
    return 'entregue';
  }
  if (str.includes('não') || str.includes('nao') || str === 'não entregue' || str === 'nao entregue') {
    return 'nao_entregue';
  }
  return 'sem_tarefa';
}

/**
 * Normaliza nota de engajamento (1-5)
 */
function normalizeEngagement(value: unknown): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  if (isNaN(num)) return undefined;
  // Garantir que está entre 1 e 5
  return Math.max(1, Math.min(5, Math.round(num)));
}

/**
 * Converte data do Excel para Date
 */
function parseExcelDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  
  // Se for número (serial date do Excel)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d);
    }
  }
  
  // Se for string
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Se já for Date
  if (value instanceof Date) {
    return value;
  }
  
  return undefined;
}

/**
 * Encontra o índice da coluna pelo nome (case insensitive, parcial)
 */
function findColumnIndex(headers: string[], ...possibleNames: string[]): number {
  for (const name of possibleNames) {
    const lowerName = name.toLowerCase();
    const index = headers.findIndex(h => 
      h && h.toLowerCase().includes(lowerName)
    );
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Processa planilha de mentorias (SEBRAE ACRE, SEBRAE TO, EMBRAPII)
 */
export function processMentoringSheet(
  buffer: Buffer, 
  empresa: string
): BemProcessingResult {
  const result: BemProcessingResult = {
    success: false,
    fileType: empresa === 'SEBRAE ACRE' ? 'sebraeacre_mentorias' : 
              empresa === 'SEBRAE TO' ? 'sebraeto_mentorias' : 'embrapii_mentorias',
    empresa,
    totalRecords: 0,
    processedRecords: 0,
    errors: [],
    mentoringRecords: []
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Converter para array de arrays
    const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length < 2) {
      result.errors.push('Planilha vazia ou sem dados');
      return result;
    }

    // Primeira linha são os headers
    const headers = (data[0] as unknown[]).map((h: unknown) => String(h || '').trim());
    
    // Encontrar índices das colunas
    const colIdUsuario = findColumnIndex(headers, 'id usuário', 'id usuario', 'idusuario', 'id_usuario');
    const colNome = findColumnIndex(headers, 'nome', 'aluno', 'tutorado', 'nome do aluno');
    const colEmail = findColumnIndex(headers, 'email', 'e-mail');
    const colTurma = findColumnIndex(headers, 'turma', 'id turma');
    const colTrilha = findColumnIndex(headers, 'trilha');
    const colConsultor = findColumnIndex(headers, 'consultor', 'mentor', 'tutor');
    const colCiclo = findColumnIndex(headers, 'ciclo');
    const colSessao = findColumnIndex(headers, 'sessão', 'sessao', 'número da sessão');
    const colData = findColumnIndex(headers, 'data', 'data da sessão', 'data sessão');
    const colPresenca = findColumnIndex(headers, 'mentoria', 'presença', 'presenca', 'presente');
    const colAtividade = findColumnIndex(headers, 'atividade proposta', 'atividade', 'tarefa');
    const colEngajamento = findColumnIndex(headers, 'evolução/engajamento', 'engajamento', 'evolução', 'evolucao');
    const colFeedback = findColumnIndex(headers, 'feedback', 'observação', 'observacao');

    result.totalRecords = data.length - 1;

    // Processar cada linha (pular header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[];
      if (!row || row.length === 0) continue;

      try {
        const idUsuario = colIdUsuario >= 0 ? String(row[colIdUsuario] || '').trim() : '';
        const nomeAluno = colNome >= 0 ? String(row[colNome] || '').trim() : '';

        // Pular linhas sem ID ou nome
        if (!idUsuario && !nomeAluno) continue;

        const record: MentoringRecord = {
          idUsuario: idUsuario || `temp_${i}`,
          nomeAluno: nomeAluno || 'Desconhecido',
          emailAluno: colEmail >= 0 ? String(row[colEmail] || '').trim() : undefined,
          turma: colTurma >= 0 ? String(row[colTurma] || '').trim() : undefined,
          trilha: colTrilha >= 0 ? String(row[colTrilha] || '').trim() : undefined,
          consultor: colConsultor >= 0 ? String(row[colConsultor] || '').trim() : undefined,
          ciclo: colCiclo >= 0 ? String(row[colCiclo] || '').trim() : undefined,
          sessao: colSessao >= 0 ? Number(row[colSessao]) || undefined : undefined,
          dataSessao: colData >= 0 ? parseExcelDate(row[colData]) : undefined,
          presenca: colPresenca >= 0 ? normalizePresence(row[colPresenca]) : 'ausente',
          atividadeEntregue: colAtividade >= 0 ? normalizeTaskStatus(row[colAtividade]) : 'sem_tarefa',
          engajamento: colEngajamento >= 0 ? normalizeEngagement(row[colEngajamento]) : undefined,
          feedback: colFeedback >= 0 ? String(row[colFeedback] || '').trim() : undefined,
          empresa
        };

        result.mentoringRecords!.push(record);
        result.processedRecords++;
      } catch (rowError) {
        result.errors.push(`Erro na linha ${i + 1}: ${rowError}`);
      }
    }

    result.success = result.processedRecords > 0;
  } catch (error) {
    result.errors.push(`Erro ao processar planilha: ${error}`);
  }

  return result;
}

/**
 * Processa planilha de eventos
 */
export function processEventsSheet(
  buffer: Buffer, 
  empresa: string
): BemProcessingResult {
  const result: BemProcessingResult = {
    success: false,
    fileType: empresa === 'SEBRAE ACRE' ? 'sebraeacre_eventos' : 
              empresa === 'SEBRAE TO' ? 'sebraeto_eventos' : 'embrapii_eventos',
    empresa,
    totalRecords: 0,
    processedRecords: 0,
    errors: [],
    eventRecords: []
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length < 2) {
      result.errors.push('Planilha vazia ou sem dados');
      return result;
    }

    const headers = (data[0] as unknown[]).map((h: unknown) => String(h || '').trim());
    
    // Encontrar índices das colunas
    const colIdUsuario = findColumnIndex(headers, 'id usuário', 'id usuario', 'idusuario');
    const colNome = findColumnIndex(headers, 'nome', 'aluno', 'tutorado');
    const colEmail = findColumnIndex(headers, 'email', 'e-mail');
    const colTurma = findColumnIndex(headers, 'turma');
    const colTrilha = findColumnIndex(headers, 'trilha');
    const colTitulo = findColumnIndex(headers, 'título', 'titulo', 'evento', 'webinar', 'nome do evento');
    const colTipo = findColumnIndex(headers, 'tipo', 'tipo evento');
    const colData = findColumnIndex(headers, 'data', 'data do evento');
    const colPresenca = findColumnIndex(headers, 'status presença', 'presença', 'presenca', 'presente');

    result.totalRecords = data.length - 1;

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[];
      if (!row || row.length === 0) continue;

      try {
        const idUsuario = colIdUsuario >= 0 ? String(row[colIdUsuario] || '').trim() : '';
        const nomeAluno = colNome >= 0 ? String(row[colNome] || '').trim() : '';

        if (!idUsuario && !nomeAluno) continue;

        const record: EventRecord = {
          idUsuario: idUsuario || `temp_${i}`,
          nomeAluno: nomeAluno || 'Desconhecido',
          emailAluno: colEmail >= 0 ? String(row[colEmail] || '').trim() : undefined,
          turma: colTurma >= 0 ? String(row[colTurma] || '').trim() : undefined,
          trilha: colTrilha >= 0 ? String(row[colTrilha] || '').trim() : undefined,
          tituloEvento: colTitulo >= 0 ? String(row[colTitulo] || '').trim() : 'Evento',
          tipoEvento: colTipo >= 0 ? String(row[colTipo] || '').trim() : undefined,
          dataEvento: colData >= 0 ? parseExcelDate(row[colData]) : undefined,
          presenca: colPresenca >= 0 ? normalizePresence(row[colPresenca]) : 'ausente',
          empresa
        };

        result.eventRecords!.push(record);
        result.processedRecords++;
      } catch (rowError) {
        result.errors.push(`Erro na linha ${i + 1}: ${rowError}`);
      }
    }

    result.success = result.processedRecords > 0;
  } catch (error) {
    result.errors.push(`Erro ao processar planilha: ${error}`);
  }

  return result;
}

/**
 * Processa planilha de performance (relatório consolidado)
 */
export function processPerformanceSheet(buffer: Buffer): BemProcessingResult {
  const result: BemProcessingResult = {
    success: false,
    fileType: 'performance',
    totalRecords: 0,
    processedRecords: 0,
    errors: [],
    performanceRecords: []
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length < 2) {
      result.errors.push('Planilha vazia ou sem dados');
      return result;
    }

    const headers = (data[0] as unknown[]).map((h: unknown) => String(h || '').trim());
    
    // Encontrar índices das colunas principais
    const colIdUsuario = findColumnIndex(headers, 'id usuário', 'id usuario', 'idusuario');
    const colIdTurma = findColumnIndex(headers, 'id turma', 'idturma');
    const colIdCompetencia = findColumnIndex(headers, 'id competência', 'id competencia', 'idcompetencia');
    const colNomeCompetencia = findColumnIndex(headers, 'competência', 'competencia', 'nome competência');
    const colProgresso = findColumnIndex(headers, 'progresso', 'progresso aulas', '% aulas');
    const colNota = findColumnIndex(headers, 'nota', 'avaliação', 'avaliacao', 'média');
    const colConclusao = findColumnIndex(headers, 'conclusão', 'conclusao', 'data conclusão');

    result.totalRecords = data.length - 1;

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[];
      if (!row || row.length === 0) continue;

      try {
        const idUsuario = colIdUsuario >= 0 ? String(row[colIdUsuario] || '').trim() : '';

        if (!idUsuario) continue;

        const nota = colNota >= 0 ? Number(row[colNota]) : undefined;

        const record: PerformanceRecord = {
          idUsuario,
          idTurma: colIdTurma >= 0 ? String(row[colIdTurma] || '').trim() : undefined,
          idCompetencia: colIdCompetencia >= 0 ? String(row[colIdCompetencia] || '').trim() : undefined,
          nomeCompetencia: colNomeCompetencia >= 0 ? String(row[colNomeCompetencia] || '').trim() : undefined,
          progressoAulas: colProgresso >= 0 ? Number(row[colProgresso]) || 0 : undefined,
          notaAvaliacao: !isNaN(nota!) ? nota : undefined,
          aprovado: nota !== undefined && !isNaN(nota) ? nota >= 7 : undefined,
          dataConclusao: colConclusao >= 0 ? parseExcelDate(row[colConclusao]) : undefined
        };

        result.performanceRecords!.push(record);
        result.processedRecords++;
      } catch (rowError) {
        result.errors.push(`Erro na linha ${i + 1}: ${rowError}`);
      }
    }

    result.success = result.processedRecords > 0;
  } catch (error) {
    result.errors.push(`Erro ao processar planilha: ${error}`);
  }

  return result;
}

/**
 * Processa um arquivo Excel baseado no tipo detectado
 */
export function processBemExcelFile(
  buffer: Buffer, 
  fileName: string
): BemProcessingResult {
  const fileType = detectBemFileType(fileName);
  
  if (!fileType) {
    return {
      success: false,
      fileType: 'sebraeacre_mentorias', // default
      totalRecords: 0,
      processedRecords: 0,
      errors: [`Tipo de arquivo não reconhecido: ${fileName}`]
    };
  }

  switch (fileType) {
    case 'sebraeacre_mentorias':
      return processMentoringSheet(buffer, 'SEBRAE ACRE');
    case 'sebraeto_mentorias':
      return processMentoringSheet(buffer, 'SEBRAE TO');
    case 'embrapii_mentorias':
      return processMentoringSheet(buffer, 'EMBRAPII');
    case 'sebraeacre_eventos':
      return processEventsSheet(buffer, 'SEBRAE ACRE');
    case 'sebraeto_eventos':
      return processEventsSheet(buffer, 'SEBRAE TO');
    case 'embrapii_eventos':
      return processEventsSheet(buffer, 'EMBRAPII');
    case 'performance':
      return processPerformanceSheet(buffer);
    default:
      return {
        success: false,
        fileType,
        totalRecords: 0,
        processedRecords: 0,
        errors: [`Processador não implementado para: ${fileType}`]
      };
  }
}
