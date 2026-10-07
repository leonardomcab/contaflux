import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadFile, formatCurrency, toCsv } from "@/lib/format";
import { fetchAllPages } from "@/lib/fetch-all";
import { useCompanyPeriod } from "@/hooks/use-company-period";
import { PeriodFilter } from "@/components/period-filter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/empresas/$companyId/exportar")({
  component: ExportPage,
});

function ExportPage() {
  const { companyId } = Route.useParams();
  const period = useCompanyPeriod(companyId);
  const { from, to } = period;
  const [scope, setScope] = useState("classified");
  const [busy, setBusy] = useState(false);

  const summary = useQuery({
    queryKey: ["export-summary", companyId, from, to],
    enabled: !period.loading,
    queryFn: async () => {
      const rows = await fetchAllPages((rangeFrom, rangeTo) => {
        let query = supabase
          .from("transactions")
          .select("amount, category_id")
          .eq("company_id", companyId);
        if (from) query = query.gte("posted_at", from);
        if (to) query = query.lte("posted_at", to);
        return query.order("id").range(rangeFrom, rangeTo);
      });
      return {
        total: rows.length,
        pending: rows.filter((r) => !r.category_id).length,
        credit: rows.reduce((acc, r) => (Number(r.amount) > 0 ? acc + Number(r.amount) : acc), 0),
        debit: rows.reduce((acc, r) => (Number(r.amount) < 0 ? acc + Number(r.amount) : acc), 0),
      };
    },
  });

  async function exportCsv() {
    setBusy(true);
    try {
      const data = await fetchAllPages((rangeFrom, rangeTo) => {
        let query = supabase
          .from("transactions")
          .select(
            "posted_at, description, memo, amount, trn_type, classified_by, categories(code, name), bank_accounts(label)",
          )
          .eq("company_id", companyId);
        if (from) query = query.gte("posted_at", from);
        if (to) query = query.lte("posted_at", to);
        if (scope === "classified") query = query.not("category_id", "is", null);
        if (scope === "pending") query = query.is("category_id", null);
        return query.order("posted_at").order("id").range(rangeFrom, rangeTo);
      });

      if (data.length === 0) {
        toast.error("Nenhum lançamento no filtro escolhido");
        return;
      }

      const rows: (string | number | null)[][] = [
        ["Data", "Conta bancária", "Descrição", "Histórico", "Valor", "Tipo", "Conta contábil", "Classificação"],
        ...data.map((row) => [
          row.posted_at,
          row.bank_accounts?.label ?? "",
          row.description,
          row.memo ?? "",
          Number(row.amount).toFixed(2).replace(".", ","),
          Number(row.amount) >= 0 ? "Crédito" : "Débito",
          row.categories ? `${row.categories.code ?? ""} ${row.categories.name}`.trim() : "",
          row.classified_by === "rule" ? "Regra" : row.classified_by === "manual" ? "Manual" : "",
        ]),
      ];

      const suffix =
        period.start && period.end
          ? period.start === period.end
            ? period.start
            : `${period.start}_a_${period.end}`
          : "todos";
      downloadFile(`lancamentos_${suffix}.csv`, toCsv(rows));
      toast.success(`${data.length} lançamentos exportados`);
    } catch (error) {
      toast.error("Erro ao exportar", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportar lançamentos</CardTitle>
          <CardDescription>
            Gera um arquivo CSV (separado por ponto e vírgula) pronto para abrir no Excel ou importar
            no sistema contábil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <PeriodFilter period={period} />
            <div className="space-y-2">
              <Label>Incluir</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classified">Somente classificados</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Somente pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {summary.data ? (
            <div className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-4">
              <Stat label="No período" value={String(summary.data.total)} />
              <Stat label="Sem categoria" value={String(summary.data.pending)} />
              <Stat label="Entradas" value={formatCurrency(summary.data.credit)} />
              <Stat label="Saídas" value={formatCurrency(summary.data.debit)} />
            </div>
          ) : null}

          {summary.data && summary.data.pending > 0 && scope === "classified" ? (
            <p className="text-sm text-muted-foreground">
              {summary.data.pending} lançamento(s) ficam de fora por ainda não terem categoria.
            </p>
          ) : null}

          <Button onClick={exportCsv} disabled={busy || period.loading}>
            <Download className="mr-2 h-4 w-4" />
            {busy ? "Gerando..." : "Baixar CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="num mt-1 text-lg">{value}</p>
    </div>
  );
}
