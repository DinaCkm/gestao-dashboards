import * as XLSX from 'xlsx';

// Estrutura esperada para cada tipo de planilha
export const TEMPLATE_STRUCTURES = {
  mentorias: {
    columns: [
      { header: 'Nome do Aluno', key: 'nomeAluno', required: true, example: 'João da Silva' },
      { header: 'E-mail', key: 'email', required: false, example: 'joao@email.com' },
      { header: 'Turma', key: 'turma', required: true, example: '38' },
      { header: 'Mentor', key: 'mentor', required: true, example: 'Maria Santos' },
      { header: 'Data', key: 'data', required: true, example: '15/01/2026' },
      { header: 'Mentoria', key: 'mentoria', required: true, example: 'Presente', values: ['Presente', 'Ausente'] },
      { header: 'Atividade proposta', key: 'atividadeProposta', required: true, example: 'Entregue', values: ['Entregue', 'Não entregue'] },
      { header: 'Evolução/Engajamento', key: 'engajamento', required: true, example: '5', values: ['1', '2', '3', '4', '5'] },
      { header: 'Observações', key: 'observacoes', required: false, example: 'Aluno participativo' }
    ],
    description: 'Planilha de acompanhamento de mentorias semanais'
  },
  eventos: {
    columns: [
      { header: 'Nome do Aluno', key: 'nomeAluno', required: true, example: 'João da Silva' },
      { header: 'E-mail', key: 'email', required: false, example: 'joao@email.com' },
      { header: 'Turma', key: 'turma', required: true, example: '38' },
      { header: 'Nome do Evento', key: 'nomeEvento', required: true, example: 'Webinar de Inovação' },
      { header: 'Data do Evento', key: 'dataEvento', required: true, example: '20/01/2026' },
      { header: 'Tipo', key: 'tipo', required: true, example: 'Webinar', values: ['Webinar', 'Workshop', 'Palestra', 'Encontro'] },
      { header: 'Status Presença', key: 'statusPresenca', required: true, example: 'Presente', values: ['Presente', 'Ausente'] },
      { header: 'Observações', key: 'observacoes', required: false, example: '' }
    ],
    description: 'Planilha de participação em eventos'
  },
  performance: {
    columns: [
      { header: 'Nome do Aluno', key: 'nomeAluno', required: true, example: 'João da Silva' },
      { header: 'E-mail', key: 'email', required: false, example: 'joao@email.com' },
      { header: 'Turma', key: 'turma', required: true, example: '38' },
      { header: 'Empresa', key: 'empresa', required: true, example: 'SEBRAE ACRE', values: ['SEBRAE ACRE', 'SEBRAE TO', 'EMBRAPII', 'BANRISUL'] },
      { header: 'Competência 1', key: 'competencia1', required: true, example: '7.5' },
      { header: 'Competência 2', key: 'competencia2', required: true, example: '8.0' },
      { header: 'Competência 3', key: 'competencia3', required: true, example: '6.5' },
      { header: 'Competência 4', key: 'competencia4', required: true, example: '7.0' },
      { header: 'Competência 5', key: 'competencia5', required: true, example: '8.5' },
      { header: 'Média Competências', key: 'mediaCompetencias', required: false, example: '7.5' },
      { header: 'Observações', key: 'observacoes', required: false, example: '' }
    ],
    description: 'Relatório consolidado de performance em competências'
  }
};

export type TemplateType = keyof typeof TEMPLATE_STRUCTURES;

// Gerar template Excel em memória
export function generateTemplate(type: TemplateType): Buffer {
  const structure = TEMPLATE_STRUCTURES[type];
  
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Criar dados do template
  const headers = structure.columns.map(col => col.header);
  const exampleRow = structure.columns.map(col => col.example);
  
  // Criar worksheet com cabeçalho e exemplo
  const wsData = [headers, exampleRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Definir largura das colunas
  ws['!cols'] = structure.columns.map(() => ({ wch: 20 }));
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  
  // Criar aba de instruções
  const instructionsData = [
    ['INSTRUÇÕES DE PREENCHIMENTO'],
    [''],
    [`Tipo: ${type.toUpperCase()}`],
    [`Descrição: ${structure.description}`],
    [''],
    ['COLUNAS OBRIGATÓRIAS:'],
    ...structure.columns
      .filter(col => col.required)
      .map(col => [`- ${col.header}: ${col.values ? `Valores aceitos: ${col.values.join(', ')}` : 'Texto livre'}`]),
    [''],
    ['COLUNAS OPCIONAIS:'],
    ...structure.columns
      .filter(col => !col.required)
      .map(col => [`- ${col.header}`]),
    [''],
    ['OBSERVAÇÕES:'],
    ['- A primeira linha deve conter os cabeçalhos exatamente como no modelo'],
    ['- Não altere a ordem das colunas obrigatórias'],
    ['- Datas devem estar no formato DD/MM/AAAA'],
    ['- Notas devem ser números de 0 a 10'],
  ];
  
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');
  
  // Gerar buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

// Validar estrutura da planilha
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
}

export function validateSpreadsheet(
  data: Buffer, 
  expectedType: TemplateType
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    rowCount: 0
  };
  
  try {
    const wb = XLSX.read(data, { type: 'buffer' });
    
    // Verificar se tem pelo menos uma aba
    if (wb.SheetNames.length === 0) {
      result.valid = false;
      result.errors.push('Planilha vazia - nenhuma aba encontrada');
      return result;
    }
    
    // Pegar primeira aba de dados (ignorar "Instruções")
    const dataSheetName = wb.SheetNames.find(name => name !== 'Instruções') || wb.SheetNames[0];
    const ws = wb.Sheets[dataSheetName];
    
    // Converter para array
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    
    if (rows.length === 0) {
      result.valid = false;
      result.errors.push('Planilha sem dados');
      return result;
    }
    
    // Verificar cabeçalhos
    const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
    const structure = TEMPLATE_STRUCTURES[expectedType];
    const requiredColumns = structure.columns.filter(col => col.required);
    
    for (const col of requiredColumns) {
      const headerLower = col.header.toLowerCase();
      const found = headers.some(h => 
        h === headerLower || 
        h.includes(headerLower) || 
        headerLower.includes(h)
      );
      
      if (!found) {
        result.valid = false;
        result.errors.push(`Coluna obrigatória não encontrada: "${col.header}"`);
      }
    }
    
    // Contar linhas de dados (excluindo cabeçalho)
    result.rowCount = rows.length - 1;
    
    if (result.rowCount === 0) {
      result.warnings.push('Planilha contém apenas cabeçalho, sem dados');
    }
    
    // Validar valores nas colunas com valores específicos
    if (result.valid && result.rowCount > 0) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        for (let j = 0; j < structure.columns.length; j++) {
          const col = structure.columns[j];
          if (col.values && row[j]) {
            const value = String(row[j]).trim();
            if (!col.values.includes(value)) {
              result.warnings.push(
                `Linha ${i + 1}, coluna "${col.header}": valor "${value}" não é um dos valores esperados (${col.values.join(', ')})`
              );
            }
          }
        }
      }
    }
    
  } catch (error) {
    result.valid = false;
    result.errors.push(`Erro ao ler planilha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
  
  return result;
}
