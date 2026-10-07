import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CompanyWizard } from "@/components/company-wizard/company-wizard";
import { ConfirmDeleteDialog, countRows } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/empresas/")({
  head: () => ({
    meta: [
      { title: "Empresas — Contaflux" },
      {
        name: "description",
        content: "Clientes do escritório com extratos importados no Contaflux.",
      },
      { property: "og:title", content: "Empresas — Contaflux" },
      {
        property: "og:description",
        content: "Clientes do escritório com extratos importados no Contaflux.",
      },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, cnpj, notes")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const removeCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa removida");
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: Error) => toast.error("Erro ao remover", { description: error.message }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha um cliente para importar extratos e classificar lançamentos.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova empresa
        </Button>
        <CompanyWizard open={open} onOpenChange={setOpen} />
      </div>

      {companies.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : companies.data && companies.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.data.map((company) => (
            <Card key={company.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">
                    <Link
                      to="/empresas/$companyId"
                      params={{ companyId: company.id }}
                      className="hover:underline"
                    >
                      {company.name}
                    </Link>
                  </CardTitle>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {company.cnpj ?? "sem CNPJ"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${company.name}`}
                  onClick={() => setToDelete({ id: company.id, name: company.name })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{company.notes ?? "—"}</p>
                <Button asChild variant="secondary" size="sm" className="mt-4">
                  <Link to="/empresas/$companyId" params={{ companyId: company.id }}>
                    Abrir
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma empresa cadastrada. Comece criando o primeiro cliente.
            </p>
          </CardContent>
        </Card>
      )}

      <ConfirmDeleteDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={`Excluir ${toDelete?.name ?? "empresa"}?`}
        description="Todos os dados desta empresa serão apagados definitivamente. Esta ação não pode ser desfeita."
        impactKey={["company", toDelete?.id]}
        loadImpact={async () => {
          const id = toDelete!.id;
          const head = { count: "exact", head: true } as const;
          const [transactions, imports, accounts, categories, rules] = await Promise.all([
            countRows(supabase.from("transactions").select("id", head).eq("company_id", id)),
            countRows(supabase.from("imports").select("id", head).eq("company_id", id)),
            countRows(supabase.from("bank_accounts").select("id", head).eq("company_id", id)),
            countRows(supabase.from("categories").select("id", head).eq("company_id", id)),
            countRows(supabase.from("rules").select("id", head).eq("company_id", id)),
          ]);
          return [
            { label: "Lançamentos", count: transactions },
            { label: "Importações", count: imports },
            { label: "Contas bancárias", count: accounts },
            { label: "Contas do plano de contas", count: categories },
            { label: "Regras", count: rules },
          ];
        }}
        onConfirm={() => toDelete && removeCompany.mutate(toDelete.id)}
        pending={removeCompany.isPending}
      />
    </div>
  );
}
