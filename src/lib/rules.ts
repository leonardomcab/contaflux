export type ClassificationRule = {
  id: string;
  category_id: string;
  match_type: string;
  pattern: string;
  amount_sign: string;
  min_amount: number | string | null;
  max_amount: number | string | null;
  priority: number;
  active: boolean;
};

export type ClassifiableTransaction = {
  description: string;
  memo?: string | null;
  amount: number;
};

export const MATCH_TYPES = [
  { value: "contains", label: "Contém" },
  { value: "starts", label: "Começa com" },
  { value: "ends", label: "Termina com" },
  { value: "equals", label: "É igual a" },
  { value: "regex", label: "Expressão regular" },
] as const;

export const AMOUNT_SIGNS = [
  { value: "any", label: "Qualquer" },
  { value: "credit", label: "Somente entradas" },
  { value: "debit", label: "Somente saídas" },
] as const;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: string): string {
  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Remove acentos do padrão sem mudar a caixa: minúsculas alterariam o significado de
 * classes como \D, \S e \W. A diferença de caixa é tratada pela flag "i".
 */
function buildRegex(pattern: string): RegExp {
  return new RegExp(stripAccents(pattern), "i");
}

/** Mensagem de erro se a regra for inválida, ou null se puder ser salva. */
export function validateRule(rule: {
  match_type: string;
  pattern: string;
  amount_sign: string;
  min_amount: number | null;
  max_amount: number | null;
}): string | null {
  const pattern = rule.pattern.trim();
  if (rule.match_type === "regex" && pattern !== "") {
    try {
      buildRegex(pattern);
    } catch {
      return "Expressão regular inválida.";
    }
  }
  if (rule.min_amount !== null && rule.min_amount < 0) return "O valor mínimo não pode ser negativo.";
  if (rule.max_amount !== null && rule.max_amount < 0) return "O valor máximo não pode ser negativo.";
  if (rule.min_amount !== null && rule.max_amount !== null && rule.min_amount > rule.max_amount) {
    return "O valor mínimo não pode ser maior que o máximo.";
  }
  if (
    pattern === "" &&
    rule.min_amount === null &&
    rule.max_amount === null &&
    rule.amount_sign === "any"
  ) {
    return "Informe um texto ou pelo menos um filtro de valor.";
  }
  return null;
}

function toNumber(value: number | string | null): number | null {
  if (value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ruleMatches(rule: ClassificationRule, tx: ClassifiableTransaction): boolean {
  if (!rule.active) return false;

  if (rule.amount_sign === "credit" && tx.amount <= 0) return false;
  if (rule.amount_sign === "debit" && tx.amount >= 0) return false;

  const abs = Math.abs(tx.amount);
  const min = toNumber(rule.min_amount);
  const max = toNumber(rule.max_amount);
  if (min !== null && abs < min) return false;
  if (max !== null && abs > max) return false;

  const pattern = rule.pattern?.trim() ?? "";
  if (pattern === "") return min !== null || max !== null || rule.amount_sign !== "any";

  // Descrição e memo são comparados separadamente, para que "É igual a", "Começa com" e
  // "Termina com" valham para cada campo e não para o texto concatenado.
  const fields = [tx.description, tx.memo ?? ""].filter((field) => field.trim() !== "");

  if (rule.match_type === "regex") {
    let regex: RegExp;
    try {
      regex = buildRegex(pattern);
    } catch {
      return false;
    }
    return fields.some((field) => regex.test(stripAccents(field)));
  }

  const needle = normalize(pattern);
  return fields.some((field) => {
    const haystack = normalize(field);
    switch (rule.match_type) {
      case "starts":
        return haystack.startsWith(needle);
      case "ends":
        return haystack.endsWith(needle);
      case "equals":
        return haystack === needle;
      case "contains":
      default:
        return haystack.includes(needle);
    }
  });
}

export function findCategoryForTransaction(
  rules: ClassificationRule[],
  tx: ClassifiableTransaction,
): { categoryId: string; ruleId: string } | null {
  const ordered = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of ordered) {
    if (ruleMatches(rule, tx)) {
      return { categoryId: rule.category_id, ruleId: rule.id };
    }
  }
  return null;
}
