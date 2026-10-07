import { describe, expect, it } from "vitest";
import { chunk, fetchAllPages } from "./fetch-all";

describe("fetchAllPages", () => {
  const rows = Array.from({ length: 2500 }, (_, i) => i);

  it("busca página por página até a última incompleta", async () => {
    const calls: [number, number][] = [];
    const result = await fetchAllPages(async (from, to) => {
      calls.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    });
    expect(result).toEqual(rows);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("faz uma requisição extra quando o total é múltiplo do tamanho da página", async () => {
    let calls = 0;
    const result = await fetchAllPages(async (from, to) => {
      calls += 1;
      return { data: rows.slice(0, 2000).slice(from, to + 1), error: null };
    });
    expect(result).toHaveLength(2000);
    expect(calls).toBe(3);
  });

  it("propaga o erro da consulta", async () => {
    await expect(fetchAllPages(async () => ({ data: null, error: new Error("falhou") }))).rejects.toThrow(
      "falhou",
    );
  });
});

describe("chunk", () => {
  it("divide em blocos do tamanho pedido", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});
