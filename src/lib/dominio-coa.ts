// Leitura do relatório "Plano de Contas" exportado em PDF pelo Domínio (Thomson Reuters).
// Este módulo só trabalha com o texto já extraído (ver pdf-text.ts), para poder ser testado sem
// navegador.

export type CategoryKind = "despesa" | "receita" | "transferencia";

export type PdfTextItem = { str: string; x: number; y: number };
export type PdfLine = { page: number; y: number; items: PdfTextItem[] };

export type DominioAccount = {
  classification: string;
  reducedCode: string;
  isSynthetic: boolean;
  description: string;
  level: number;
  cnpj: string | null;
};

export type DominioChart = {
  accounts: DominioAccount[];
  /** Contas cuja descrição veio vazia ou só com ".", que o usuário decide se importa. */
  blankDescription: DominioAccount[];
  header: { companyCode: string | null; companyName: string | null; cnpj: string | null };
  declaredTotal: number | null;
};

const CLASSIFICATION_RE = /^\d+(?:\.\d+)*$/;
const CNPJ_RE = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/;
const ROW_FALLBACK_RE = /^(\d+(?:\.\d+)*)\s+(\d+)\s+([SA])(?:\s+(.*?))?\s+(\d{1,2})$/;

type Column = "classification" | "code" | "type" | "description" | "cnpj" | "level";

const HEADER_TITLES: Record<string, Column> = {
  CLASSIFICACAO: "classification",
  CODIGO: "code",
  T: "type",
  DESCRICAO: "description",
  CNPJ: "cnpj",
  GRAU: "level",
};

/** Itens alinhados à direita (como o código reduzido) começam um pouco depois do título. */
const COLUMN_TOLERANCE = 4;
/** Trechos da mesma linha saem com o mesmo Y; rodapés podem ficar a ~1pt da última conta. */
const LINE_TOLERANCE = 0.5;

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/** Agrupa os trechos de texto de uma página em linhas, de cima para baixo e da esquerda para a direita. */
export function groupItemsIntoLines(page: number, items: PdfTextItem[]): PdfLine[] {
  const lines: PdfLine[] = [];
  const sorted = items
    .filter((item) => item.str.trim() !== "")
    .sort((a, b) => b.y - a.y || a.x - b.x);
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l.y - item.y) <= LINE_TOLERANCE);
    if (line) line.items.push(item);
    else lines.push({ page, y: item.y, items: [item] });
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x);
  return lines;
}

function lineText(line: PdfLine): string {
  return line.items
    .map((item) => item.str.trim())
    .join(" ")
    .replace(/\s+/g, " ");
}

function findColumns(lines: PdfLine[]): { start: number; column: Column }[] | null {
  for (const line of lines) {
    const found = new Map<Column, number>();
    for (const item of line.items) {
      const column = HEADER_TITLES[normalizeText(item.str)];
      if (column && !found.has(column)) found.set(column, item.x);
    }
    if (
      found.has("classification") &&
      found.has("code") &&
      found.has("type") &&
      found.has("level")
    ) {
      return [...found.entries()]
        .map(([column, start]) => ({ start, column }))
        .sort((a, b) => a.start - b.start);
    }
  }
  return null;
}

function toAccount(parts: {
  classification: string;
  code: string;
  type: string;
  description: string;
  cnpj: string;
  level: string;
}): DominioAccount | null {
  const classification = parts.classification.trim();
  const code = parts.code.trim();
  const type = parts.type.trim().toUpperCase();
  const level = parts.level.trim();
  if (!CLASSIFICATION_RE.test(classification) || !/^\d+$/.test(code)) return null;
  if (type !== "S" && type !== "A") return null;
  if (!/^\d{1,2}$/.test(level)) return null;

  let description = parts.description.replace(/\s+/g, " ").trim();
  let cnpj = parts.cnpj.trim() || null;
  const trailingCnpj = !cnpj ? description.match(new RegExp(`\\s(${CNPJ_RE.source})$`)) : null;
  if (trailingCnpj?.[1]) {
    cnpj = trailingCnpj[1];
    description = description.slice(0, trailingCnpj.index).trim();
  }

  return {
    classification,
    reducedCode: code,
    isSynthetic: type === "S",
    description,
    level: Number(level),
    cnpj,
  };
}

