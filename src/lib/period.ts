const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Retorna o mês no formato AAAA-MM se for válido, senão null. */
export function parseMonth(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return MONTH_PATTERN.test(value) ? value : null;
}

/** Extrai o mês AAAA-MM de uma data AAAA-MM-DD. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

function splitMonth(month: string): [number, number] {
  return [Number(month.slice(0, 4)), Number(month.slice(5, 7))];
}

function lastDayOf(month: string): number {
  const [year, mon] = splitMonth(month);
  return new Date(Date.UTC(year, mon, 0)).getUTCDate();
}

/** Primeiro dia do mês inicial e último dia do mês final; inverte se vierem trocados. */
export function monthBounds(start: string, end: string): { from: string; to: string } {
  const [first, last] = start <= end ? [start, end] : [end, start];
  return {
    from: `${first}-01`,
    to: `${last}-${String(lastDayOf(last)).padStart(2, "0")}`,
  };
}

/** Todos os meses entre duas datas (inclusive), do mais recente para o mais antigo. */
export function listMonths(minDate: string, maxDate: string): string[] {
  const first = monthOf(minDate <= maxDate ? minDate : maxDate);
  const last = monthOf(minDate <= maxDate ? maxDate : minDate);
  const months: string[] = [];
  let [year, month] = splitMonth(last);
  for (;;) {
    const current = `${year}-${String(month).padStart(2, "0")}`;
    months.push(current);
    if (current <= first) break;
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return months;
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

/** "2026-03" -> "mar/2026" */
export function formatMonth(month: string): string {
  const [year, mon] = splitMonth(month);
  const name = monthFormatter.format(new Date(Date.UTC(year, mon - 1, 1))).replace(".", "");
  return `${name}/${year}`;
}
