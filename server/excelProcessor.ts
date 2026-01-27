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
