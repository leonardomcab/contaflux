import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { listMonths, monthBounds, monthOf } from "@/lib/period";

const COMPANY_ROUTE = "/_authenticated/empresas/$companyId" as const;

export type CompanyPeriod = {
  /** Meses com lançamentos, do mais recente para o mais antigo. */
  months: string[];
  /** true enquanto a primeira/última data ainda está carregando. */
  loading: boolean;
  all: boolean;
  start: string | null;
  end: string | null;
  /** Limites de data para filtrar posted_at; null quando o filtro é "todos". */
  from: string | null;
  to: string | null;
  setRange: (start: string, end: string) => void;
  setAll: () => void;
};

export function useCompanyPeriod(companyId: string): CompanyPeriod {
  const search = useSearch({ from: COMPANY_ROUTE });
  const navigate = useNavigate({ from: "/empresas/$companyId" });

  const bounds = useQuery({
    queryKey: ["period-bounds", companyId],
    queryFn: async () => {
      const [first, last] = await Promise.all([
        supabase
          .from("transactions")
          .select("posted_at")
          .eq("company_id", companyId)
          .order("posted_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("transactions")
          .select("posted_at")
          .eq("company_id", companyId)
          .order("posted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (first.error) throw first.error;
      if (last.error) throw last.error;
      return { min: first.data?.posted_at ?? null, max: last.data?.posted_at ?? null };
    },
  });

  const min = bounds.data?.min ?? null;
  const max = bounds.data?.max ?? null;
  const months = min && max ? listMonths(min, max) : [];

  const all = search.todos === true;
  const latest = max ? monthOf(max) : null;
  let start = search.de ?? search.ate ?? latest;
  let end = search.ate ?? start;
  if (start && end && end < start) [start, end] = [end, start];

  const range = !all && start && end ? monthBounds(start, end) : null;

  const setRange = (nextStart: string, nextEnd: string) => {
    const [de, ate] = nextStart <= nextEnd ? [nextStart, nextEnd] : [nextEnd, nextStart];
    void navigate({
      search: (prev) => ({ ...prev, de, ate, todos: undefined }),
      replace: true,
    });
  };

  const setAll = () => {
    void navigate({
      search: (prev) => ({ ...prev, de: undefined, ate: undefined, todos: true }),
      replace: true,
    });
  };

  return {
    months,
    loading: bounds.isLoading,
    all,
    start: all ? null : start,
    end: all ? null : end,
    from: range?.from ?? null,
    to: range?.to ?? null,
    setRange,
    setAll,
  };
}
