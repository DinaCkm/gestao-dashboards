// Script de Backup do Banco de Dados
const fs = require('fs');
const path = require('path');

// Importar funções do banco
const db = require('./server/db.ts');

async function fazerBackup() {
    console.log('🚀 Iniciando backup do banco de dados...\n');
    
    const backupData = {
        timestamp: new Date().toISOString(),
        database: 'gestao-dashboards',
        tables: {}
    };
    
    try {
        // 1. Empresas
        console.log('📦 Exportando empresas...');
        const empresas = await db.getEmpresas();
        backupData.tables.empresas = empresas || [];
        console.log(`   ✅ ${backupData.tables.empresas.length} empresas exportadas\n`);
        
        // 2. Turmas
        console.log('📦 Exportando turmas...');
        const turmas = await db.getTurmas();
        backupData.tables.turmas = turmas || [];
        console.log(`   ✅ ${backupData.tables.turmas.length} turmas exportadas\n`);
        
        // 3. Consultores/Mentores
        console.log('📦 Exportando mentores...');
        const consultores = await db.getConsultors();
        backupData.tables.mentores = consultores || [];
        console.log(`   ✅ ${backupData.tables.mentores.length} mentores exportados\n`);
        
        // 4. Alunos (com sessões e planos)
        console.log('📦 Exportando alunos...');
        const alunos = await db.getAlunos();
        backupData.tables.alunos = [];
        
        for (const aluno of alunos) {
            const alunoData = { ...aluno };
            
            // Sessões de mentoria
            try {
                const sessoes = await db.getMentoringSessionsByAluno(aluno.id);
                alunoData.sessoes_mentoria = sessoes || [];
            } catch (e) {
                alunoData.sessoes_mentoria = [];
            }
            
            // Plano individual
            try {
                const plano = await db.getPlanoIndividualByAluno(aluno.id);
                alunoData.plano_individual = plano || [];
            } catch (e) {
                alunoData.plano_individual = [];
            }
            
            // Competências obrigatórias
            try {
                const competencias = await db.getCompetenciasObrigatoriasAluno(aluno.id);
                alunoData.competencias_obrigatorias = competencias || [];
            } catch (e) {
                alunoData.competencias_obrigatorias = [];
            }
            
            backupData.tables.alunos.push(alunoData);
        }
        console.log(`   ✅ ${backupData.tables.alunos.length} alunos exportados (com sessões e planos)\n`);
        
        // 5. Eventos
        console.log('📦 Exportando eventos...');
        const eventos = await db.getEventos();
        backupData.tables.eventos = eventos || [];
        console.log(`   ✅ ${backupData.tables.eventos.length} eventos exportados\n`);
        
        // Salvar arquivo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(__dirname, 'backups', `backup_${timestamp}.json`);
        
        // Criar diretório se não existir
        const backupsDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }
        
        fs.writeFileSync(filename, JSON.stringify(backupData, null, 2), 'utf-8');
        
        console.log('\n✅ BACKUP CONCLUÍDO COM SUCESSO!');
        console.log(`📁 Arquivo: ${filename}`);
        console.log(`📊 Resumo:`);
        console.log(`   - Empresas: ${backupData.tables.empresas.length}`);
        console.log(`   - Turmas: ${backupData.tables.turmas.length}`);
        console.log(`   - Mentores: ${backupData.tables.mentores.length}`);
        console.log(`   - Alunos: ${backupData.tables.alunos.length}`);
        console.log(`   - Eventos: ${backupData.tables.eventos.length}`);
        
        return filename;
    } catch (error) {
        console.error('\n❌ ERRO ao fazer backup:', error);
        throw error;
    }
}

// Executar backup
fazerBackup()
    .then(filename => {
        console.log(`\n🎉 Backup salvo com sucesso!`);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Falha no backup!', error);
        process.exit(1);
    });
