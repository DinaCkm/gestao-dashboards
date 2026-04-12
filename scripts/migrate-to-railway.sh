#!/usr/bin/env bash
set -euo pipefail

# Migração assistida de MySQL (origem -> Railway destino)
# Requer:
#   - SOURCE_DATABASE_URL: mysql://user:pass@host:port/db_origem
#   - DATABASE_URL:        mysql://user:pass@host:port/db_destino (Railway)
#
# Flags:
#   --schema-only   migra apenas estrutura
#   --with-data     migra estrutura + dados (default)
#   --no-drop       não usa DROP TABLE na importação
#
# Exemplo:
#   SOURCE_DATABASE_URL='mysql://u:p@old-host:3306/app' \
#   DATABASE_URL='mysql://u:p@railway-host:3306/railway' \
#   ./scripts/migrate-to-railway.sh --with-data

MODE="with-data"
DROP_STMT="true"
for arg in "$@"; do
  case "$arg" in
    --schema-only)
      MODE="schema-only"
      ;;
    --with-data)
      MODE="with-data"
      ;;
    --no-drop)
      DROP_STMT="false"
      ;;
    *)
      echo "Argumento inválido: $arg" >&2
      exit 1
      ;;
  esac
done

if [[ -z "${SOURCE_DATABASE_URL:-}" ]]; then
  echo "Erro: SOURCE_DATABASE_URL não definida." >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Erro: DATABASE_URL não definida." >&2
  exit 1
fi

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "Erro: mysqldump não encontrado no PATH." >&2
  exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "Erro: mysql client não encontrado no PATH." >&2
  exit 1
fi

DUMP_FILE="/tmp/railway_migration_$(date +%Y%m%d_%H%M%S).sql"
cleanup() {
  rm -f "$DUMP_FILE"
}
trap cleanup EXIT

DUMP_ARGS=(
  --single-transaction
  --quick
  --set-gtid-purged=OFF
  --default-character-set=utf8mb4
)

if [[ "$DROP_STMT" == "true" ]]; then
  DUMP_ARGS+=(--add-drop-table)
fi

if [[ "$MODE" == "schema-only" ]]; then
  DUMP_ARGS+=(--no-data)
fi

echo "[1/3] Exportando banco de origem..."
mysqldump "$SOURCE_DATABASE_URL" "${DUMP_ARGS[@]}" > "$DUMP_FILE"

echo "[2/3] Importando dump no Railway (destino)..."
mysql "$DATABASE_URL" < "$DUMP_FILE"

echo "[3/3] Migração concluída com sucesso."

echo "Próximo passo recomendado:"
echo "- Rodar: pnpm db:push"
echo "- Commitar eventuais migrações novas em drizzle/*.sql"
