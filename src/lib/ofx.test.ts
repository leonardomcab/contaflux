import { describe, expect, it } from "vitest";
import { parseOfx } from "./ofx";

function sgml(transactions: string, extra = ""): string {
  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102

<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>0341
<ACCTID>12345-6
</BANKACCTFROM>
<BANKTRANLIST>
${extra}
${transactions}
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>`;
}

function trn(fields: Record<string, string>): string {
  const body = Object.entries(fields)
    .map(([tag, value]) => `<${tag}>${value}`)
    .join("\n");
  return `<STMTTRN>\n${body}\n</STMTTRN>`;
}

describe("parseOfx", () => {
  it("lê conta, período e lançamentos de um extrato SGML", () => {
    const text = sgml(
      [
        trn({
          TRNTYPE: "DEBIT",
          DTPOSTED: "20260105",
          TRNAMT: "-10.50",
          FITID: "A1",
          NAME: "TARIFA PACOTE",
          MEMO: "Cesta de serviços",
        }),
        trn({ TRNTYPE: "CREDIT", DTPOSTED: "20260110", TRNAMT: "1500.00", FITID: "A2", NAME: "PIX RECEBIDO" }),
      ].join("\n"),
      "<DTSTART>20260101\n<DTEND>20260131",
    );

    const statement = parseOfx(text);

    expect(statement.bankId).toBe("0341");
    expect(statement.accountNumber).toBe("12345-6");
    expect(statement.currency).toBe("BRL");
    expect(statement.periodStart).toBe("2026-01-01");
    expect(statement.periodEnd).toBe("2026-01-31");
    expect(statement.transactions).toHaveLength(2);
    expect(statement.transactions[0]).toEqual({
      fitid: "A1",
      postedAt: "2026-01-05",
      amount: -10.5,
      trnType: "DEBIT",
      description: "TARIFA PACOTE",
      memo: "Cesta de serviços",
      checkNumber: null,
    });
  });

  it("aceita OFX em XML, com tags de fechamento", () => {
    const text = `<?xml version="1.0"?><OFX><BANKACCTFROM><BANKID>001</BANKID><ACCTID>999</ACCTID></BANKACCTFROM>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260201</DTPOSTED><TRNAMT>-99.90</TRNAMT><FITID>X</FITID><NAME>BOLETO</NAME></STMTTRN></OFX>`;

    const statement = parseOfx(text);

    expect(statement.bankId).toBe("001");
    expect(statement.transactions[0]).toMatchObject({ amount: -99.9, description: "BOLETO", fitid: "X" });
  });

  it("lê a conta de extratos de cartão de crédito (CCACCTFROM)", () => {
    const text = `<OFX><CCACCTFROM><ACCTID>4111</ACCTID></CCACCTFROM>
${trn({ DTPOSTED: "20260301", TRNAMT: "-20", FITID: "C1", NAME: "LOJA" })}</OFX>`;

    expect(parseOfx(text).accountNumber).toBe("4111");
  });

  it.each([
    ["-1.234,56", -1234.56],
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["1234.56", 1234.56],
    ["1,5", 1.5],
    ["-10", -10],
    ["  -7.25 ", -7.25],
  ])("interpreta o valor %s como %d", (raw, expected) => {
    const text = sgml(trn({ DTPOSTED: "20260105", TRNAMT: raw, FITID: "V", NAME: "X" }));
    expect(parseOfx(text).transactions[0]?.amount).toBeCloseTo(expected, 2);
  });

  it("ignora hora e fuso horário da data", () => {
    const text = sgml(trn({ DTPOSTED: "20260115120000[-3:BRT]", TRNAMT: "-1", FITID: "D", NAME: "X" }));
    expect(parseOfx(text).transactions[0]?.postedAt).toBe("2026-01-15");
  });

  it("usa o MEMO como descrição quando não há NAME", () => {
    const text = sgml(trn({ DTPOSTED: "20260105", TRNAMT: "-1", FITID: "M", MEMO: "PAGTO CONTA LUZ" }));
    expect(parseOfx(text).transactions[0]?.description).toBe("PAGTO CONTA LUZ");
  });

  it("usa a primeira e a última data dos lançamentos quando não há DTSTART/DTEND", () => {
    const text = sgml(
      [
        trn({ DTPOSTED: "20260120", TRNAMT: "-1", FITID: "1", NAME: "X" }),
        trn({ DTPOSTED: "20260103", TRNAMT: "-1", FITID: "2", NAME: "Y" }),
      ].join("\n"),
    );
    const statement = parseOfx(text);
    expect(statement.periodStart).toBe("2026-01-03");
    expect(statement.periodEnd).toBe("2026-01-20");
  });

  it("descarta lançamentos sem data válida", () => {
    const text = sgml(
      [
        trn({ DTPOSTED: "2026", TRNAMT: "-1", FITID: "1", NAME: "SEM DATA" }),
        trn({ DTPOSTED: "20260103", TRNAMT: "-1", FITID: "2", NAME: "OK" }),
      ].join("\n"),
    );
    expect(parseOfx(text).transactions.map((t) => t.fitid)).toEqual(["2"]);
  });

  it("decodifica arquivos em Windows-1252", () => {
    const text = sgml(trn({ DTPOSTED: "20260105", TRNAMT: "-1", FITID: "W", NAME: "TARIFA SERVIÇO" }));
    const bytes = new Uint8Array([...text].map((char) => char.charCodeAt(0)));
    expect(parseOfx(bytes.buffer).transactions[0]?.description).toBe("TARIFA SERVIÇO");
  });

  it("rejeita arquivos que não são OFX", () => {
    expect(() => parseOfx("data;valor\n01/01/2026;10")).toThrow(/não parece ser um extrato OFX/);
  });

  it("rejeita extratos sem lançamentos", () => {
    expect(() => parseOfx(sgml(""))).toThrow(/Nenhum lançamento/);
  });

  // Aguardando definição com o usuário-chave (lançamentos idênticos no mesmo dia são legítimos?).
  it.todo("gera FITIDs distintos para lançamentos idênticos sem FITID no mesmo arquivo");
  // Aguardando definição com o usuário-chave (arquivos com mais de uma conta).
  it.todo("separa os lançamentos de arquivos com vários <STMTRS>");
});
