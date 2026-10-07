#!/usr/bin/env bash
# Sobe um Supabase local (Postgres + Auth + Storage + Studio) usando a CLI oficial,
# reaproveitando as migrations que já existem em supabase/migrations, e gera o
# .env.local com as chaves DESSA instância local — que você controla 100%.
#
# Pré-requisito: Docker Desktop (ou Docker Engine) instalado e rodando.
#
# Uso:
#   chmod +x scripts/setup-local-supabase.sh
#   ./scripts/setup-local-supabase.sh

set -euo pipefail

echo "==> Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
  echo "Docker não está rodando. Abra o Docker Desktop e tente de novo."
  exit 1
fi

echo "==> Subindo o Supabase local (isso aplica automaticamente supabase/migrations/*.sql)..."
npx supabase start

echo "==> Lendo credenciais da instância local..."
STATUS_JSON="$(npx supabase status -o json)"

API_URL=$(echo "$STATUS_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).API_URL")
ANON_KEY=$(echo "$STATUS_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).ANON_KEY")
SERVICE_ROLE_KEY=$(echo "$STATUS_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).SERVICE_ROLE_KEY")
STUDIO_URL=$(echo "$STATUS_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).STUDIO_URL")

cat > .env.local <<EOF
# Instância LOCAL do Supabase (gerada por scripts/setup-local-supabase.sh)
# Você tem controle total: Postgres direto, Studio, service role key, tudo aqui.
SUPABASE_URL="${API_URL}"
SUPABASE_PUBLISHABLE_KEY="${ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY}"

VITE_SUPABASE_URL="${API_URL}"
VITE_SUPABASE_PUBLISHABLE_KEY="${ANON_KEY}"
EOF

echo ""
echo "==> Pronto! Criei o arquivo .env.local apontando para o Supabase local."
echo "    Studio (interface web pra ver/editar dados): ${STUDIO_URL}"
echo ""
echo "Próximos passos:"
echo "  1. Rode 'npm run dev' normalmente — ele agora conversa com o banco local."
echo "  2. Para acessar os dados direto: abra o Studio no link acima, ou use"
echo "     'npx supabase db psql' pra entrar direto no Postgres."
echo "  3. Quando quiser desligar o banco local: 'npx supabase stop'."
