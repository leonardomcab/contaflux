import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildHierarchy,
  buildImportRows,
  compareClassification,
  inferKind,
  parseBankDescription,
  parseDominioChartOfAccounts,
  suggestBankAccounts,
  toCategoryPayload,
  type DominioAccount,
  type DominioChart,
  type PdfLine,
} from "./dominio-coa";
import { extractLinesFromDocument } from "./pdf-text";

const FIXTURE = fileURLToPath(
  new URL("../../examples/plano_contas_empresa_ficticia.pdf", import.meta.url),
);

/** Uma linha por texto, sem a linha de títulos: força o caminho da expressão regular de reserva. */
function linesFromText(rows: string[], page = 1): PdfLine[] {
  return rows.map((str, index) => {
    const y = 800 - index * 15;
    return { page, y, items: [{ str, x: 40, y }] };
  });
}

function account(
  classification: string,
  reducedCode: string,
  description: string,
  level: number,
  isSynthetic = true,
): DominioAccount {
  return { classification, reducedCode, description, level, isSynthetic, cnpj: null };
}

describe("PDF fictício do Domínio (ponta a ponta)", () => {
  let chart: DominioChart;

  beforeAll(async () => {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(await readFile(FIXTURE));
    const task = pdfjs.getDocument({ data, useSystemFonts: true });
    try {
      chart = parseDominioChartOfAccounts(await extractLinesFromDocument(await task.promise));
    } finally {
      await task.destroy();
    }
  });

  it("lê todas as contas visíveis, inclusive a que divide a linha com o rodapé", () => {
    // O gerador do PDF fictício desenha duas contas por página abaixo da margem (45, 46, 91…);
    // elas não aparecem para o usuário e o pdfjs não as entrega.
    expect(chart.accounts).toHaveLength(233);
    expect(chart.blankDescription).toEqual([]);
    expect(chart.accounts.find((a) => a.reducedCode === "43")?.description).toBe(
      "DESPESAS DE MESES SEGUINTES",
    );
    expect(chart.accounts.find((a) => a.reducedCode === "143")?.description).toBe(
      "CUSTOS DIRETOS DOS SERVIÇOS",
    );
  });

  it("lê as colunas de cada conta", () => {
    const bank = chart.accounts.find((a) => a.reducedCode === "8");
    expect(bank).toEqual({
      classification: "1.1.10.200.01",
      reducedCode: "8",
      isSynthetic: false,
      description: "BANCO ALFA - AG 0001 C/C 10001-0",
      level: 5,
      cnpj: null,
    });
    const root = chart.accounts.find((a) => a.reducedCode === "1");
    expect(root).toMatchObject({
      classification: "1",
      isSynthetic: true,
      description: "ATIVO",
      level: 1,
    });
  });

  it("lê o cabeçalho e não acha total no rodapé", () => {
    expect(chart.header).toEqual({
      companyCode: "1",
      companyName: "NEXUS TECNOLOGIA E SERVICOS LTDA",
      cnpj: "99.999.999/0001-99",
    });
    expect(chart.declaredTotal).toBeNull();
  });

  it("define o tipo pelo grupo", () => {
    const parents = buildHierarchy(chart.accounts);
    const kindOf = (code: string) => {
      const found = chart.accounts.find((a) => a.reducedCode === code);
      if (!found) throw new Error(`conta ${code} não encontrada`);
      return inferKind(found, parents);
    };
    expect(kindOf("5")).toBe("transferencia"); // CAIXA GERAL
    expect(kindOf("42")).toBe("transferencia"); // DESPESAS PAGAS ANTECIPADAMENTE (ativo)
    expect(kindOf("95")).toBe("transferencia"); // SALÁRIOS A PAGAR (passivo)
    expect(kindOf("145")).toBe("despesa"); // SALÁRIOS (custos)
    expect(kindOf("203")).toBe("despesa"); // TARIFAS BANCÁRIAS
    expect(kindOf("215")).toBe("receita"); // SERVIÇOS DE DESENVOLVIMENTO
    expect(kindOf("232")).toBe("receita"); // RECUPERAÇÃO DE DESPESAS
    expect(kindOf("222")).toBe("receita"); // (-) ISS, dedução da receita
    expect(kindOf("243")).toBe("transferencia"); // RESULTADO DO EXERCÍCIO
  });

  it("sugere as contas bancárias", () => {
    expect(suggestBankAccounts(chart.accounts)).toEqual([
      { label: "BANCO ALFA", agency: "0001", accountNumber: "10001-0" },
      { label: "BANCO BETA", agency: "0002", accountNumber: "20002-0" },
      { label: "BANCO GAMA", agency: "0003", accountNumber: "30003-0" },
    ]);
  });
});

