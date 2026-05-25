#!/usr/bin/env python3
"""
Popula nivelInicio e nivelFim em contrato_niveis
baseado no periodoInicio/periodoTermino do contratos_aluno,
dividindo igualmente entre os níveis do aluno.
"""
import mysql.connector
from datetime import date, timedelta
import math

conn = mysql.connector.connect(
    host="switchyard.proxy.rlwy.net",
    port=13355,
    user="root",
    password="tYlkTuFUypKeenoJvcbJaABCwuivAbDL",
    database="railway"
)
cursor = conn.cursor(dictionary=True)

# Buscar todos os contratos ativos com seus níveis
cursor.execute("""
    SELECT 
        cn.id as nivel_id,
        cn.alunoId,
        cn.contratoId,
        cn.nivel,
        ca.periodoInicio,
        ca.periodoTermino
    FROM contrato_niveis cn
    JOIN contratos_aluno ca ON cn.contratoId = ca.id
    WHERE cn.contratoId > 0
    ORDER BY cn.alunoId, cn.nivel
""")
rows = cursor.fetchall()

# Agrupar por (alunoId, contratoId)
from collections import defaultdict
groups = defaultdict(list)
for row in rows:
    key = (row['alunoId'], row['contratoId'])
    groups[key].append(row)

nivel_order = {'I': 0, 'II': 1, 'III': 2, 'IV': 3}

updates = []
for (alunoId, contratoId), niveis in groups.items():
    # Ordenar por nível
    niveis.sort(key=lambda x: nivel_order.get(x['nivel'], 99))
    n = len(niveis)
    
    inicio = niveis[0]['periodoInicio']
    fim = niveis[0]['periodoTermino']
    total_dias = (fim - inicio).days
    dias_por_nivel = total_dias / n
    
    for i, nivel_row in enumerate(niveis):
        nivel_inicio = inicio + timedelta(days=math.floor(dias_por_nivel * i))
        if i == n - 1:
            nivel_fim = fim
        else:
            nivel_fim = inicio + timedelta(days=math.floor(dias_por_nivel * (i + 1)) - 1)
        
        updates.append((nivel_inicio, nivel_fim, nivel_row['nivel_id']))

# Executar updates em lotes
print(f"Atualizando {len(updates)} registros...")
for nivel_inicio, nivel_fim, nivel_id in updates:
    cursor.execute(
        "UPDATE contrato_niveis SET nivelInicio = %s, nivelFim = %s WHERE id = %s",
        (nivel_inicio, nivel_fim, nivel_id)
    )

conn.commit()
print("Concluído!")

# Verificar resultado para Julia
cursor.execute("""
    SELECT id, nivel, nivelInicio, nivelFim, status
    FROM contrato_niveis
    WHERE alunoId = 660014
    ORDER BY nivel
""")
for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
