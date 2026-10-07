-- Importa um extrato OFX em uma única transação: conta bancária, registro da importação e
-- lançamentos são gravados juntos ou nada é gravado.
CREATE OR REPLACE FUNCTION public.import_statement(
  p_company_id UUID,
  p_bank_id TEXT,
  p_account_number TEXT,
  p_account_label TEXT,
  p_file_name TEXT,
  p_period_start DATE,
  p_period_end DATE,
  p_transactions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_import_id UUID;
  v_total INTEGER;
  v_inserted INTEGER;
BEGIN
  IF jsonb_typeof(p_transactions) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_transactions deve ser um array JSON';
  END IF;

  v_total := jsonb_array_length(p_transactions);

  INSERT INTO public.bank_accounts (company_id, bank_id, account_number, label)
  VALUES (
    p_company_id,
    COALESCE(p_bank_id, ''),
    COALESCE(p_account_number, ''),
    COALESCE(NULLIF(p_account_label, ''), p_file_name)
  )
  ON CONFLICT (company_id, bank_id, account_number) DO NOTHING
  RETURNING id INTO v_account_id;

  IF v_account_id IS NULL THEN
    SELECT id INTO v_account_id
    FROM public.bank_accounts
    WHERE company_id = p_company_id
      AND bank_id = COALESCE(p_bank_id, '')
      AND account_number = COALESCE(p_account_number, '');
  END IF;

  INSERT INTO public.imports (
    company_id, account_id, file_name, period_start, period_end, total_count, imported_by
  )
  VALUES (
    p_company_id, v_account_id, p_file_name, p_period_start, p_period_end, v_total, auth.uid()
  )
  RETURNING id INTO v_import_id;

  -- DISTINCT ON descarta FITIDs repetidos dentro do próprio arquivo; ON CONFLICT descarta os
  -- que já existem na conta. Os dois casos entram como "repetidos".
  WITH incoming AS (
    SELECT DISTINCT ON (t ->> 'fitid')
      t ->> 'fitid' AS fitid,
      (t ->> 'posted_at')::DATE AS posted_at,
      (t ->> 'amount')::NUMERIC(14,2) AS amount,
      t ->> 'trn_type' AS trn_type,
      COALESCE(t ->> 'description', '') AS description,
      t ->> 'memo' AS memo,
      t ->> 'check_number' AS check_number,
      NULLIF(t ->> 'category_id', '')::UUID AS category_id,
      NULLIF(t ->> 'rule_id', '')::UUID AS rule_id,
      t ->> 'classified_by' AS classified_by,
      ord
    FROM jsonb_array_elements(p_transactions) WITH ORDINALITY AS e(t, ord)
    ORDER BY t ->> 'fitid', ord
  ),
  inserted AS (
    INSERT INTO public.transactions (
      company_id, account_id, import_id, fitid, posted_at, amount, trn_type,
      description, memo, check_number, category_id, rule_id, classified_by
    )
    SELECT
      p_company_id, v_account_id, v_import_id, fitid, posted_at, amount, trn_type,
      description, memo, check_number, category_id, rule_id, classified_by
    FROM incoming
    ORDER BY ord
    ON CONFLICT (account_id, fitid) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM inserted;

  UPDATE public.imports
  SET inserted_count = v_inserted,
      duplicate_count = v_total - v_inserted
  WHERE id = v_import_id;

  RETURN jsonb_build_object(
    'import_id', v_import_id,
    'account_id', v_account_id,
    'total', v_total,
    'inserted', v_inserted,
    'duplicates', v_total - v_inserted
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.import_statement(UUID, TEXT, TEXT, TEXT, TEXT, DATE, DATE, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_statement(UUID, TEXT, TEXT, TEXT, TEXT, DATE, DATE, JSONB) TO authenticated, service_role;
