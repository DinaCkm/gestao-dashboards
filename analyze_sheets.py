import pandas as pd
import os

sample_dir = "/home/ubuntu/gestao-dashboards/sample-data"

files = [
    "SEBRAEACRE-Mentorias.xlsx",
    "SEBRAEACRE-Eventos.xlsx",
    "EMBRAPII-Mentorias.xlsx",
    "EMBRAPII-Eventos.xlsx",
    "BS2SEBRAETO-Tutorias(respostas).xlsx",
    "BS2SEBRAETO-Eventos.xlsx",
    "relatorio-de-performance.xlsx"
]

output = []

for filename in files:
    filepath = os.path.join(sample_dir, filename)
    if os.path.exists(filepath):
        output.append(f"\n{'='*80}")
        output.append(f"ARQUIVO: {filename}")
        output.append(f"{'='*80}")
        
        try:
            # Read all sheets
            xl = pd.ExcelFile(filepath)
            output.append(f"Abas encontradas: {xl.sheet_names}")
            
            for sheet_name in xl.sheet_names:
                df = pd.read_excel(filepath, sheet_name=sheet_name)
                output.append(f"\n--- Aba: {sheet_name} ---")
                output.append(f"Linhas: {len(df)}, Colunas: {len(df.columns)}")
                output.append(f"Colunas: {list(df.columns)}")
                
                # Show first 3 rows as sample
                if len(df) > 0:
                    output.append(f"\nPrimeiras 3 linhas:")
                    for idx, row in df.head(3).iterrows():
                        output.append(f"  Linha {idx}: {dict(row)}")
        except Exception as e:
            output.append(f"Erro ao ler: {e}")

# Save analysis
with open("/home/ubuntu/gestao-dashboards/planilhas_analysis.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output))

print("Análise salva em planilhas_analysis.txt")
print("\n".join(output[:100]))  # Print first 100 lines
