// Geração do TXT de lançamentos contábeis no leiaute de importação do Domínio (Thomson Reuters):
// registro 0000 com o CNPJ e, para cada lançamento, um lote 6000 "X" (um débito para um
// crédito) seguido do 6100. Campos entre "|", contas pelo código reduzido.

export type LedgerAccount = {
  name: string;
  reduced_code: string | null;
  is_synthetic: boolean;
};

export type ExportTransaction = {
  posted_at: string;
  description: string;
  memo: string | null;
  amount: number;
  account_id: string;
  category: LedgerAccount | null;
};

export type ExportBankAccount = {
  id: string;
  label: string;
  ledger: LedgerAccount | null;
};

export type DominioEntry = {
  date: string;
  debit: string;
  credit: string;
  amount: number;
  history: string;
};

export type DominioIssueKind =
  | "invalid-cnpj"
  | "uncategorized"
  | "category-without-code"
  | "synthetic-category"
  | "bank-without-ledger"
  | "bank-ledger-without-code"
  | "bank-ledger-synthetic"
  | "unknown-bank";

export const DOMINIO_ISSUE_LABELS: Record<DominioIssueKind, string> = {
  "invalid-cnpj": "Empresa sem CNPJ válido (14 dígitos)",
  uncategorized: "Lançamentos sem categoria",
  "category-without-code": "Contas sem código reduzido do Domínio",
  "synthetic-category": "Lançamentos classificados em conta sintética",
  "bank-without-ledger": "Contas bancárias sem conta contábil vinculada",
  "bank-ledger-without-code": "Contas bancárias vinculadas a conta sem código reduzido",
  "bank-ledger-synthetic": "Contas bancárias vinculadas a conta sintética",
  "unknown-bank": "Lançamentos de conta bancária não encontrada",
};

export type DominioIssue = { kind: DominioIssueKind; detail: string };

/** Só os dígitos do CNPJ, ou null se não sobrarem exatamente 14. */
export function normalizeCnpj(cnpj: string | null | undefined): string | null {
  const digits = (cnpj ?? "").replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}

function formatDominioDate(postedAt: string): string {
  const [year, month, day] = postedAt.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatDominioAmount(amount: number): string {
  return Math.abs(amount).toFixed(2).replace(".", ",");
}

/** O "|" separa campos e a quebra de linha separa registros, então nenhum dos dois pode sobrar. */
function sanitizeHistory(text: string): string {
  return text
    .replace(/[|\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function describeTransaction(tx: ExportTransaction): string {
  return `${formatDominioDate(tx.posted_at)} · ${tx.description} · ${formatDominioAmount(tx.amount)}`;
}

/**
 * Converte as transações em lançamentos de partida dobrada. Entrada de dinheiro: débito no banco
 * e crédito na categoria; saída: débito na categoria e crédito no banco. Qualquer pendência
 * impede o arquivo de ser gerado, por isso as entradas só valem quando `issues` está vazio.
 */
export function toDominioEntries(
  cnpj: string | null | undefined,
  transactions: ExportTransaction[],
  bankAccounts: ExportBankAccount[],
): { entries: DominioEntry[]; issues: DominioIssue[] } {
  const issues = new Map<string, DominioIssue>();
  const addIssue = (kind: DominioIssueKind, detail: string) => {
    issues.set(`${kind}\u0000${detail}`, { kind, detail });
  };

  if (!normalizeCnpj(cnpj)) addIssue("invalid-cnpj", cnpj?.trim() || "CNPJ não informado");

  const banks = new Map(bankAccounts.map((bank) => [bank.id, bank]));
  const entries: DominioEntry[] = [];

  for (const tx of transactions) {
    const bank = banks.get(tx.account_id);
    let bankCode: string | null = null;
    if (!bank) {
      addIssue("unknown-bank", describeTransaction(tx));
    } else if (!bank.ledger) {
      addIssue("bank-without-ledger", bank.label);
    } else if (bank.ledger.is_synthetic) {
      addIssue("bank-ledger-synthetic", `${bank.label} → ${bank.ledger.name}`);
    } else if (!bank.ledger.reduced_code) {
      addIssue("bank-ledger-without-code", `${bank.label} → ${bank.ledger.name}`);
    } else {
      bankCode = bank.ledger.reduced_code;
    }

    let categoryCode: string | null = null;
    if (!tx.category) {
      addIssue("uncategorized", describeTransaction(tx));
    } else if (tx.category.is_synthetic) {
      addIssue("synthetic-category", tx.category.name);
    } else if (!tx.category.reduced_code) {
      addIssue("category-without-code", tx.category.name);
    } else {
      categoryCode = tx.category.reduced_code;
    }

    if (!bankCode || !categoryCode) continue;
    const incoming = tx.amount > 0;
    entries.push({
      date: formatDominioDate(tx.posted_at),
      debit: incoming ? bankCode : categoryCode,
      credit: incoming ? categoryCode : bankCode,
      amount: tx.amount,
      history: sanitizeHistory(tx.description || tx.memo || ""),
    });
  }

  return { entries, issues: [...issues.values()] };
}

/** Texto do arquivo, em UTF-8 sem BOM e com LF ao fim de cada linha (como o arquivo aceito hoje). */
export function buildDominioTxt(cnpj: string, entries: DominioEntry[]): string {
  const lines = [`|0000|${cnpj}|`];
  for (const entry of entries) {
    lines.push("|6000|X||||");
    lines.push(
      `|6100|${entry.date}|${entry.debit}|${entry.credit}|${formatDominioAmount(entry.amount)}||${entry.history}||||`,
    );
  }
  return lines.map((line) => `${line}\n`).join("");
}

function monthToken(month: string): string {
  return `${month.slice(5, 7)}${month.slice(0, 4)}`;
}

/** `lancamento_<EMPRESA>_<MMAAAA>.txt`; meses em AAAA-MM, ou null para "todos os períodos". */
export function dominioFileName(
  companyName: string,
  start: string | null,
  end: string | null,
): string {
  const company =
    companyName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") || "EMPRESA";
  const period =
    start && end
      ? start === end
        ? monthToken(start)
        : `${monthToken(start)}_a_${monthToken(end)}`
      : "todos";
  return `lancamento_${company}_${period}.txt`;
}
