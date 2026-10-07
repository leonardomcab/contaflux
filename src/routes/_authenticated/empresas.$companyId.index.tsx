import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { fetchAllPages } from "@/lib/fetch-all";
import { useCompanyPeriod } from "@/hooks/use-company-period";
import { PeriodFilter } from "@/components/period-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/empresas/$companyId/")({
  component: TransactionsPage,
});

const UNCATEGORIZED = "__none__";
const PAGE_SIZE = 100;

function TransactionsPage() {
  const { companyId } = Route.useParams();
  const queryClient = useQueryClient();
  const period = useCompanyPeriod(companyId);
  const { from, to } = period;

  const [status, setStatus] = useState("all");
  const [accountId, setAccountId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");

  const filterKey = [from, to, status, accountId, search.trim()] as const;
  useEffect(() => {
    setPage(0);
    setSelected([]);
  }, [from, to, status, accountId, search]);

  const accounts = useQuery({
    queryKey: ["accounts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, label, bank_id, account_number")
        .eq("company_id", companyId)
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  const categories = useQuery({
    queryKey: ["categories", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, code, name, kind")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const transactions = useQuery({
    queryKey: ["transactions", companyId, "page", ...filterKey, page],
    enabled: !period.loading,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("id, posted_at, description, memo, amount, category_id, classified_by, account_id", {
          count: "exact",
        })
        .eq("company_id", companyId);

      if (from) query = query.gte("posted_at", from);
      if (to) query = query.lte("posted_at", to);
      if (accountId !== "all") query = query.eq("account_id", accountId);
      if (status === "pending") query = query.is("category_id", null);
      if (status === "done") query = query.not("category_id", "is", null);
      if (search.trim()) query = query.ilike("description", `%${search.trim()}%`);

      const { data, error, count } = await query
        .order("posted_at", { ascending: false })
        .order("id")
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalsQuery = useQuery({
    queryKey: ["transactions", companyId, "totals", ...filterKey],
    enabled: !period.loading,
    queryFn: async () => {
      const all = await fetchAllPages((rangeFrom, rangeTo) => {
        let query = supabase
          .from("transactions")
          .select("amount, category_id")
          .eq("company_id", companyId);
        if (from) query = query.gte("posted_at", from);
        if (to) query = query.lte("posted_at", to);
        if (accountId !== "all") query = query.eq("account_id", accountId);
        if (status === "pending") query = query.is("category_id", null);
        if (status === "done") query = query.not("category_id", "is", null);
        if (search.trim()) query = query.ilike("description", `%${search.trim()}%`);
        return query.order("id").range(rangeFrom, rangeTo);
      });
      let credit = 0;
      let debit = 0;
      let pending = 0;
      for (const row of all) {
        const amount = Number(row.amount);
        if (amount >= 0) credit += amount;
        else debit += amount;
        if (!row.category_id) pending += 1;
      }
      return { credit, debit, pending, count: all.length };
    },
  });

  const categoryName = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories.data ?? []) {
      map.set(cat.id, cat.code ? `${cat.code} · ${cat.name}` : cat.name);
    }
    return map;
  }, [categories.data]);

  const setCategory = useMutation({
    mutationFn: async ({ ids, categoryId }: { ids: string[]; categoryId: string | null }) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          category_id: categoryId,
          classified_by: categoryId ? "manual" : null,
          rule_id: null,
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.ids.length > 1
          ? `${variables.ids.length} lançamentos atualizados`
          : "Lançamento atualizado",
      );
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["transactions", companyId] });
    },
    onError: (error: Error) => toast.error("Erro ao classificar", { description: error.message }),
  });

  const rows = transactions.data?.rows ?? [];
  const totalCount = transactions.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const totals = totalsQuery.data;
  const loadingTotals = totalsQuery.isLoading || period.loading;

  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Lançamentos" value={loadingTotals ? "…" : String(totals?.count ?? 0)} />
        <SummaryCard
          label="Entradas"
          value={loadingTotals ? "…" : formatCurrency(totals?.credit ?? 0)}
          tone="credit"
        />
        <SummaryCard
          label="Saídas"
          value={loadingTotals ? "…" : formatCurrency(totals?.debit ?? 0)}
          tone="debit"
        />
        <SummaryCard label="Sem categoria" value={loadingTotals ? "…" : String(totals?.pending ?? 0)} />
      </div>

      <Card>
        <CardContent className="grid gap-4 py-6 md:grid-cols-5">
          <PeriodFilter period={period} />
          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(accounts.data ?? []).map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Situação</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Sem categoria</SelectItem>
                <SelectItem value="done">Classificados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">Descrição</Label>
            <Input
              id="search"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">{selected.length} selecionado(s)</span>
          <Select value={bulkCategory} onValueChange={setBulkCategory}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Aplicar categoria..." />
            </SelectTrigger>
            <SelectContent>
              {(categories.data ?? []).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {categoryName.get(cat.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!bulkCategory || setCategory.isPending}
            onClick={() => setCategory.mutate({ ids: selected, categoryId: bulkCategory })}
          >
            Aplicar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCategory.mutate({ ids: selected, categoryId: null })}
          >
            Limpar categoria
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Cancelar
          </Button>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  aria-label="Selecionar todos desta página"
                  onCheckedChange={(checked) =>
                    setSelected(checked ? rows.map((row) => row.id) : [])
                  }
                />
              </TableHead>
              <TableHead className="w-28">Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-36 text-right">Valor</TableHead>
              <TableHead className="w-72">Categoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.isLoading || period.loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Carregando lançamentos...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum lançamento encontrado. Importe um arquivo OFX para começar.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const amount = Number(row.amount);
                return (
                  <TableRow key={row.id} className={row.category_id ? undefined : "bg-accent/30"}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(row.id)}
                        aria-label="Selecionar lançamento"
                        onCheckedChange={(checked) =>
                          setSelected((prev) =>
                            checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="num text-sm">{formatDate(row.posted_at)}</TableCell>
                    <TableCell>
                      <p className="text-sm">{row.description}</p>
                      {row.memo && row.memo !== row.description ? (
                        <p className="text-xs text-muted-foreground">{row.memo}</p>
                      ) : null}
                    </TableCell>
                    <TableCell
                      className={`num text-right text-sm ${amount >= 0 ? "text-credit" : "text-debit"}`}
                    >
                      {formatCurrency(amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={row.category_id ?? UNCATEGORIZED}
                          onValueChange={(value) =>
                            setCategory.mutate({
                              ids: [row.id],
                              categoryId: value === UNCATEGORIZED ? null : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Sem categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNCATEGORIZED}>Sem categoria</SelectItem>
                            {(categories.data ?? []).map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {categoryName.get(cat.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {row.classified_by === "rule" ? (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            regra
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {totalCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span className="num">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 0 || transactions.isFetching}
                onClick={() => {
                  setPage((p) => p - 1);
                  setSelected([]);
                }}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <span className="num">
                {page + 1} / {pageCount}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={page + 1 >= pageCount || transactions.isFetching}
                onClick={() => {
                  setPage((p) => p + 1);
                  setSelected([]);
                }}
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "credit" | "debit";
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p
          className={`num mt-2 text-xl font-medium ${
            tone === "credit" ? "text-credit" : tone === "debit" ? "text-debit" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
