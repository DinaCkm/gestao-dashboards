/**
 * Script para popular o banco de dados com as 4 trilhas e 36 competências oficiais do BEM
 * Executar com: node scripts/seed-competencias.mjs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada');
  process.exit(1);
}

// 4 Trilhas oficiais
const TRILHAS = [
  { name: 'Básicas', codigo: 'BASICAS', ordem: 1 },
  { name: 'Essenciais', codigo: 'ESSENCIAIS', ordem: 2 },
  { name: 'Master', codigo: 'MASTER', ordem: 3 },
  { name: 'Jornada do Futuro', codigo: 'JORNADA_FUTURO', ordem: 4 },
];

// 36 Competências organizadas por trilha
const COMPETENCIAS = {
  'BASICAS': [
    { nome: 'Comunicação', codigoIntegracao: 'COMUNICACAO', ordem: 1 },
    { nome: 'Trabalho em Equipe', codigoIntegracao: 'TRABALHO_EQUIPE', ordem: 2 },
    { nome: 'Organização', codigoIntegracao: 'ORGANIZACAO', ordem: 3 },
    { nome: 'Resolução de Problemas', codigoIntegracao: 'RESOLUCAO_PROBLEMAS', ordem: 4 },
    { nome: 'Adaptabilidade', codigoIntegracao: 'ADAPTABILIDADE', ordem: 5 },
    { nome: 'Ética Profissional', codigoIntegracao: 'ETICA_PROFISSIONAL', ordem: 6 },
    { nome: 'Gestão do Tempo', codigoIntegracao: 'GESTAO_TEMPO', ordem: 7 },
    { nome: 'Autoconhecimento', codigoIntegracao: 'AUTOCONHECIMENTO', ordem: 8 },
    { nome: 'Inteligência Emocional', codigoIntegracao: 'INTELIGENCIA_EMOCIONAL', ordem: 9 },
  ],
  'ESSENCIAIS': [
    { nome: 'Liderança', codigoIntegracao: 'LIDERANCA', ordem: 1 },
    { nome: 'Negociação', codigoIntegracao: 'NEGOCIACAO', ordem: 2 },
    { nome: 'Pensamento Crítico', codigoIntegracao: 'PENSAMENTO_CRITICO', ordem: 3 },
    { nome: 'Criatividade', codigoIntegracao: 'CRIATIVIDADE', ordem: 4 },
    { nome: 'Tomada de Decisão', codigoIntegracao: 'TOMADA_DECISAO', ordem: 5 },
    { nome: 'Gestão de Conflitos', codigoIntegracao: 'GESTAO_CONFLITOS', ordem: 6 },
    { nome: 'Networking', codigoIntegracao: 'NETWORKING', ordem: 7 },
    { nome: 'Apresentação', codigoIntegracao: 'APRESENTACAO', ordem: 8 },
    { nome: 'Feedback', codigoIntegracao: 'FEEDBACK', ordem: 9 },
  ],
  'MASTER': [
    { nome: 'Visão Estratégica', codigoIntegracao: 'VISAO_ESTRATEGICA', ordem: 1 },
    { nome: 'Gestão de Projetos', codigoIntegracao: 'GESTAO_PROJETOS', ordem: 2 },
    { nome: 'Inovação', codigoIntegracao: 'INOVACAO', ordem: 3 },
    { nome: 'Gestão de Pessoas', codigoIntegracao: 'GESTAO_PESSOAS', ordem: 4 },
    { nome: 'Análise de Dados', codigoIntegracao: 'ANALISE_DADOS', ordem: 5 },
    { nome: 'Planejamento Financeiro', codigoIntegracao: 'PLANEJAMENTO_FINANCEIRO', ordem: 6 },
    { nome: 'Marketing Pessoal', codigoIntegracao: 'MARKETING_PESSOAL', ordem: 7 },
    { nome: 'Mentoria', codigoIntegracao: 'MENTORIA', ordem: 8 },
    { nome: 'Gestão de Mudanças', codigoIntegracao: 'GESTAO_MUDANCAS', ordem: 9 },
  ],
  'JORNADA_FUTURO': [
    { nome: 'Transformação Digital', codigoIntegracao: 'TRANSFORMACAO_DIGITAL', ordem: 1 },
    { nome: 'Sustentabilidade', codigoIntegracao: 'SUSTENTABILIDADE', ordem: 2 },
    { nome: 'Diversidade e Inclusão', codigoIntegracao: 'DIVERSIDADE_INCLUSAO', ordem: 3 },
    { nome: 'Empreendedorismo', codigoIntegracao: 'EMPREENDEDORISMO', ordem: 4 },
    { nome: 'Inteligência Artificial', codigoIntegracao: 'INTELIGENCIA_ARTIFICIAL', ordem: 5 },
    { nome: 'Economia Circular', codigoIntegracao: 'ECONOMIA_CIRCULAR', ordem: 6 },
    { nome: 'Mindfulness', codigoIntegracao: 'MINDFULNESS', ordem: 7 },
    { nome: 'Lifelong Learning', codigoIntegracao: 'LIFELONG_LEARNING', ordem: 8 },
    { nome: 'Propósito', codigoIntegracao: 'PROPOSITO', ordem: 9 },
  ],
};

async function seed() {
  console.log('Conectando ao banco de dados...');
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Iniciando seed de trilhas e competências...');
    
    // Inserir trilhas
    const trilhaIds = {};
    for (const trilha of TRILHAS) {
      // Verificar se já existe
      const [existing] = await connection.execute(
        'SELECT id FROM trilhas WHERE codigo = ?',
        [trilha.codigo]
      );
      
      if (existing.length > 0) {
        trilhaIds[trilha.codigo] = existing[0].id;
        console.log(`Trilha "${trilha.name}" já existe (ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.execute(
          'INSERT INTO trilhas (name, codigo, ordem, isActive) VALUES (?, ?, ?, 1)',
          [trilha.name, trilha.codigo, trilha.ordem]
        );
        trilhaIds[trilha.codigo] = result.insertId;
        console.log(`Trilha "${trilha.name}" criada (ID: ${result.insertId})`);
      }
    }
    
    // Inserir competências
    let totalCompetencias = 0;
    for (const [trilhaCodigo, competencias] of Object.entries(COMPETENCIAS)) {
      const trilhaId = trilhaIds[trilhaCodigo];
      
      for (const comp of competencias) {
        // Verificar se já existe
        const [existing] = await connection.execute(
          'SELECT id FROM competencias WHERE codigoIntegracao = ?',
          [comp.codigoIntegracao]
        );
        
        if (existing.length > 0) {
          console.log(`  Competência "${comp.nome}" já existe`);
        } else {
          await connection.execute(
            'INSERT INTO competencias (nome, trilhaId, codigoIntegracao, ordem, isActive) VALUES (?, ?, ?, ?, 1)',
            [comp.nome, trilhaId, comp.codigoIntegracao, comp.ordem]
          );
          totalCompetencias++;
          console.log(`  Competência "${comp.nome}" criada`);
        }
      }
    }
    
    console.log(`\n✅ Seed concluído!`);
    console.log(`   - ${TRILHAS.length} trilhas`);
    console.log(`   - ${totalCompetencias} competências criadas`);
    
  } catch (error) {
    console.error('Erro durante o seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch(console.error);
