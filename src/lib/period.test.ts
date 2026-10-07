import { describe, expect, it } from "vitest";
import { formatMonth, listMonths, monthBounds, monthOf, parseMonth } from "./period";

describe("parseMonth", () => {
  it("aceita AAAA-MM e rejeita o resto", () => {
    expect(parseMonth("2026-03")).toBe("2026-03");
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth("2026-3")).toBeNull();
    expect(parseMonth("2026-03-01")).toBeNull();
    expect(parseMonth(202603)).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
  });
});

describe("monthBounds", () => {
  it("vai do primeiro dia do mês inicial ao último dia do mês final", () => {
    expect(monthBounds("2026-01", "2026-03")).toEqual({ from: "2026-01-01", to: "2026-03-31" });
    expect(monthBounds("2026-04", "2026-04")).toEqual({ from: "2026-04-01", to: "2026-04-30" });
  });

  it("trata fevereiro em ano bissexto", () => {
    expect(monthBounds("2028-02", "2028-02").to).toBe("2028-02-29");
    expect(monthBounds("2026-02", "2026-02").to).toBe("2026-02-28");
  });

  it("inverte meses informados fora de ordem", () => {
    expect(monthBounds("2026-05", "2026-02")).toEqual({ from: "2026-02-01", to: "2026-05-31" });
  });
});

describe("listMonths", () => {
  it("lista do mês mais recente ao mais antigo, atravessando a virada do ano", () => {
    expect(listMonths("2025-11-15", "2026-02-03")).toEqual(["2026-02", "2026-01", "2025-12", "2025-11"]);
  });

  it("devolve um único mês quando as datas são do mesmo mês", () => {
    expect(listMonths("2026-03-01", "2026-03-31")).toEqual(["2026-03"]);
  });
});

describe("formatação", () => {
  it("monthOf extrai o mês de uma data", () => {
    expect(monthOf("2026-03-15")).toBe("2026-03");
  });

  it("formatMonth gera rótulos curtos em português", () => {
    expect(formatMonth("2026-03")).toBe("mar/2026");
    expect(formatMonth("2026-12")).toBe("dez/2026");
  });
});
