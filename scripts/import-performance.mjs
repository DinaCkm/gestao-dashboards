/**
 * Script para importar dados de performance das competências
 * Processa: relatorio-de-performance.xlsx
 * 
 * Colunas importantes:
 * - Id Usuário: identificador do aluno
 * - Nome Usuário: nome do aluno
 * - Id Turma (agrupador 1): identificador da turma
 * - Id Competência (agrupador 2): identificador da competência
 * - Competência (agrupador 2): nome da competência
 * - Progresso Total: % de progresso nas aulas
 * - Média em avaliações respondidas: nota final da competência
 */

import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function getConnection() {
  return await mysql.createConnection(DATABASE_URL);
}

function parsePerformanceFile(filePath) {
  console.log(`\nProcessando: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  if (data.length < 2) {
    console.log('Planilha vazia');
    return [];
  }

  const headers = data[0].map(h => String(h || '').trim());
  console.log(`Headers: ${headers.slice(0, 10).join(', ')}...`);
  
  // Mapear índices das colunas
  const colIndex = {
    idUsuario: headers.findIndex(h => h.toLowerCase() === 'id usuário'),
    nomeUsuario: headers.findIndex(h => h.toLowerCase() === 'nome usuário'),
    idTurma: headers.findIndex(h => h.toLowerCase().includes('id turma')),
    nomeTurma: headers.findIndex(h => h.toLowerCase().includes('turma (agrupador')),
    idCompetencia: headers.findIndex(h => h.toLowerCase().includes('id competência')),
    nomeCompetencia: headers.findIndex(h => h.toLowerCase() === 'competência (agrupador 2)'),
    progressoTotal: headers.findIndex(h => h.toLowerCase() === 'progresso total'),
    mediaAvaliacoes: headers.findIndex(h => h.toLowerCase().includes('média em avaliações respondidas'))
  };
  
  console.log(`Colunas encontradas:`, colIndex);

  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const idUsuario = colIndex.idUsuario >= 0 ? String(row[colIndex.idUsuario] || '').trim() : '';
    if (!idUsuario || idUsuario === 'undefined' || idUsuario === 'nan') continue;
    
    const mediaAvaliacoes = colIndex.mediaAvaliacoes >= 0 ? row[colIndex.mediaAvaliacoes] : null;
    const nota = mediaAvaliacoes !== null && mediaAvaliacoes !== '' && !isNaN(Number(mediaAvaliacoes)) 
      ? Number(mediaAvaliacoes) 
      : null;
    
    records.push({
      idUsuario,
      nomeUsuario: colIndex.nomeUsuario >= 0 ? String(row[colIndex.nomeUsuario] || '').trim() : '',
      idTurma: colIndex.idTurma >= 0 ? String(row[colIndex.idTurma] || '').trim() : '',
      nomeTurma: colIndex.nomeTurma >= 0 ? String(row[colIndex.nomeTurma] || '').trim() : '',
      idCompetencia: colIndex.idCompetencia >= 0 ? String(row[colIndex.idCompetencia] || '').trim() : '',
      nomeCompetencia: colIndex.nomeCompetencia >= 0 ? String(row[colIndex.nomeCompetencia] || '').trim() : '',
      progressoTotal: colIndex.progressoTotal >= 0 ? Number(row[colIndex.progressoTotal]) || 0 : 0,
      notaAvaliacao: nota,
      aprovado: nota !== null ? nota >= 70 : null // Nota >= 70% = aprovado (escala 0-100)
    });
  }
  
  console.log(`-> ${records.length} registros de performance encontrados`);
  return records;
}

async function importPerformance() {
  console.log('=== Iniciando importação de performance ===');
  
  const conn = await getConnection();
  
  try {
    // Buscar alunos existentes
    const [alunos] = await conn.execute('SELECT id, externalId, name FROM alunos');
    const alunoMap = new Map();
    for (const aluno of alunos) {
      if (aluno.externalId) {
        alunoMap.set(aluno.externalId, aluno.id);
      }
    }
    console.log(`Alunos mapeados: ${alunoMap.size}`);
    
    // Buscar competências existentes - mapear por código de integração E por nome
    const [competencias] = await conn.execute('SELECT id, codigoIntegracao, nome FROM competencias');
    const competenciaMapByCodigo = new Map();
    const competenciaMapByNome = new Map();
    
    // Mapeamento manual entre nomes da planilha e nomes do banco
    const nomeMapping = {
      'atencao basica': 'comunicacao',
      'autopercepcao basica': 'autoconhecimento',
      'disciplina basica': 'organizacao',
      'empatia basica': 'inteligencia emocional',
      'escuta ativa basica': 'comunicacao',
      'gestao do tempo basica': 'gestao do tempo',
      'memoria basica': 'pensamento critico',
      'raciocinio logico e espacial basica': 'pensamento critico',
      'adaptabilidade essencial': 'adaptabilidade',
      'comunicacao assertiva essencial': 'comunicacao',
      'inteligencia emocional essencial': 'inteligencia emocional',
      'leitura de cenario essencial': 'visao estrategica',
      'planejamento e organizacao essencial': 'organizacao',
      'proatividade essencial': 'lideranca',
      'resolucao de problemas essencial': 'resolucao de problemas',
      'trabalho em equipe essencial': 'trabalho em equipe',
      'criatividade master': 'criatividade',
      'gestao de conflitos master': 'gestao de conflitos',
      'lideranca master': 'lideranca',
      'negociacao master': 'negociacao',
      'pensamento critico master': 'pensamento critico',
      'tomada de decisao master': 'tomada de decisao',
      'mindset visionario visao de futuro': 'visao estrategica',
      'gestao de equipes master': 'gestao de pessoas',
    };
    
    for (const comp of competencias) {
      if (comp.codigoIntegracao) {
        competenciaMapByCodigo.set(comp.codigoIntegracao, comp.id);
      }
      // Mapear por nome normalizado
      const nomeNormalizado = comp.nome.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
      competenciaMapByNome.set(nomeNormalizado, comp.id);
    }
    
    // Adicionar mapeamentos extras
    for (const [planilhaNome, bancoNome] of Object.entries(nomeMapping)) {
      const id = competenciaMapByNome.get(bancoNome);
      if (id) {
        competenciaMapByNome.set(planilhaNome, id);
      }
    }
    
    console.log(`Competências mapeadas por código: ${competenciaMapByCodigo.size}`);
    console.log(`Competências mapeadas por nome: ${competenciaMapByNome.size}`);
    
    // Processar arquivo de performance
    const records = parsePerformanceFile('/home/ubuntu/gestao-dashboards/sample-data/relatorio-de-performance.xlsx');
    
    if (records.length === 0) {
      console.log('Nenhum registro para importar');
      return;
    }
    
    // Agrupar por aluno para atualizar plano individual
    const alunoPerformance = new Map();
    
    let debugCount = 0;
    let alunoNaoEncontrado = 0;
    let compNaoEncontrada = 0;
    
    for (const rec of records) {
      const alunoId = alunoMap.get(rec.idUsuario);
      if (!alunoId) {
        alunoNaoEncontrado++;
        if (debugCount < 5) {
          console.log(`Debug: Aluno não encontrado - ID: ${rec.idUsuario}`);
          debugCount++;
        }
        continue;
      }
      
      // Tentar mapear por código primeiro, depois por nome
      let competenciaId = competenciaMapByCodigo.get(rec.idCompetencia);
      if (!competenciaId && rec.nomeCompetencia) {
        const nomeNormalizado = rec.nomeCompetencia.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')  // Remover espaços duplos
          .trim();
        competenciaId = competenciaMapByNome.get(nomeNormalizado);
        if (!competenciaId && debugCount < 10) {
          console.log(`Debug: Competência não encontrada - Nome: "${rec.nomeCompetencia}" -> "${nomeNormalizado}"`);
          debugCount++;
        }
      }
      if (!competenciaId) {
        compNaoEncontrada++;
        continue;
      }
      
      const key = `${alunoId}_${competenciaId}`;
      
      // Manter o registro com maior nota se houver duplicatas
      if (!alunoPerformance.has(key) || (rec.notaAvaliacao && rec.notaAvaliacao > (alunoPerformance.get(key).notaAvaliacao || 0))) {
        alunoPerformance.set(key, {
          alunoId,
          competenciaId,
          notaAvaliacao: rec.notaAvaliacao,
          progressoTotal: rec.progressoTotal,
          aprovado: rec.aprovado
        });
      }
    }
    
    console.log(`\nEstatísticas de mapeamento:`);
    console.log(`- Alunos não encontrados: ${alunoNaoEncontrado}`);
    console.log(`- Competências não encontradas: ${compNaoEncontrada}`);
    console.log(`\nRegistros únicos aluno-competência: ${alunoPerformance.size}`);
    
    // Atualizar plano_individual com as notas
    let atualizados = 0;
    let inseridos = 0;
    
    for (const [key, perf] of alunoPerformance) {
      // Verificar se já existe no plano individual
      const [existing] = await conn.execute(
        'SELECT id FROM plano_individual WHERE alunoId = ? AND competenciaId = ?',
        [perf.alunoId, perf.competenciaId]
      );
      
      if (existing.length > 0) {
        // Atualizar nota
        if (perf.notaAvaliacao !== null) {
          // Converter de escala 0-100 para 0-10
          const notaConvertida = perf.notaAvaliacao / 10;
          const status = notaConvertida >= 7 ? 'concluida' : 'em_progresso';
          
          await conn.execute(
            'UPDATE plano_individual SET notaAtual = ?, status = ?, updatedAt = NOW() WHERE id = ?',
            [notaConvertida.toFixed(2), status, existing[0].id]
          );
          atualizados++;
        }
      } else {
        // Inserir novo registro no plano individual
        if (perf.notaAvaliacao !== null) {
          const notaConvertida = perf.notaAvaliacao / 10;
          const status = notaConvertida >= 7 ? 'concluida' : 'em_progresso';
          
          await conn.execute(
            'INSERT INTO plano_individual (alunoId, competenciaId, isObrigatoria, notaAtual, metaNota, status) VALUES (?, ?, 0, ?, 7.00, ?)',
            [perf.alunoId, perf.competenciaId, notaConvertida.toFixed(2), status]
          );
          inseridos++;
        }
      }
    }
    
    console.log('\n=== Importação de performance concluída ===');
    console.log(`Total de registros processados: ${records.length}`);
    console.log(`Registros atualizados no plano individual: ${atualizados}`);
    console.log(`Registros inseridos no plano individual: ${inseridos}`);
    
    // Mostrar estatísticas
    const [stats] = await conn.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN notaAtual IS NOT NULL THEN 1 END) as comNota,
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
        AVG(notaAtual) as mediaNotas
      FROM plano_individual
    `);
    
    console.log('\nEstatísticas do plano individual:');
    console.log(`- Total de registros: ${stats[0].total}`);
    console.log(`- Com nota: ${stats[0].comNota}`);
    console.log(`- Concluídas (nota >= 7): ${stats[0].concluidas}`);
    console.log(`- Média das notas: ${stats[0].mediaNotas ? Number(stats[0].mediaNotas).toFixed(2) : 'N/A'}`);
    
  } catch (error) {
    console.error('Erro durante importação:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

importPerformance().catch(console.error);
