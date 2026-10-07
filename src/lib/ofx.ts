export type OfxTransaction = {
  fitid: string;
  postedAt: string; // yyyy-mm-dd
  amount: number;
  trnType: string | null;
  description: string;
  memo: string | null;
  checkNumber: string | null;
};

export type OfxStatement = {
  bankId: string | null;
  accountNumber: string | null;
  currency: string | null;
  transactions: OfxTransaction[];
  periodStart: string | null;
  periodEnd: string | null;
};

function decode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function tagValue(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"));
  if (!match) return null;
  const value = match[1]?.trim() ?? "";
  return value.length > 0 ? value : null;
}

function parseOfxDate(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  return `${year}-${month}-${day}`;
}

function parseAmount(raw: string | null): number {
  if (!raw) return 0;
  let value = raw.trim().replace(/\s/g, "");
  if (value.includes(",") && value.includes(".")) {
    value = value.lastIndexOf(",") > value.lastIndexOf(".")
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  } else if (value.includes(",")) {
    value = value.replace(",", ".");
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseOfx(input: ArrayBuffer | string): OfxStatement {
  const text = typeof input === "string" ? input : decode(input);

  if (!/<OFX>/i.test(text) && !/<STMTTRN>/i.test(text)) {
    throw new Error("Arquivo inválido: não parece ser um extrato OFX.");
  }

  const acctBlock = text.match(/<BANKACCTFROM>([\s\S]*?)<\/BANKACCTFROM>/i)?.[1]
    ?? text.match(/<CCACCTFROM>([\s\S]*?)<\/CCACCTFROM>/i)?.[1]
    ?? "";

  const transactions: OfxTransaction[] = [];
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];

  for (const block of blocks) {
    const postedAt = parseOfxDate(tagValue(block, "DTPOSTED"));
    if (!postedAt) continue;
    const memo = tagValue(block, "MEMO");
    const name = tagValue(block, "NAME");
    const fitid = tagValue(block, "FITID");
    const amount = parseAmount(tagValue(block, "TRNAMT"));
    transactions.push({
      fitid: fitid ?? `${postedAt}-${amount}-${(name ?? memo ?? "").slice(0, 40)}`,
      postedAt,
      amount,
      trnType: tagValue(block, "TRNTYPE"),
      description: (name ?? memo ?? "Sem descrição").trim(),
      memo: memo,
      checkNumber: tagValue(block, "CHECKNUM"),
    });
  }

  if (transactions.length === 0) {
    throw new Error("Nenhum lançamento encontrado no arquivo.");
  }

  const dates = transactions.map((t) => t.postedAt).sort();

  return {
    bankId: tagValue(acctBlock, "BANKID"),
    accountNumber: tagValue(acctBlock, "ACCTID"),
    currency: tagValue(text, "CURDEF"),
    transactions,
    periodStart: parseOfxDate(tagValue(text, "DTSTART")) ?? dates[0] ?? null,
    periodEnd: parseOfxDate(tagValue(text, "DTEND")) ?? dates[dates.length - 1] ?? null,
  };
}
