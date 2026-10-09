-- Conta do plano que representa a conta bancária na contabilidade: é a contrapartida de cada
-- lançamento exportado para o Domínio.
ALTER TABLE public.bank_accounts
  ADD COLUMN ledger_category_id UUID REFERENCES public.categories ON DELETE SET NULL;
