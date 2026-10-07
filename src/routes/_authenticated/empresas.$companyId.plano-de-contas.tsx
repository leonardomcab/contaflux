import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toCategoryPayload } from "@/lib/dominio-coa";
import { cn } from "@/lib/utils";
import { ChartOfAccountsImport, type ChartImport } from "@/components/chart-of-accounts-import";
import { ConfirmDeleteDialog, countRows } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export const Route = createFileRoute("/_authenticated/empresas/$companyId/plano-de-contas")({
  component: CategoriesPage,
});

type CategoryRow = {
  id: string;
  code: string | null;
  reduced_code: string | null;
  name: string;
  kind: string;
  is_synthetic: boolean;
  level: number | null;
};

/** Ordem numérica por segmento da classificação; contas sem classificação vão para o fim. */
function compareCategories(a: CategoryRow, b: CategoryRow): number {
  if (!a.code || !b.code) return a.code ? -1 : b.code ? 1 : a.name.localeCompare(b.name);
  const sa = a.code.split(".");
  const sb = b.code.split(".");
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    const pa = sa[i];
    const pb = sb[i];
    if (pa === undefined || pb === undefined) return pa === undefined ? -1 : 1;
    if (pa !== pb) {
      const diff = Number(pa) - Number(pb);
      return Number.isNaN(diff) ? pa.localeCompare(pb) : diff;
    }
  }
  return Number(a.reduced_code ?? 0) - Number(b.reduced_code ?? 0);
}

function CategoriesPage() {
  const { companyId } = Route.useParams();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("despesa");
  const [importOpen, setImportOpen] = useState(false);
  const [chartImport, setChartImport] = useState<ChartImport | null>(null);

  const categories = useQuery({
    queryKey: ["categories", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, code, reduced_code, name, kind, is_synthetic, level")
        .eq("company_id", companyId);
      if (error) throw error;
      return data;
    },
  });

  const sorted = useMemo(
    () => [...(categories.data ?? [])].sort(compareCategories),
    [categories.data],
  );

  const createCategory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("categories")
        .insert({ company_id: companyId, code: code || null, name, kind });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria criada");
      setCode("");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["categories", companyId] });
    },
    onError: (error: Error) => toast.error("Erro ao salvar", { description: error.message }),
  });

  const importChart = useMutation({
    mutationFn: async (value: ChartImport) => {
      const payload = toCategoryPayload(value.rows).map((row) => ({
        ...row,
        company_id: companyId,
      }));
      // Reimportar atualiza as contas pelo código reduzido do Domínio, sem duplicar.
      const { error } = await supabase
        .from("categories")
        .upsert(payload, { onConflict: "company_id,reduced_code" });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success("Plano de contas importado", { description: `${count} contas gravadas.` });
      setImportOpen(false);
      setChartImport(null);
      queryClient.invalidateQueries({ queryKey: ["categories", companyId] });
    },
    onError: (error: Error) => toast.error("Erro ao importar", { description: error.message }),
  });

  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida");
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["rules", companyId] });
      queryClient.invalidateQueries({ queryKey: ["categories", companyId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", companyId] });
    },
    onError: (error: Error) => toast.error("Erro ao remover", { description: error.message }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 py-6">
          <form
            className="grid gap-4 md:grid-cols-[160px_1fr_200px_auto] md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              createCategory.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="3.1.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome da conta</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Despesas com fornecedores"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={!name.trim() || createCategory.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </form>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Importar do Domínio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Classificação</TableHead>
              <TableHead className="w-20">Cód.</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="w-40">Tipo</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma conta cadastrada ainda.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="num text-sm">{cat.code ?? "—"}</TableCell>
                  <TableCell className="num text-sm text-muted-foreground">
                    {cat.reduced_code ?? "—"}
                  </TableCell>
                  <TableCell
                    className={cn("text-sm", cat.is_synthetic && "font-semibold")}
                    style={{ paddingLeft: `${0.5 + Math.max((cat.level ?? 1) - 1, 0) * 0.75}rem` }}
                  >
                    {cat.name}
                    {cat.is_synthetic ? (
                      <Badge variant="outline" className="ml-2 font-normal">
                        Sintética
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cat.kind}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${cat.name}`}
                      onClick={() => setToDelete({ id: cat.id, name: cat.name })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) setChartImport(null);
        }}
      >
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Importar plano de contas do Domínio</DialogTitle>
            <DialogDescription>
              Contas que já vieram do Domínio são atualizadas pelo código reduzido; as novas são
              incluídas. Contas cadastradas à mão não são alteradas.
            </DialogDescription>
          </DialogHeader>
          <ChartOfAccountsImport value={chartImport} onChange={setChartImport} />
          <DialogFooter>
            <Button
              onClick={() => chartImport && importChart.mutate(chartImport)}
              disabled={!chartImport || importChart.isPending}
            >
              {importChart.isPending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={`Excluir a conta "${toDelete?.name ?? ""}"?`}
        description="As regras que apontam para esta conta serão apagadas e os lançamentos classificados nela voltarão a ficar sem categoria."
        impactKey={["category", toDelete?.id]}
        loadImpact={async () => {
          const id = toDelete!.id;
          const head = { count: "exact", head: true } as const;
          const [rules, transactions] = await Promise.all([
            countRows(supabase.from("rules").select("id", head).eq("category_id", id)),
            countRows(supabase.from("transactions").select("id", head).eq("category_id", id)),
          ]);
          return [
            { label: "Regras apagadas", count: rules },
            { label: "Lançamentos que ficarão sem categoria", count: transactions },
          ];
        }}
        onConfirm={() => toDelete && removeCategory.mutate(toDelete.id)}
        pending={removeCategory.isPending}
      />
    </div>
  );
}
