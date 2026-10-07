import { describe, expect, it } from "vitest";
import {
  findCategoryForTransaction,
  ruleMatches,
  validateRule,
  type ClassificationRule,
} from "./rules";

function rule(overrides: Partial<ClassificationRule> = {}): ClassificationRule {
  return {
    id: "r1",
    category_id: "c1",
    match_type: "contains",
    pattern: "",
    amount_sign: "any",
    min_amount: null,
    max_amount: null,
    priority: 100,
    active: true,
    ...overrides,
  };
}

const tx = (description: string, amount = -10, memo: string | null = null) => ({
  description,
  memo,
  amount,
});

describe("ruleMatches: comparação de texto", () => {
  it("'Contém' ignora acentos, caixa e espaços extras", () => {
    const r = rule({ pattern: "tarifa  servico" });
    expect(ruleMatches(r, tx("TARIFA SERVIÇO MENSAL"))).toBe(true);
    expect(ruleMatches(r, tx("PIX RECEBIDO"))).toBe(false);
  });

  it("'Contém' também procura no memo", () => {
    expect(ruleMatches(rule({ pattern: "energia" }), tx("PAGTO BOLETO", -10, "Energia elétrica"))).toBe(true);
  });

  it("'É igual a' compara descrição e memo separadamente", () => {
    const r = rule({ match_type: "equals", pattern: "Tarifa pacote" });
    expect(ruleMatches(r, tx("TARIFA PACOTE", -10, "Cesta de serviços"))).toBe(true);
    expect(ruleMatches(r, tx("TARIFA PACOTE EXTRA"))).toBe(false);
  });

  it("'Começa com' e 'Termina com' valem para cada campo", () => {
    expect(ruleMatches(rule({ match_type: "starts", pattern: "pix" }), tx("PIX ENVIADO JOAO", -10, "x"))).toBe(true);
    expect(ruleMatches(rule({ match_type: "ends", pattern: "ltda" }), tx("FORNECEDOR LTDA", -10, "NF 123"))).toBe(true);
    expect(ruleMatches(rule({ match_type: "ends", pattern: "ltda" }), tx("LTDA PAGAMENTO"))).toBe(false);
  });

  it("regex não diferencia caixa nem acentos", () => {
    const r = rule({ match_type: "regex", pattern: "^tarifa (servico|pacote)" });
    expect(ruleMatches(r, tx("TARIFA SERVIÇO"))).toBe(true);
    expect(ruleMatches(r, tx("Tarifa Pacote"))).toBe(true);
    expect(ruleMatches(r, tx("PIX TARIFA SERVICO"))).toBe(false);
  });

  it("regex preserva classes como \\D (não são convertidas para minúsculas)", () => {
    const r = rule({ match_type: "regex", pattern: "^NF\\D+\\d+$" });
    expect(ruleMatches(r, tx("NF Nº 123"))).toBe(true);
    expect(ruleMatches(r, tx("NF123"))).toBe(false);
  });

  it("regex inválida nunca combina", () => {
    expect(ruleMatches(rule({ match_type: "regex", pattern: "([a-z" }), tx("abc"))).toBe(false);
  });
});

describe("ruleMatches: filtros de valor", () => {
  it("'Somente entradas' e 'Somente saídas' excluem valor zero", () => {
    expect(ruleMatches(rule({ pattern: "x", amount_sign: "credit" }), tx("x", 10))).toBe(true);
    expect(ruleMatches(rule({ pattern: "x", amount_sign: "credit" }), tx("x", -10))).toBe(false);
    expect(ruleMatches(rule({ pattern: "x", amount_sign: "credit" }), tx("x", 0))).toBe(false);
    expect(ruleMatches(rule({ pattern: "x", amount_sign: "debit" }), tx("x", -10))).toBe(true);
    expect(ruleMatches(rule({ pattern: "x", amount_sign: "debit" }), tx("x", 0))).toBe(false);
  });

  it("mínimo e máximo comparam o valor absoluto, com limites inclusivos", () => {
    const r = rule({ pattern: "x", min_amount: 10, max_amount: "50.00" });
    expect(ruleMatches(r, tx("x", -10))).toBe(true);
    expect(ruleMatches(r, tx("x", 50))).toBe(true);
    expect(ruleMatches(r, tx("x", -9.99))).toBe(false);
    expect(ruleMatches(r, tx("x", 50.01))).toBe(false);
  });

  it("sem texto, a regra vale só pelos filtros de valor", () => {
    expect(ruleMatches(rule({ amount_sign: "debit" }), tx("qualquer", -1))).toBe(true);
    expect(ruleMatches(rule({ max_amount: 5 }), tx("qualquer", 3))).toBe(true);
    expect(ruleMatches(rule(), tx("qualquer"))).toBe(false);
  });

  it("regra inativa nunca combina", () => {
    expect(ruleMatches(rule({ pattern: "x", active: false }), tx("x"))).toBe(false);
  });
});

describe("findCategoryForTransaction", () => {
  it("usa a regra de menor prioridade entre as que combinam", () => {
    const rules = [
      rule({ id: "geral", category_id: "outros", pattern: "pix", priority: 200 }),
      rule({ id: "especifica", category_id: "aluguel", pattern: "pix imobiliaria", priority: 10 }),
    ];
    expect(findCategoryForTransaction(rules, tx("PIX IMOBILIARIA SOL"))).toEqual({
      categoryId: "aluguel",
      ruleId: "especifica",
    });
    expect(findCategoryForTransaction(rules, tx("PIX JOAO"))).toEqual({
      categoryId: "outros",
      ruleId: "geral",
    });
  });

  it("devolve null quando nenhuma regra combina", () => {
    expect(findCategoryForTransaction([rule({ pattern: "tarifa" })], tx("PIX"))).toBeNull();
  });

  // Aguardando definição com o usuário-chave (critério de desempate entre regras).
  it.todo("desempata regras com a mesma prioridade de forma determinística");
});

describe("validateRule", () => {
  const base = { match_type: "contains", pattern: "x", amount_sign: "any", min_amount: null, max_amount: null };

  it("aceita uma regra simples", () => {
    expect(validateRule(base)).toBeNull();
  });

  it("rejeita regex inválida", () => {
    expect(validateRule({ ...base, match_type: "regex", pattern: "([a-z" })).toMatch(/inválida/);
  });

  it("rejeita mínimo maior que máximo e valores negativos", () => {
    expect(validateRule({ ...base, min_amount: 100, max_amount: 10 })).toMatch(/maior que o máximo/);
    expect(validateRule({ ...base, min_amount: -1 })).toMatch(/negativo/);
  });

  it("rejeita regra sem texto e sem filtros, que nunca combinaria", () => {
    expect(validateRule({ ...base, pattern: "  " })).toMatch(/Informe um texto/);
    expect(validateRule({ ...base, pattern: "", amount_sign: "debit" })).toBeNull();
  });
});
