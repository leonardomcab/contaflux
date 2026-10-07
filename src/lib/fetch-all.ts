type PageResult<T> = { data: T[] | null; error: unknown };

/**
 * Busca todas as linhas em páginas, contornando o limite de linhas por requisição do PostgREST.
 * A consulta passada precisa ter ordenação estável (ex.: `.order("id")`), senão páginas podem
 * repetir ou pular linhas.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
