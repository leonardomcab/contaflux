import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseMonth } from "@/lib/period";

export type CompanySearch = {
  de?: string | undefined;
  ate?: string | undefined;
  todos?: true | undefined;
};

export const Route = createFileRoute("/_authenticated/empresas/$companyId")({
  validateSearch: (search: Record<string, unknown>): CompanySearch => {
    const todos = search["todos"];
    return {
      de: parseMonth(search["de"]) ?? undefined,
      ate: parseMonth(search["ate"]) ?? undefined,
      todos: todos === true || todos === "true" || todos === 1 ? true : undefined,
    };
  },
  component: CompanyLayout,
});

function CompanyLayout() {
  const { companyId } = Route.useParams();

  const company = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, cnpj")
        .eq("id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{company.data?.name ?? "Carregando..."}</h1>
        {company.data?.cnpj ? (
          <p className="num mt-1 text-sm text-muted-foreground">{company.data.cnpj}</p>
        ) : null}
      </div>
      <Outlet />
    </div>
  );
}
