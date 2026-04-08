import csv
import os
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse, unquote

import pymysql

ZIP_NAME = "BACKUP DASHBOARD.zip"
EXTRACT_DIR = Path("backup_dashboard_extracted")
TABLE_FILE_RE = re.compile(r"^(?P<table>.+)_\d{8}_\d{6}\.csv$", re.IGNORECASE)


def read_database_url():
    env_path = Path(".env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("DATABASE_URL="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
                if value:
                    return value

    value = os.environ.get("DATABASE_URL")
    if value:
        return value

    raise RuntimeError("DATABASE_URL nao encontrada no .env nem nas variaveis de ambiente.")


def connect():
    url = read_database_url()
    parsed = urlparse(url)

    if parsed.scheme != "mysql":
        raise RuntimeError(f"Esquema inesperado na DATABASE_URL: {parsed.scheme}")

    return pymysql.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=unquote(parsed.username or ""),
        password=unquote(parsed.password or ""),
        database=(parsed.path or "").lstrip("/"),
        charset="utf8mb4",
        autocommit=False,
        cursorclass=pymysql.cursors.Cursor,
    )


def extract_zip():
    zip_path = Path(ZIP_NAME)
    if not zip_path.exists():
        raise RuntimeError(f"Arquivo nao encontrado: {ZIP_NAME}")

    if EXTRACT_DIR.exists():
        for item in EXTRACT_DIR.iterdir():
            if item.is_file():
                item.unlink()
    else:
        EXTRACT_DIR.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(EXTRACT_DIR)


def discover_csvs():
    grouped = defaultdict(list)

    for file in EXTRACT_DIR.glob("*.csv"):
        match = TABLE_FILE_RE.match(file.name)
        if not match:
            print(f"[IGNORADO] nome fora do padrao: {file.name}")
            continue

        table = match.group("table")
        grouped[table].append(file)

    for table in grouped:
        grouped[table].sort(key=lambda p: p.name)

    return grouped


def get_existing_tables(cur):
    cur.execute("SHOW TABLES")
    return {row[0] for row in cur.fetchall()}


def get_table_columns(cur, table):
    cur.execute(f"SHOW COLUMNS FROM `{table}`")
    return [row[0] for row in cur.fetchall()]


def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def normalize_value(value):
    if value is None:
        return None

    value = value.strip()

    if value == "":
        return None

    return value


def import_table(cur, table, files):
    db_columns = get_table_columns(cur, table)

    print(f"\n=== TABELA: {table} ===")
    print(f"Arquivos: {len(files)}")

    cur.execute(f"DELETE FROM `{table}`")

    total_inserted = 0

    for file in files:
        print(f"Importando {file.name} ...")

        with file.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []

            usable_columns = [h for h in headers if h in db_columns]

            if not usable_columns:
                print(f"  [SEM COLUNAS COMPATIVEIS] {file.name}")
                continue

            rows_buffer = []
            for row in reader:
                rows_buffer.append(
                    tuple(normalize_value(row.get(col)) for col in usable_columns)
                )

            if not rows_buffer:
                print(f"  [VAZIO] {file.name}")
                continue

            placeholders = ", ".join(["%s"] * len(usable_columns))
            columns_sql = ", ".join(f"`{col}`" for col in usable_columns)
            sql = f"INSERT INTO `{table}` ({columns_sql}) VALUES ({placeholders})"

            inserted_this_file = 0

            for batch in chunked(rows_buffer, 500):
                try:
                    cur.executemany(sql, batch)
                    inserted_this_file += len(batch)
                except Exception as batch_error:
                    print(f"  [ERRO NO LOTE] {file.name}: {batch_error}")
                    for row_values in batch:
                        try:
                            cur.execute(sql, row_values)
                            inserted_this_file += 1
                        except Exception as row_error:
                            print(f"  [LINHA PULADA] {file.name}: {row_error}")

            total_inserted += inserted_this_file
            print(f"  Inseridas: {inserted_this_file}")

    print(f"Total inserido em {table}: {total_inserted}")


def main():
    extract_zip()
    grouped = discover_csvs()

    conn = connect()

    try:
        with conn.cursor() as cur:
            existing_tables = get_existing_tables(cur)
            print(f"Tabelas no banco: {len(existing_tables)}")
            print(f"Tabelas no backup: {len(grouped)}")

            cur.execute("SET FOREIGN_KEY_CHECKS = 0")

            for table, files in grouped.items():
                if table not in existing_tables:
                    print(f"\n[PULADA] tabela nao existe no banco atual: {table}")
                    continue

                import_table(cur, table, files)

            cur.execute("SET FOREIGN_KEY_CHECKS = 1")

        conn.commit()
        print("\n=== IMPORTACAO CONCLUIDA COM SUCESSO ===")

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    main()