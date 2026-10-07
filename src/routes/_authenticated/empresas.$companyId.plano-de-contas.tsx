import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDeleteDialog, countRows } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function CategoriesPage() {
  const { companyId } = Route.useParams();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("despesa");

  const categories = useQuery({
    queryKey: ["categories", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, code, name, kind")
        .eq("company_id", companyId)
        .order("code", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

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
        <CardContent className="py-6">
          <form
            className="grid gap-4 md:grid-cols-[160px_1fr_200px_auto] md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              createCategory.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="3.1.01" />
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
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Código</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="w-40">Tipo</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma conta cadastrada ainda.
                </TableCell>
              </TableRow>
            ) : (
              (categories.data ?? []).map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="num text-sm">{cat.code ?? "—"}</TableCell>
                  <TableCell className="text-sm">{cat.name}</TableCell>
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
