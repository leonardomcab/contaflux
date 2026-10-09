import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadFile, formatCurrency, toCsv } from "@/lib/format";
import { fetchAllPages } from "@/lib/fetch-all";
import {
  DOMINIO_ISSUE_LABELS,
  buildDominioTxt,
  dominioFileName,
  normalizeCnpj,
  toDominioEntries,
  type DominioIssue,
  type DominioIssueKind,
} from "@/lib/dominio-export";
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

const NO_LEDGER = "__none__";
const ISSUE_EXAMPLES = 5;

function ExportPage() {
  const { companyId } = Route.useParams();
  const queryClient = useQueryClient();
  const period = useCompanyPeriod(companyId);
  const { from, to } = period;
  const [format, setFormat] = useState<"dominio" | "csv">("dominio");
  const [scope, setScope] = useState("classified");
  const [busy, setBusy] = useState(false);
  const isDominio = format === "dominio";

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

  const company = useQuery({
    queryKey: ["company", companyId, "export"],
    enabled: isDominio,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("name, cnpj")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const bankAccounts = useQuery({
    queryKey: ["accounts", companyId, "ledger"],
    enabled: isDominio,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select(
          "id, label, ledger_category_id, ledger:categories!bank_accounts_ledger_category_id_fkey(name, reduced_code, is_synthetic)",
        )
        .eq("company_id", companyId)
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  const ledgerOptions = useQuery({
    queryKey: ["categories", companyId, "analytic-ledger"],
    enabled: isDominio,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, code, reduced_code, name")
        .eq("company_id", companyId)
        .eq("is_synthetic", false)
        .not("reduced_code", "is", null)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const dominioTransactions = useQuery({
    queryKey: ["export-dominio", companyId, from, to],
    enabled: isDominio && !period.loading,
    queryFn: () =>
      fetchAllPages((rangeFrom, rangeTo) => {
        let query = supabase
          .from("transactions")
          .select(
            "posted_at, description, memo, amount, account_id, category:categories(name, reduced_code, is_synthetic)",
          )
          .eq("company_id", companyId)
          .not("category_id", "is", null);
        if (from) query = query.gte("posted_at", from);
        if (to) query = query.lte("posted_at", to);
        return query.order("posted_at").order("created_at").order("id").range(rangeFrom, rangeTo);
      }),
  });

  const dominio = useMemo(() => {
    if (!company.data || !bankAccounts.data || !dominioTransactions.data) return null;
    return toDominioEntries(
      company.data.cnpj,
      dominioTransactions.data.map((row) => ({ ...row, amount: Number(row.amount) })),
      bankAccounts.data,
    );
  }, [company.data, bankAccounts.data, dominioTransactions.data]);

  const setLedger = useMutation({
    mutationFn: async ({ id, ledgerId }: { id: string; ledgerId: string | null }) => {
      const { error } = await supabase
        .from("bank_accounts")
        .update({ ledger_category_id: ledgerId })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", companyId] });
    },
    onError: (error: Error) => toast.error("Erro ao salvar", { description: error.message }),
  });

  function exportDominio() {
    const cnpj = normalizeCnpj(company.data?.cnpj);
    if (!dominio || !company.data || !cnpj) return;
    if (dominio.entries.length === 0) {
      toast.error("Nenhum lançamento classificado no período");
      return;
    }
    downloadFile(
      dominioFileName(company.data.name, period.start, period.end),
      buildDominioTxt(cnpj, dominio.entries),
      "text/plain;charset=utf-8",
      { bom: false },
    );
    toast.success(`${dominio.entries.length} lançamentos exportados`);
  }

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
        [
          "Data",
          "Conta bancária",
          "Descrição",
          "Histórico",
          "Valor",
          "Tipo",
          "Conta contábil",
          "Classificação",
        ],
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

  const dominioLoading =
    company.isLoading || bankAccounts.isLoading || dominioTransactions.isLoading;
  const dominioError = company.error ?? bankAccounts.error ?? dominioTransactions.error;
  const issues = dominio?.issues ?? [];
  const effectiveScope = isDominio ? "classified" : scope;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportar lançamentos</CardTitle>
          <CardDescription>
            {isDominio
              ? "Gera o arquivo TXT de lançamentos contábeis no leiaute de importação do Domínio."
              : "Gera um arquivo CSV (separado por ponto e vírgula) pronto para abrir no Excel."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as "dominio" | "csv")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dominio">TXT Domínio</SelectItem>
                  <SelectItem value="csv">CSV (planilha)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PeriodFilter period={period} />
            <div className="space-y-2">
              <Label>Incluir</Label>
              <Select value={effectiveScope} onValueChange={setScope} disabled={isDominio}>
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

          {summary.data && summary.data.pending > 0 && effectiveScope === "classified" ? (
            <p className="text-sm text-muted-foreground">
              {summary.data.pending} lançamento(s) ficam de fora por ainda não terem categoria.
            </p>
          ) : null}

          {isDominio ? (
            <>
              {dominioError ? (
                <p className="text-sm text-destructive">
                  Erro ao preparar o arquivo: {dominioError.message}
                </p>
              ) : null}
              <DominioIssues issues={issues} />
              <Button
                onClick={exportDominio}
                disabled={period.loading || dominioLoading || !dominio || issues.length > 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {dominioLoading ? "Preparando..." : "Baixar TXT"}
              </Button>
            </>
          ) : (
            <Button onClick={exportCsv} disabled={busy || period.loading}>
              <Download className="mr-2 h-4 w-4" />
              {busy ? "Gerando..." : "Baixar CSV"}
            </Button>
          )}
        </CardContent>
      </Card>

      {isDominio ? (
        <Card>
          <CardHeader>
            <CardTitle>Contas bancárias no Domínio</CardTitle>
            <CardDescription>
              Conta do plano que representa cada conta bancária. Ela é a contrapartida dos
              lançamentos: debitada nas entradas e creditada nas saídas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankAccounts.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta bancária cadastrada.</p>
            ) : null}
            {ledgerOptions.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma conta analítica com código reduzido. Importe o plano de contas do Domínio em
                "Plano de contas".
              </p>
            ) : null}
            {bankAccounts.data?.map((bank) => (
              <div key={bank.id} className="grid gap-2 md:grid-cols-[1fr_2fr] md:items-center">
                <Label htmlFor={`ledger-${bank.id}`}>{bank.label}</Label>
                <Select
                  value={bank.ledger_category_id ?? NO_LEDGER}
                  onValueChange={(value) =>
                    setLedger.mutate({
                      id: bank.id,
                      ledgerId: value === NO_LEDGER ? null : value,
                    })
                  }
                  disabled={setLedger.isPending}
                >
                  <SelectTrigger id={`ledger-${bank.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LEDGER}>Sem conta contábil</SelectItem>
                    {ledgerOptions.data?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.reduced_code} · {cat.code ? `${cat.code} ` : ""}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function DominioIssues({ issues }: { issues: DominioIssue[] }) {
  if (issues.length === 0) return null;
  const groups = new Map<DominioIssueKind, string[]>();
  for (const issue of issues) {
    groups.set(issue.kind, [...(groups.get(issue.kind) ?? []), issue.detail]);
  }
  return (
    <div className="space-y-3 rounded-md border border-destructive/50 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Resolva as pendências abaixo para gerar o arquivo
      </p>
      {[...groups].map(([kind, details]) => (
        <div key={kind} className="text-sm">
          <p className="font-medium">
            {DOMINIO_ISSUE_LABELS[kind]} ({details.length})
          </p>
          <ul className="ml-5 list-disc text-muted-foreground">
            {details.slice(0, ISSUE_EXAMPLES).map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
            {details.length > ISSUE_EXAMPLES ? (
              <li>e mais {details.length - ISSUE_EXAMPLES}</li>
            ) : null}
          </ul>
        </div>
      ))}
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
