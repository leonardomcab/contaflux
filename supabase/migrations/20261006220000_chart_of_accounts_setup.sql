-- Plano de contas importado do Domínio: código reduzido (chave da conta no ERP, já que a
-- classificação pode se repetir), conta sintética/analítica e grau na hierarquia.
ALTER TABLE public.categories
  ADD COLUMN reduced_code TEXT,
  ADD COLUMN is_synthetic BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN level INTEGER;

-- Constraint completa (não parcial) para que o upsert do PostgREST consiga usá-la em
-- ON CONFLICT. Contas cadastradas à mão ficam com reduced_code NULL, e NULLs não colidem.
ALTER TABLE public.categories
  ADD CONSTRAINT categories_company_reduced_code_key UNIQUE (company_id, reduced_code);

-- Cria a empresa, as contas bancárias e o plano de contas em uma única transação: se qualquer
-- parte falhar, nada é gravado.
CREATE OR REPLACE FUNCTION public.create_company_setup(
  p_name TEXT,
  p_cnpj TEXT,
  p_notes TEXT,
  p_bank_accounts JSONB,
  p_categories JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  IF NULLIF(btrim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'O nome da empresa é obrigatório';
  END IF;
  IF jsonb_typeof(COALESCE(p_bank_accounts, '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_bank_accounts deve ser um array JSON';
  END IF;
  IF jsonb_typeof(COALESCE(p_categories, '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_categories deve ser um array JSON';
  END IF;

  INSERT INTO public.companies (name, cnpj, notes, created_by)
  VALUES (btrim(p_name), NULLIF(btrim(p_cnpj), ''), NULLIF(btrim(p_notes), ''), auth.uid())
  RETURNING id INTO v_company_id;

  -- bank_id e account_number vazios em vez de NULL, igual ao import_statement, para que o
  -- primeiro OFX da conta reaproveite este cadastro.
  INSERT INTO public.bank_accounts (company_id, label, bank_id, account_number)
  SELECT
    v_company_id,
    btrim(b ->> 'label'),
    COALESCE(btrim(b ->> 'bank_id'), ''),
    COALESCE(btrim(b ->> 'account_number'), '')
  FROM jsonb_array_elements(COALESCE(p_bank_accounts, '[]'::jsonb)) AS b;

  INSERT INTO public.categories (company_id, code, reduced_code, name, kind, is_synthetic, level)
  SELECT
    v_company_id,
    NULLIF(c ->> 'code', ''),
    NULLIF(c ->> 'reduced_code', ''),
    c ->> 'name',
    COALESCE(NULLIF(c ->> 'kind', ''), 'despesa'),
    COALESCE((c ->> 'is_synthetic')::BOOLEAN, false),
    NULLIF(c ->> 'level', '')::INTEGER
  FROM jsonb_array_elements(COALESCE(p_categories, '[]'::jsonb)) AS c;

  RETURN v_company_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_company_setup(TEXT, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_setup(TEXT, TEXT, TEXT, JSONB, JSONB) TO authenticated, service_role;
