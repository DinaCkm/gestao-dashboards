#!/usr/bin/env python3
"""
Script de Backup do Banco de Dados
Exporta todas as tabelas para JSON
"""
import os
import sys
import json
from datetime import datetime

# Configurar ambiente
os.chdir('/app/server')
sys.path.insert(0, '/app/server')
os.environ.setdefault('PYTHONPATH', '/app/server')

# Importar as funções do banco
try:
    import db
    print("✅ Módulo db importado com sucesso")
except Exception as e:
    print(f"❌ Erro ao importar db: {e}")
    sys.exit(1)

async def fazer_backup():
    """Faz backup de todas as tabelas"""
    backup_data = {
        "timestamp": datetime.now().isoformat(),
        "database": "gestao-dashboards",
        "tables": {}
    }
    
    try:
        # 1. Empresas/Programas
        print("📦 Exportando empresas...")
        empresas = await getEmpresas()
        backup_data["tables"]["empresas"] = [dict(e) for e in empresas] if empresas else []
        print(f"   ✅ {len(backup_data['tables']['empresas'])} empresas exportadas")
        
        # 2. Turmas
        print("📦 Exportando turmas...")
        turmas = await getTurmas()
        backup_data["tables"]["turmas"] = [dict(t) for t in turmas] if turmas else []
        print(f"   ✅ {len(backup_data['tables']['turmas'])} turmas exportadas")
        
        # 3. Mentores/Consultores
        print("📦 Exportando mentores...")
        mentores = await getConsultors()
        backup_data["tables"]["mentores"] = [dict(m) for m in mentores] if mentores else []
        print(f"   ✅ {len(backup_data['tables']['mentores'])} mentores exportados")
        
        # 4. Alunos
        print("📦 Exportando alunos...")
        alunos = await getAlunos()
        backup_data["tables"]["alunos"] = []
        
        for aluno in alunos:
            aluno_dict = dict(aluno)
            
            # Exportar sessões de mentoria do aluno
            try:
                sessoes = await getMentoringSessionsByAluno(aluno.id)
                aluno_dict["sessoes_mentoria"] = [dict(s) for s in sessoes] if sessoes else []
            except:
                aluno_dict["sessoes_mentoria"] = []
            
            # Exportar plano individual
            try:
                plano = await getPlanoIndividualByAluno(aluno.id)
                aluno_dict["plano_individual"] = [dict(p) for p in plano] if plano else []
            except:
                aluno_dict["plano_individual"] = []
            
            # Exportar competências obrigatórias
            try:
                competencias = await getCompetenciasObrigatoriasAluno(aluno.id)
                aluno_dict["competencias_obrigatorias"] = [dict(c) for c in competencias] if competencias else []
            except:
                aluno_dict["competencias_obrigatorias"] = []
            
            backup_data["tables"]["alunos"].append(aluno_dict)
        
        print(f"   ✅ {len(backup_data['tables']['alunos'])} alunos exportados (com sessões e planos)")
        
        # 5. Eventos
        print("📦 Exportando eventos...")
        eventos = await getEventos()
        backup_data["tables"]["eventos"] = [dict(e) for e in eventos] if eventos else []
        print(f"   ✅ {len(backup_data['tables']['eventos'])} eventos exportados")
        
        # Salvar arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"/app/backups/backup_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n✅ BACKUP CONCLUÍDO COM SUCESSO!")
        print(f"📁 Arquivo: {filename}")
        print(f"📊 Resumo:")
        print(f"   - Empresas: {len(backup_data['tables']['empresas'])}")
        print(f"   - Turmas: {len(backup_data['tables']['turmas'])}")
        print(f"   - Mentores: {len(backup_data['tables']['mentores'])}")
        print(f"   - Alunos: {len(backup_data['tables']['alunos'])}")
        print(f"   - Eventos: {len(backup_data['tables']['eventos'])}")
        
        return filename
        
    except Exception as e:
        print(f"\n❌ ERRO ao fazer backup: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    import asyncio
    result = asyncio.run(fazer_backup())
    if result:
        print(f"\n🎉 Backup salvo em: {result}")
        sys.exit(0)
    else:
        print("\n💥 Falha no backup!")
        sys.exit(1)
