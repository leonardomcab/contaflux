# Rodando com banco 100% local (fora do Lovable Cloud)

O projeto já veio com tudo que era preciso pra isso: as migrations completas em
`supabase/migrations/` (schema + políticas de RLS) e o `supabase/config.toml`.
O caminho mais direto — e que **não exige reescrever nada do código** — é usar
a própria CLI do Supabase para subir um Postgres local com Auth, Storage e
Studio, e aplicar essas migrations nele.

Por que esse caminho e não um Postgres "puro"? Porque o código depende de
recursos do Supabase Auth (`auth.users`, `auth.uid()` nas políticas de RLS,
`supabase.auth.getClaims()` no middleware). Um Postgres genérico não tem isso
pronto — teríamos que reimplementar login/JWT do zero. A CLI do Supabase
recria esse ambiente completo localmente com um único comando.

## Pré-requisito

Docker Desktop instalado e rodando (é o único requisito — a CLI sobe tudo
dentro de containers).

## Passo a passo

```bash
# 1. Rodar o script (ele chama a CLI via npx, não precisa instalar nada global)
chmod +x scripts/setup-local-supabase.sh
./scripts/setup-local-supabase.sh
```

Isso vai:
1. Subir Postgres + Auth + Storage + Studio localmente via Docker
2. Aplicar automaticamente as migrations que já estão em `supabase/migrations/`
   (as mesmas que criam `companies`, `bank_accounts`, `categories`, `rules`,
   `imports`, `transactions`, `profiles` e as políticas de RLS)
3. Gerar um `.env.local` com a URL e as chaves **dessa instância local** —
   incluindo a `SERVICE_ROLE_KEY`, que o Lovable nunca te deu

```bash
# 2. Rodar o app normalmente
npm run dev
```

A partir daqui, o app conversa com o Postgres local, não mais com o
`*.lovable.cloud`. Nenhuma configuração adicional no código é necessária —
as variáveis são lidas por nome (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
etc.), então o `.env.local` sobrescreve o `.env` original.

## O que você ganha com isso

- **Acesso direto ao banco**: `npx supabase db psql` te dá um `psql` puro,
  ou use o **Studio** (link impresso pelo script) pra navegar/editar tabelas
  numa interface web, como o painel do Supabase.com
- **Service role key própria**: pode rodar operações administrativas
  (bypass de RLS) que o Lovable nunca exportou pra você
- **Dados 100% seus**: nada trafega para servidores da Lovable; pode inclusive
  rodar sem internet depois de subido
- **Resetar/testar à vontade**: `npx supabase db reset` recria o banco do zero
  a partir das migrations — ótimo pra testes automatizados

## Quando quiser desligar

```bash
npx supabase stop
```

## Indo além: Supabase na nuvem, mas seu

Se no futuro quiser um banco compartilhado com outras pessoas da equipe (não
só local), o mesmo `supabase/migrations/` pode ser aplicado num projeto criado
por você direto em supabase.com (`npx supabase link` + `npx supabase db push`).
Aí você tem um Supabase remoto, mas com o dashboard e a service role key sob
seu controle — sem depender do Lovable Cloud.