function parseWithColumns(line: PdfLine, columns: { start: number; column: Column }[]) {
  const parts = { classification: "", code: "", type: "", description: "", cnpj: "", level: "" };
  for (const item of line.items) {
    let column: Column | null = null;
    for (const c of columns) {
      if (c.start <= item.x + COLUMN_TOLERANCE) column = c.column;
    }
    if (!column) continue;
    parts[column] = parts[column] ? `${parts[column]} ${item.str}` : item.str;
  }
  return toAccount(parts);
}

function parseWithRegex(line: PdfLine) {
  const match = lineText(line).match(ROW_FALLBACK_RE);
  if (!match) return null;
  const [, classification = "", code = "", type = "", description = "", level = ""] = match;
  return toAccount({ classification, code, type, description, cnpj: "", level });
}

export function isBlankDescription(description: string): boolean {
  return description.replace(/[.\s]/g, "") === "";
}

export function parseDominioChartOfAccounts(lines: PdfLine[]): DominioChart {
  const header: DominioChart["header"] = { companyCode: null, companyName: null, cnpj: null };
  let declaredTotal: number | null = null;
  const accounts: DominioAccount[] = [];
  const blankDescription: DominioAccount[] = [];
  const seenCodes = new Set<string>();

  const pages = new Map<number, PdfLine[]>();
  for (const line of lines) {
    const list = pages.get(line.page) ?? [];
    list.push(line);
    pages.set(line.page, list);
  }

  for (const pageLines of pages.values()) {
    const columns = findColumns(pageLines);
    for (const line of pageLines) {
      const account = (columns && parseWithColumns(line, columns)) || parseWithRegex(line);
      if (account) {
        if (seenCodes.has(account.reducedCode)) continue;
        seenCodes.add(account.reducedCode);
        if (isBlankDescription(account.description)) blankDescription.push(account);
        else accounts.push(account);
        continue;
      }

      for (const item of line.items) {
        const text = item.str.trim();
        const company = text.match(/^Empresa:\s*(\d+)\s*-\s*(.+)$/i);
        if (company?.[1] && company[2] && !header.companyName) {
          header.companyCode = company[1];
          header.companyName = company[2].trim();
        }
        const cnpj = text.match(new RegExp(`^CNPJ:\\s*(${CNPJ_RE.source})`, "i"));
        if (cnpj?.[1] && !header.cnpj) header.cnpj = cnpj[1];
      }
      const total = lineText(line).match(/Total de Contas Cont[aá]beis:\s*(\d+)/i);
      if (total) declaredTotal = Number(total[1]);
    }
  }

  return { accounts, blankDescription, header, declaredTotal };
}

function digitsOf(classification: string): string {
  return classification.replace(/\D/g, "");
}

/**
 * A conta mãe é a de maior classificação (sem pontos) que seja prefixo da classificação da
 * filha. O relatório não segue a ordem da árvore, então a posição na lista não serve.
 */
export function buildHierarchy(accounts: DominioAccount[]): Map<string, DominioAccount | null> {
  const byDigits = new Map<string, DominioAccount>();
  for (const account of accounts) {
    const digits = digitsOf(account.classification);
    const current = byDigits.get(digits);
    if (!current || (account.isSynthetic && !current.isSynthetic)) byDigits.set(digits, account);
  }

  const parents = new Map<string, DominioAccount | null>();
  for (const account of accounts) {
    const digits = digitsOf(account.classification);
    let parent: DominioAccount | null = null;
    for (let size = digits.length - 1; size > 0 && !parent; size--) {
      parent = byDigits.get(digits.slice(0, size)) ?? null;
    }
    parents.set(account.reducedCode, parent);
  }
  return parents;
}

function ancestorsOf(
  account: DominioAccount,
  parents: Map<string, DominioAccount | null>,
): DominioAccount[] {
  const chain: DominioAccount[] = [];
  const visited = new Set<string>([account.reducedCode]);
  let current = parents.get(account.reducedCode) ?? null;
  while (current && !visited.has(current.reducedCode)) {
    chain.unshift(current);
    visited.add(current.reducedCode);
    current = parents.get(current.reducedCode) ?? null;
  }
  return chain;
}

function kindFromName(name: string): CategoryKind | null {
  const text = normalizeText(name);
  if (text.includes("RECEIT")) return "receita";
  if (text.includes("CUSTO") || text.includes("DESPES")) return "despesa";
  return null;
}