describe("parseDominioChartOfAccounts com o layout do relatório real (dados anonimizados)", () => {
  const rows = [
    "Empresa: 7 - EMPRESA TESTE LTDA",
    "CNPJ: 11.111.111/0001-11",
    "1 1 S ATIVO 1",
    "1.1.10.2 7 S BANCOS CONTA MOVIMENTO 4",
    "1.1.10.200.01 8 A BANCO X AG/CONTA 123/45678-9 5",
    "1.2.10.100.01 71 S DUPLICATAS A RECEBER 5",
    "1.2.10.100.01 72 A CLIENTE B 5",
    "1.2.10.100.01 73 A CLIENTE C 5",
    "3 269 S CONTAS DE RESULTADOS - CUSTOS E DESPESAS 1",
    "2.1.1 382 S EMPRÉSTIMOS E FINANCIAMENTOS 3",
    "7.1.10.100.01 530 A . 5",
    "7.1.10.100.01 531 A . 5",
    "1.1.10.200.03 551 A BANCO Y 5",
    "Total de Contas Contábeis: 12",
  ];
  // Sem a linha de títulos, as linhas caem na expressão regular de reserva.
  const chart = parseDominioChartOfAccounts(linesFromText(rows));

  it("usa o código reduzido como chave, mesmo com classificação repetida", () => {
    const repeated = chart.accounts.filter((a) => a.classification === "1.2.10.100.01");
    expect(repeated.map((a) => a.reducedCode)).toEqual(["71", "72", "73"]);
  });

  it("separa as contas com descrição '.'", () => {
    expect(chart.blankDescription.map((a) => a.reducedCode)).toEqual(["530", "531"]);
  });

  it("lê cabeçalho e total", () => {
    expect(chart.header).toEqual({
      companyCode: "7",
      companyName: "EMPRESA TESTE LTDA",
      cnpj: "11.111.111/0001-11",
    });
    expect(chart.declaredTotal).toBe(12);
  });

  it("mantém número no fim da descrição sem confundir com o grau", () => {
    const bank = chart.accounts.find((a) => a.reducedCode === "8");
    expect(bank?.description).toBe("BANCO X AG/CONTA 123/45678-9");
    expect(bank?.level).toBe(5);
  });

  it("encontra a mãe pela classificação mesmo com a conta fora de ordem", () => {
    const parents = buildHierarchy(chart.accounts);
    expect(parents.get("551")?.reducedCode).toBe("7");
    expect(parents.get("382")).toBeNull();
  });

  it("sugere bancos com e sem agência/conta", () => {
    expect(suggestBankAccounts(chart.accounts)).toEqual([
      { label: "BANCO X", agency: "123", accountNumber: "45678-9" },
      { label: "BANCO Y", agency: null, accountNumber: null },
    ]);
  });
});

describe("inferKind", () => {
  it("usa os custos do grupo 5 quando o grupo de apuração não diz o tipo", () => {
    const accounts = [
      account("5", "460", "CONTAS DE APURAÇÃO", 1),
      account("5.1", "461", "CUSTOS DOS PRODUTOS E SERVIÇOS VENDIDOS", 2),
      account("5.1.10.100.01", "464", "CUSTOS DOS PRODUTOS VENDIDOS", 5, false),
      account("6", "471", "APURAÇÃO DO RESULTADO DO EXERCÍCIO", 1),
      account("6.1.10.100.1", "474", "RESULTADO DO EXERCÍCIO", 5, false),
    ];
    const parents = buildHierarchy(accounts);
    expect(inferKind(accounts[2]!, parents)).toBe("despesa");
    expect(inferKind(accounts[4]!, parents)).toBe("transferencia");
  });

  it("mantém patrimoniais como transferência mesmo com 'receita' no nome", () => {
    const accounts = [
      account("2", "149", "PASSIVO", 1),
      account("2.4.10.1", "240", "RECEITAS DE EXERCÍCIOS FUTUROS", 4),
    ];
    expect(inferKind(accounts[1]!, buildHierarchy(accounts))).toBe("transferencia");
  });
});

describe("buildImportRows / toCategoryPayload", () => {
  const chart = parseDominioChartOfAccounts(
    linesFromText([
      "4 402 S CONTAS DE RESULTADO - RECEITAS 1",
      "4.1.10.100.01 406 A VENDA DE PRODUTOS 5",
      "7.1.10.100.01 530 A . 5",
      "1 1 S ATIVO 1",
    ]),
  );
  const rows = buildImportRows(chart);

  it("ordena, sugere o tipo e deixa as contas sem descrição desmarcadas", () => {
    expect(rows.map((r) => [r.reducedCode, r.kind, r.selected])).toEqual([
      ["1", "transferencia", true],
      ["402", "receita", true],
      ["406", "receita", true],
      ["530", "transferencia", false],
    ]);
  });

  it("só grava as marcadas com nome, usando o nome digitado", () => {
    const edited = rows.map((r) =>
      r.reducedCode === "530" ? { ...r, selected: true, name: " OUTRAS " } : r,
    );
    const payload = toCategoryPayload(
      edited.map((r) => (r.reducedCode === "1" ? { ...r, selected: false } : r)),
    );
    expect(payload).toEqual([
      {
        code: "4",
        reduced_code: "402",
        name: "CONTAS DE RESULTADO - RECEITAS",
        kind: "receita",
        is_synthetic: true,
        level: 1,
      },
      {
        code: "4.1.10.100.01",
        reduced_code: "406",
        name: "VENDA DE PRODUTOS",
        kind: "receita",
        is_synthetic: false,
        level: 5,
      },
      {
        code: "7.1.10.100.01",
        reduced_code: "530",
        name: "OUTRAS",
        kind: "transferencia",
        is_synthetic: false,
        level: 5,
      },
    ]);
  });
});

describe("compareClassification", () => {
  it("ordena por segmento numérico e depois pelo código reduzido", () => {
    const sorted = [
      account("1.10", "3", "", 2),
      account("1.2", "2", "", 2),
      account("1", "1", "", 1),
      account("1.2", "1", "", 2),
    ].sort(compareClassification);
    expect(sorted.map((a) => `${a.classification}#${a.reducedCode}`)).toEqual([
      "1#1",
      "1.2#1",
      "1.2#2",
      "1.10#3",
    ]);
  });
});

describe("parseBankDescription", () => {
  it("reconhece 'AG x C/C y'", () => {
    expect(parseBankDescription("BANCO ALFA - AG 0001 C/C 10001-0")).toEqual({
      label: "BANCO ALFA",
      agency: "0001",
      accountNumber: "10001-0",
    });
  });
});
