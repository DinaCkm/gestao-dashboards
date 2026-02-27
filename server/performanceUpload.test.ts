import { describe, it, expect } from 'vitest';

// Test the CSV parsing helper functions
// We'll test the parseCSVLine and getVal functions by importing them indirectly

describe('Performance Upload CSV Parsing', () => {
  // Replicate the parseCSVLine function for testing
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
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

  function getVal(values: string[], colMap: Record<string, number>, colName: string): string | undefined {
    const idx = colMap[colName];
    if (idx === undefined || idx >= values.length) return undefined;
    const val = values[idx]?.trim();
    if (!val || val === '-') return undefined;
    return val;
  }

  it('should parse simple CSV line', () => {
    const line = '616662,Adonay Fares,adonay@test.com,95599';
    const result = parseCSVLine(line);
    expect(result).toEqual(['616662', 'Adonay Fares', 'adonay@test.com', '95599']);
  });

  it('should parse CSV line with quoted fields', () => {
    const line = '616662,"Adonay Fares Custódio Dos Santos","27/11/2024 16:54:16",adonay@ac.sebrae.com.br';
    const result = parseCSVLine(line);
    expect(result).toEqual([
      '616662',
      'Adonay Fares Custódio Dos Santos',
      '27/11/2024 16:54:16',
      'adonay@ac.sebrae.com.br'
    ]);
  });

  it('should parse CSV line with commas inside quotes', () => {
    const line = '"Name, With Comma","Value1","Value2"';
    const result = parseCSVLine(line);
    expect(result).toEqual(['Name, With Comma', 'Value1', 'Value2']);
  });

  it('should parse CSV line with escaped quotes', () => {
    const line = '"He said ""hello""",value2';
    const result = parseCSVLine(line);
    expect(result).toEqual(['He said "hello"', 'value2']);
  });

  it('should handle empty values', () => {
    const line = 'a,,c,';
    const result = parseCSVLine(line);
    expect(result).toEqual(['a', '', 'c', '']);
  });

  it('should parse a real performance CSV header line', () => {
    const header = '"Id Usuário","Nome Usuário","Último acesso",E-mail,"Id Turma (agrupador 1)","Turma (agrupador 1)","Id Competência (agrupador 2)","Competência (agrupador 2)"';
    const result = parseCSVLine(header);
    expect(result.length).toBe(8);
    expect(result[0]).toBe('Id Usuário');
    expect(result[1]).toBe('Nome Usuário');
    expect(result[2]).toBe('Último acesso');
    expect(result[3]).toBe('E-mail');
    expect(result[4]).toBe('Id Turma (agrupador 1)');
    expect(result[5]).toBe('Turma (agrupador 1)');
    expect(result[6]).toBe('Id Competência (agrupador 2)');
    expect(result[7]).toBe('Competência (agrupador 2)');
  });

  it('should parse a real performance CSV data line', () => {
    const line = '616662,"Adonay Fares Custódio Dos Santos","27/11/2024 16:54:16",adonay@ac.sebrae.com.br,95599,"[2024] SEBRAE Acre - Turma 1.0",01J9PT80CC3DGJPX7QBJT042F8,"Gestão de Conflitos - Master",-,-,6,6,0,0,6,0,0,01:30:00,00:00:00,0,0,0,0,0,1,0,1,0,0,"Sem avaliações respondidas","Não existem conteúdos com prazo","Não existem conteúdos com prazo","Não existem conteúdos com prazo","Não existem conteúdos com prazo"';
    const result = parseCSVLine(line);
    expect(result[0]).toBe('616662');
    expect(result[1]).toBe('Adonay Fares Custódio Dos Santos');
    expect(result[3]).toBe('adonay@ac.sebrae.com.br');
    expect(result[4]).toBe('95599');
    expect(result[5]).toBe('[2024] SEBRAE Acre - Turma 1.0');
    expect(result[7]).toBe('Gestão de Conflitos - Master');
    expect(result[10]).toBe('6'); // Total de aulas
    expect(result[16]).toBe('0'); // Progresso Total
  });

  it('getVal should return undefined for dash values', () => {
    const values = ['616662', 'Name', '-', 'email@test.com'];
    const colMap = { 'Id Usuário': 0, 'Nome': 1, 'Último acesso': 2, 'E-mail': 3 };
    
    expect(getVal(values, colMap, 'Id Usuário')).toBe('616662');
    expect(getVal(values, colMap, 'Nome')).toBe('Name');
    expect(getVal(values, colMap, 'Último acesso')).toBeUndefined();
    expect(getVal(values, colMap, 'E-mail')).toBe('email@test.com');
  });

  it('getVal should return undefined for missing columns', () => {
    const values = ['a', 'b'];
    const colMap = { 'col1': 0, 'col2': 1 };
    
    expect(getVal(values, colMap, 'col1')).toBe('a');
    expect(getVal(values, colMap, 'nonexistent')).toBeUndefined();
  });

  it('getVal should return undefined for out of bounds index', () => {
    const values = ['a'];
    const colMap = { 'col1': 0, 'col2': 5 };
    
    expect(getVal(values, colMap, 'col1')).toBe('a');
    expect(getVal(values, colMap, 'col2')).toBeUndefined();
  });

  it('should correctly build column map from header', () => {
    const headerLine = '"Id Usuário","Nome Usuário","Último acesso",E-mail,"Id Turma (agrupador 1)","Turma (agrupador 1)"';
    const headers = parseCSVLine(headerLine);
    
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      colMap[h.trim()] = i;
    });
    
    expect(colMap['Id Usuário']).toBe(0);
    expect(colMap['Nome Usuário']).toBe(1);
    expect(colMap['Último acesso']).toBe(2);
    expect(colMap['E-mail']).toBe(3);
    expect(colMap['Id Turma (agrupador 1)']).toBe(4);
    expect(colMap['Turma (agrupador 1)']).toBe(5);
  });

  it('should handle integer parsing safely', () => {
    const parseIntSafe = (val: string | undefined): number => {
      if (!val || val === '-') return 0;
      const n = parseInt(val, 10);
      return isNaN(n) ? 0 : n;
    };

    expect(parseIntSafe('6')).toBe(6);
    expect(parseIntSafe('0')).toBe(0);
    expect(parseIntSafe('100')).toBe(100);
    expect(parseIntSafe('-')).toBe(0);
    expect(parseIntSafe(undefined)).toBe(0);
    expect(parseIntSafe('')).toBe(0);
    expect(parseIntSafe('abc')).toBe(0);
  });

  it('should handle decimal parsing safely', () => {
    const parseDecimalSafe = (val: string | undefined): string | null => {
      if (!val || val === '-' || val.includes('Sem avalia')) return null;
      const n = parseFloat(val.replace(',', '.'));
      return isNaN(n) ? null : n.toFixed(2);
    };

    expect(parseDecimalSafe('86')).toBe('86.00');
    expect(parseDecimalSafe('93')).toBe('93.00');
    expect(parseDecimalSafe('7.5')).toBe('7.50');
    expect(parseDecimalSafe('-')).toBeNull();
    expect(parseDecimalSafe(undefined)).toBeNull();
    expect(parseDecimalSafe('Sem avaliações respondidas')).toBeNull();
    expect(parseDecimalSafe('')).toBeNull();
  });
});