/**
 * Patrimoniais (ativo, passivo e PL) são sempre transferência. Nos demais grupos vale o primeiro
 * nome com RECEITA ou CUSTO/DESPESA lendo de cima para baixo, para que "RECUPERAÇÃO DE DESPESAS"
 * dentro das receitas continue sendo receita.
 */
export function inferKind(
  account: DominioAccount,
  parents: Map<string, DominioAccount | null>,
): CategoryKind {
  const chain = [...ancestorsOf(account, parents), account];
  const root = chain[0] ?? account;
  const rootName = normalizeText(root.description);
  if (/\bATIVO\b|\bPASSIVO\b|PATRIMONIO/.test(rootName)) return "transferencia";
  const group = root.classification.split(".")[0];
  if (root.level !== 1 && (group === "1" || group === "2")) return "transferencia";

  for (const node of chain) {
    const kind = kindFromName(node.description);
    if (kind) return kind;
  }
  return "transferencia";
}

export function compareClassification(a: DominioAccount, b: DominioAccount): number {
  const sa = a.classification.split(".").map(Number);
  const sb = b.classification.split(".").map(Number);
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    const diff = (sa[i] ?? -1) - (sb[i] ?? -1);
    if (diff !== 0) return diff;
  }
  return Number(a.reducedCode) - Number(b.reducedCode);
}

export type ImportRow = DominioAccount & {
  kind: CategoryKind;
  selected: boolean;
  /** Nome que será gravado; nas contas sem descrição o usuário digita na prévia. */
  name: string;
  blank: boolean;
};

/** Linhas da prévia, já ordenadas pela classificação e com o tipo sugerido. */
export function buildImportRows(chart: DominioChart): ImportRow[] {
  const all = [...chart.accounts, ...chart.blankDescription];
  const parents = buildHierarchy(all);
  return all.sort(compareClassification).map((account) => {
    const blank = isBlankDescription(account.description);
    return {
      ...account,
      kind: inferKind(account, parents),
      selected: !blank,
      name: blank ? "" : account.description,
      blank,
    };
  });
}

export type CategoryPayload = {
  code: string;
  reduced_code: string;
  name: string;
  kind: CategoryKind;
  is_synthetic: boolean;
  level: number;
};

export function toCategoryPayload(rows: ImportRow[]): CategoryPayload[] {
  return rows
    .filter((row) => row.selected && row.name.trim() !== "")
    .map((row) => ({
      code: row.classification,
      reduced_code: row.reducedCode,
      name: row.name.trim(),
      kind: row.kind,
      is_synthetic: row.isSynthetic,
      level: row.level,
    }));
}

export type BankAccountSuggestion = {
  label: string;
  agency: string | null;
  accountNumber: string | null;
};

const BANK_PATTERNS = [
  /AG(?:ENCIA)?\.?\s*\/\s*C(?:ONTA|\/C)\.?\s*([\dX-]+)\s*\/\s*([\dX.-]+)/,
  /AG(?:ENCIA)?\.?\s*:?\s*([\dX-]+)\s*[-,]?\s*(?:C\/C|CC|CONTA)\.?\s*:?\s*([\dX.-]+)/,
];

export function parseBankDescription(description: string): BankAccountSuggestion {
  const text = normalizeText(description);
  for (const pattern of BANK_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1] && match[2]) {
      const label = description
        .slice(0, match.index)
        .replace(/[\s-]+$/, "")
        .trim();
      return { label: label || description.trim(), agency: match[1], accountNumber: match[2] };
    }
  }
  return { label: description.trim(), agency: null, accountNumber: null };
}

/** Sugere contas bancárias a partir das analíticas filhas de "BANCOS CONTA MOVIMENTO". */
export function suggestBankAccounts(accounts: DominioAccount[]): BankAccountSuggestion[] {
  const parents = buildHierarchy(accounts);
  return accounts
    .filter((account) => !account.isSynthetic)
    .filter((account) =>
      ancestorsOf(account, parents).some((node) =>
        /BANCOS?\s+CONTA\s+MOVIMENTO/.test(normalizeText(node.description)),
      ),
    )
    .sort(compareClassification)
    .map((account) => parseBankDescription(account.description));
}
