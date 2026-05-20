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
  pdi: {
    columns: [
      { header: 'Nome do Aluno', key: 'nomeAluno', required: true, example: 'João da Silva' },
      { header: 'E-mail', key: 'email', required: false, example: 'joao@email.com' },
      { header: 'Trilha', key: 'trilha', required: true, example: 'Basic', values: ['Basic', 'Essential', 'Master', 'Visão de Futuro', 'Jornada do Futuro I.A', 'Alinhamento Inicial'] },
      { header: 'Macro Início', key: 'macroInicio', required: true, example: '01/01/2026' },
      { header: 'Macro Término', key: 'macroTermino', required: true, example: '30/06/2026' },
      { header: 'Competência 1', key: 'competencia1', required: true, example: 'Escuta Ativa' },
      { header: 'Peso 1', key: 'peso1', required: true, example: 'obrigatoria', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 1', key: 'notaCorte1', required: true, example: '70' },
      { header: 'Meta Final 1', key: 'metaFinal1', required: false, example: '80' },
      { header: 'Micro Início 1', key: 'microInicio1', required: false, example: '01/01/2026' },
      { header: 'Micro Término 1', key: 'microTermino1', required: false, example: '31/03/2026' },
      { header: 'Competência 2', key: 'competencia2', required: false, example: 'Empatia' },
      { header: 'Peso 2', key: 'peso2', required: false, example: 'obrigatoria', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 2', key: 'notaCorte2', required: false, example: '70' },
      { header: 'Meta Final 2', key: 'metaFinal2', required: false, example: '80' },
      { header: 'Micro Início 2', key: 'microInicio2', required: false, example: '01/01/2026' },
      { header: 'Micro Término 2', key: 'microTermino2', required: false, example: '31/03/2026' },
      { header: 'Competência 3', key: 'competencia3', required: false, example: 'Gestão do Tempo' },
      { header: 'Peso 3', key: 'peso3', required: false, example: 'obrigatoria', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 3', key: 'notaCorte3', required: false, example: '70' },
      { header: 'Meta Final 3', key: 'metaFinal3', required: false, example: '80' },
      { header: 'Micro Início 3', key: 'microInicio3', required: false, example: '01/01/2026' },
      { header: 'Micro Término 3', key: 'microTermino3', required: false, example: '31/03/2026' },
      { header: 'Competência 4', key: 'competencia4', required: false, example: '' },
      { header: 'Peso 4', key: 'peso4', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 4', key: 'notaCorte4', required: false, example: '' },
      { header: 'Meta Final 4', key: 'metaFinal4', required: false, example: '' },
      { header: 'Micro Início 4', key: 'microInicio4', required: false, example: '' },
      { header: 'Micro Término 4', key: 'microTermino4', required: false, example: '' },
      { header: 'Competência 5', key: 'competencia5', required: false, example: '' },
      { header: 'Peso 5', key: 'peso5', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 5', key: 'notaCorte5', required: false, example: '' },
      { header: 'Meta Final 5', key: 'metaFinal5', required: false, example: '' },
      { header: 'Micro Início 5', key: 'microInicio5', required: false, example: '' },
      { header: 'Micro Término 5', key: 'microTermino5', required: false, example: '' },
      { header: 'Competência 6', key: 'competencia6', required: false, example: '' },
      { header: 'Peso 6', key: 'peso6', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 6', key: 'notaCorte6', required: false, example: '' },
      { header: 'Meta Final 6', key: 'metaFinal6', required: false, example: '' },
      { header: 'Micro Início 6', key: 'microInicio6', required: false, example: '' },
      { header: 'Micro Término 6', key: 'microTermino6', required: false, example: '' },
      { header: 'Competência 7', key: 'competencia7', required: false, example: '' },
      { header: 'Peso 7', key: 'peso7', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 7', key: 'notaCorte7', required: false, example: '' },
      { header: 'Meta Final 7', key: 'metaFinal7', required: false, example: '' },
      { header: 'Micro Início 7', key: 'microInicio7', required: false, example: '' },
      { header: 'Micro Término 7', key: 'microTermino7', required: false, example: '' },
      { header: 'Competência 8', key: 'competencia8', required: false, example: '' },
      { header: 'Peso 8', key: 'peso8', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 8', key: 'notaCorte8', required: false, example: '' },
      { header: 'Meta Final 8', key: 'metaFinal8', required: false, example: '' },
      { header: 'Micro Início 8', key: 'microInicio8', required: false, example: '' },
      { header: 'Micro Término 8', key: 'microTermino8', required: false, example: '' },
      { header: 'Competência 9', key: 'competencia9', required: false, example: '' },
      { header: 'Peso 9', key: 'peso9', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 9', key: 'notaCorte9', required: false, example: '' },
      { header: 'Meta Final 9', key: 'metaFinal9', required: false, example: '' },
      { header: 'Micro Início 9', key: 'microInicio9', required: false, example: '' },
      { header: 'Micro Término 9', key: 'microTermino9', required: false, example: '' },
      { header: 'Competência 10', key: 'competencia10', required: false, example: '' },
      { header: 'Peso 10', key: 'peso10', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 10', key: 'notaCorte10', required: false, example: '' },
      { header: 'Meta Final 10', key: 'metaFinal10', required: false, example: '' },
      { header: 'Micro Início 10', key: 'microInicio10', required: false, example: '' },
      { header: 'Micro Término 10', key: 'microTermino10', required: false, example: '' },
      { header: 'Competência 11', key: 'competencia11', required: false, example: '' },
      { header: 'Peso 11', key: 'peso11', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 11', key: 'notaCorte11', required: false, example: '' },
      { header: 'Meta Final 11', key: 'metaFinal11', required: false, example: '' },
      { header: 'Micro Início 11', key: 'microInicio11', required: false, example: '' },
      { header: 'Micro Término 11', key: 'microTermino11', required: false, example: '' },
      { header: 'Competência 12', key: 'competencia12', required: false, example: '' },
      { header: 'Peso 12', key: 'peso12', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 12', key: 'notaCorte12', required: false, example: '' },
      { header: 'Meta Final 12', key: 'metaFinal12', required: false, example: '' },
      { header: 'Micro Início 12', key: 'microInicio12', required: false, example: '' },
      { header: 'Micro Término 12', key: 'microTermino12', required: false, example: '' },
      { header: 'Competência 13', key: 'competencia13', required: false, example: '' },
      { header: 'Peso 13', key: 'peso13', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 13', key: 'notaCorte13', required: false, example: '' },
      { header: 'Meta Final 13', key: 'metaFinal13', required: false, example: '' },
      { header: 'Micro Início 13', key: 'microInicio13', required: false, example: '' },
      { header: 'Micro Término 13', key: 'microTermino13', required: false, example: '' },
      { header: 'Competência 14', key: 'competencia14', required: false, example: '' },
      { header: 'Peso 14', key: 'peso14', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 14', key: 'notaCorte14', required: false, example: '' },
      { header: 'Meta Final 14', key: 'metaFinal14', required: false, example: '' },
      { header: 'Micro Início 14', key: 'microInicio14', required: false, example: '' },
      { header: 'Micro Término 14', key: 'microTermino14', required: false, example: '' },
      { header: 'Competência 15', key: 'competencia15', required: false, example: '' },
      { header: 'Peso 15', key: 'peso15', required: false, example: '', values: ['obrigatoria', 'opcional'] },
      { header: 'Nota Corte 15', key: 'notaCorte15', required: false, example: '' },
      { header: 'Meta Final 15', key: 'metaFinal15', required: false, example: '' },
      { header: 'Micro Início 15', key: 'microInicio15', required: false, example: '' },
      { header: 'Micro Término 15', key: 'microTermino15', required: false, example: '' },
    ],
    description: 'Criação de PDIs em massa para múltiplos alunos'
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
