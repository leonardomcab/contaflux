import { describe, expect, it } from "vitest";
import {
  cnpjDigits,
  draftsFromSuggestions,
  formatCnpj,
  isCnpjCompleteOrEmpty,
  newBankAccountDraft,
  validateBankAccounts,
} from "./company-setup";

describe("draftsFromSuggestions", () => {
  it("usa a agência no apelido e a conta no número", () => {
    const drafts = draftsFromSuggestions([
      { label: "BANCO ALFA", agency: "0001", accountNumber: "10001-0" },
      { label: "BANCO Y", agency: null, accountNumber: null },
    ]);
    expect(
      drafts.map(({ label, bankId, accountNumber }) => ({ label, bankId, accountNumber })),
    ).toEqual([
      { label: "BANCO ALFA - AG 0001", bankId: "", accountNumber: "10001-0" },
      { label: "BANCO Y", bankId: "", accountNumber: "" },
    ]);
  });
});

describe("validateBankAccounts", () => {
  it("exige apelido", () => {
    const draft = newBankAccountDraft({ label: "  " });
    expect(validateBankAccounts([draft]).get(draft.key)).toMatch(/apelido/);
  });

  it("recusa banco e número repetidos, inclusive duas contas sem nenhum dos dois", () => {
    const a = newBankAccountDraft({ label: "A", bankId: "237", accountNumber: "1" });
    const b = newBankAccountDraft({ label: "B", bankId: "237", accountNumber: "1 " });
    const c = newBankAccountDraft({ label: "C" });
    const d = newBankAccountDraft({ label: "D" });
    const errors = validateBankAccounts([a, b, c, d]);
    expect(errors.has(a.key)).toBe(false);
    expect(errors.get(b.key)).toMatch(/"A"/);
    expect(errors.has(c.key)).toBe(false);
    expect(errors.get(d.key)).toMatch(/sem banco e número/);
  });
});

describe("formatCnpj", () => {
  it("aplica a máscara aos poucos conforme a digitação", () => {
    expect(formatCnpj("11")).toBe("11");
    expect(formatCnpj("112")).toBe("11.2");
    expect(formatCnpj("11222333")).toBe("11.222.333");
    expect(formatCnpj("112223330")).toBe("11.222.333/0");
    expect(formatCnpj("1122233300018")).toBe("11.222.333/0001-8");
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("descarta o que passa de 14 caracteres e ignora pontuação colada", () => {
    expect(formatCnpj("11.222.333/0001-8199")).toBe("11.222.333/0001-81");
    expect(formatCnpj(" 11 222 333 0001 81 ")).toBe("11.222.333/0001-81");
    expect(formatCnpj(null)).toBe("");
  });

  it("aceita CNPJ alfanumérico com dígitos verificadores numéricos", () => {
    expect(formatCnpj("12abc34501de35")).toBe("12.ABC.345/01DE-35");
    expect(formatCnpj("12ABC34501DEXY")).toBe("12.ABC.345/01DE");
  });
});

describe("isCnpjCompleteOrEmpty", () => {
  it("aceita vazio ou completo e recusa incompleto", () => {
    expect(isCnpjCompleteOrEmpty("")).toBe(true);
    expect(isCnpjCompleteOrEmpty("11.222.333/0001-81")).toBe(true);
    expect(isCnpjCompleteOrEmpty("11.222.333/0001")).toBe(false);
  });
});

describe("cnpjDigits", () => {
  it("compara só os dígitos", () => {
    expect(cnpjDigits("99.999.999/0001-99")).toBe(cnpjDigits("99999999000199"));
    expect(cnpjDigits(null)).toBe("");
  });
});
