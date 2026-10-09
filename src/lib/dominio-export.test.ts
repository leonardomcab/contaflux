import { describe, expect, it } from "vitest";
import {
  buildDominioTxt,
  dominioFileName,
  normalizeCnpj,
  toDominioEntries,
  type ExportBankAccount,
  type ExportTransaction,
  type LedgerAccount,
} from "./dominio-export";

const CNPJ = "11.111.111/0001-11";

const banco: LedgerAccount = { name: "Banco Fictício", reduced_code: "9", is_synthetic: false };
const tarifas: LedgerAccount = {
  name: "Tarifas bancárias",
  reduced_code: "362",
  is_synthetic: false,
};
const receita: LedgerAccount = {
  name: "Receita de serviços",
  reduced_code: "504",
  is_synthetic: false,
};

const contaCorrente: ExportBankAccount = { id: "bank-1", label: "Conta 12345-6", ledger: banco };

function tx(overrides: Partial<ExportTransaction>): ExportTransaction {
  return {
    posted_at: "2026-03-05",
    description: "LANCAMENTO",
    memo: null,
    amount: -10,
    account_id: "bank-1",
    category: tarifas,
    ...overrides,
  };
}

describe("toDominioEntries + buildDominioTxt", () => {
  it("gera o arquivo no leiaute 0000/6000/6100 do Domínio", () => {
    const { entries, issues } = toDominioEntries(
      CNPJ,
      [
        tx({
          posted_at: "2026-03-05",
          description: "PIX RECEBIDO CLIENTE BETA",
          amount: 18196.62,
          category: receita,
        }),
        tx({ posted_at: "2026-03-10", description: "TARIFA | PACOTE\r\nSERVIÇOS", amount: -45.9 }),
      ],
      [contaCorrente],
    );

    expect(issues).toEqual([]);
    expect(buildDominioTxt(normalizeCnpj(CNPJ)!, entries)).toBe(
      "|0000|11111111000111|\n" +
        "|6000|X||||\n" +
        "|6100|05/03/2026|9|504|18196,62||PIX RECEBIDO CLIENTE BETA||||\n" +
        "|6000|X||||\n" +
        "|6100|10/03/2026|362|9|45,90||TARIFA PACOTE SERVIÇOS||||\n",
    );
  });

  it("usa o memo quando a descrição vem vazia", () => {
    const { entries } = toDominioEntries(
      CNPJ,
      [tx({ description: "", memo: "TED ENVIADA" })],
      [contaCorrente],
    );
    expect(entries.map((entry) => entry.history)).toEqual(["TED ENVIADA"]);
  });

  it("gera só o cabeçalho quando não há lançamentos", () => {
    expect(buildDominioTxt("11111111000111", [])).toBe("|0000|11111111000111|\n");
  });
});

describe("pendências", () => {
  it("aponta CNPJ ausente ou inválido", () => {
    expect(toDominioEntries(null, [], []).issues).toEqual([
      { kind: "invalid-cnpj", detail: "CNPJ não informado" },
    ]);
    expect(toDominioEntries("123", [], []).issues).toEqual([
      { kind: "invalid-cnpj", detail: "123" },
    ]);
  });

  it("aponta problemas da categoria", () => {
    const { entries, issues } = toDominioEntries(
      CNPJ,
      [
        tx({ category: null, description: "SEM CATEGORIA", amount: 1500 }),
        tx({ category: { name: "Manual", reduced_code: null, is_synthetic: false } }),
        tx({ category: { name: "Despesas", reduced_code: "300", is_synthetic: true } }),
      ],
      [contaCorrente],
    );
    expect(entries).toEqual([]);
    expect(issues).toEqual([
      { kind: "uncategorized", detail: "05/03/2026 · SEM CATEGORIA · 1500,00" },
      { kind: "category-without-code", detail: "Manual" },
      { kind: "synthetic-category", detail: "Despesas" },
    ]);
  });

  it("aponta problemas da conta bancária uma vez por conta", () => {
    const { entries, issues } = toDominioEntries(
      CNPJ,
      [
        tx({ account_id: "sem-vinculo" }),
        tx({ account_id: "sem-vinculo" }),
        tx({ account_id: "sem-codigo" }),
        tx({ account_id: "sintetica" }),
        tx({ account_id: "inexistente", description: "ORFAO" }),
      ],
      [
        { id: "sem-vinculo", label: "Conta A", ledger: null },
        {
          id: "sem-codigo",
          label: "Conta B",
          ledger: { name: "Bancos", reduced_code: null, is_synthetic: false },
        },
        {
          id: "sintetica",
          label: "Conta C",
          ledger: { name: "Disponível", reduced_code: "5", is_synthetic: true },
        },
      ],
    );
    expect(entries).toEqual([]);
    expect(issues).toEqual([
      { kind: "bank-without-ledger", detail: "Conta A" },
      { kind: "bank-ledger-without-code", detail: "Conta B → Bancos" },
      { kind: "bank-ledger-synthetic", detail: "Conta C → Disponível" },
      { kind: "unknown-bank", detail: "05/03/2026 · ORFAO · 10,00" },
    ]);
  });
});

describe("dominioFileName", () => {
  it("usa o nome da empresa sem acentos, espaços e pontuação", () => {
    expect(dominioFileName("Padaria Fictícia Ltda.", "2026-03", "2026-03")).toBe(
      "lancamento_PADARIAFICTICIALTDA_032026.txt",
    );
  });

  it("identifica intervalos e todos os períodos", () => {
    expect(dominioFileName("Padaria", "2026-02", "2026-03")).toBe(
      "lancamento_PADARIA_022026_a_032026.txt",
    );
    expect(dominioFileName("Padaria", null, null)).toBe("lancamento_PADARIA_todos.txt");
    expect(dominioFileName("***", "2026-03", "2026-03")).toBe("lancamento_EMPRESA_032026.txt");
  });
});
