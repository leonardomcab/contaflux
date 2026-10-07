import { describe, expect, it } from "vitest";
import {
  cnpjDigits,
  draftsFromSuggestions,
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

describe("cnpjDigits", () => {
  it("compara só os dígitos", () => {
    expect(cnpjDigits("99.999.999/0001-99")).toBe(cnpjDigits("99999999000199"));
    expect(cnpjDigits(null)).toBe("");
  });
});
