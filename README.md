# ContaFlux

Sistema interno para escritórios de contabilidade automatizarem a conciliação
de extratos bancários dos clientes: importa o extrato (OFX), classifica cada
transação por regras configuráveis, permite revisão manual e exporta o
período já classificado.

## Fluxo

```
Login → Escolher empresa cliente → Enviar extrato OFX
   → Lançamentos importados (data, descrição, valor, tipo)
   → Regras aplicam categoria automaticamente
   → Revisão/ajuste manual do que ficou pendente
   → Exportação (CSV/XLSX) do período classificado
```

## Stack

- [TanStack Start](https://tanstack.com/start) (React + TanStack Router, SSR e server functions)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, RLS)

## Rodando localmente

Pré-requisito: Node.js e Docker (pra subir o banco local).

```bash
npm install

# sobe um Supabase local (Postgres + Auth + Studio) e aplica as migrations
chmod +x scripts/setup-local-supabase.sh
./scripts/setup-local-supabase.sh

npm run dev
```

Veja `LOCAL_SETUP.md` para detalhes de como o banco local funciona e como
acessar os dados diretamente (Studio ou `psql`).

## Estrutura do banco

O schema completo (tabelas e políticas de RLS) está em
`supabase/migrations/`. Entidades principais: `companies`, `bank_accounts`,
`categories` (plano de contas), `rules` (regras de classificação), `imports`
(extratos importados) e `transactions`.

## Escopo atual / próximos passos

- Importação via OFX implementada; importação via PDF ainda não.
- Exportação em CSV/XLSX com layout de colunas configurável (não amarrada a
  um sistema contábil específico).
