import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AMOUNT_SIGNS,
  MATCH_TYPES,
  findCategoryForTransaction,
  validateRule,
  type ClassificationRule,
} from "@/lib/rules";
import { chunk, fetchAllPages } from "@/lib/fetch-all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export const Route = createFileRoute("/_authenticated/empresas/$companyId/regras")({
  component: RulesPage,
});

function RulesPage() {
  const { companyId } = Route.useParams();
  const queryClient = useQueryClient();

  const [pattern, setPattern] = useState("");
  const [matchType, setMatchType] = useState("contains");
  const [amountSign, setAmountSign] = useState("any");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("100");
  const [reprocessing, setReprocessing] = useState(false);

  const categories = useQuery({
    queryKey: ["categories", companyId, "analytic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, code, name, kind")
        .eq("company_id", companyId)
        .eq("is_synthetic", false)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const rules = useQuery({
    queryKey: ["rules", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rules")
        .select(
          "id, category_id, match_type, pattern, amount_sign, min_amount, max_amount, priority, active",
        )
        .eq("company_id", companyId)
        .order("priority");
      if (error) throw error;
      return data;
    },
  });

  const createRule = useMutation({
    mutationFn: async () => {
      const rule = {
        match_type: matchType,
        pattern: pattern.trim(),
        amount_sign: amountSign,
        min_amount: minAmount ? Number(minAmount) : null,
        max_amount: maxAmount ? Number(maxAmount) : null,
      };
      const invalid = validateRule(rule);
      if (invalid) throw new Error(invalid);
      const { error } = await supabase.from("rules").insert({
        ...rule,
        company_id: companyId,
        category_id: categoryId,
        priority: Number(priority) || 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra criada");
      setPattern("");
      setMinAmount("");
      setMaxAmount("");
      queryClient.invalidateQueries({ queryKey: ["rules", companyId] });
    },
    onError: (error: Error) => toast.error("Erro ao salvar", { description: error.message }),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("rules").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules", companyId] }),
  });

  const removeRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra removida");
      queryClient.invalidateQueries({ queryKey: ["rules", companyId] });
    },
  });

  async function reprocess(onlyPending: boolean) {
    setReprocessing(true);
    try {
      const activeRules = ((rules.data ?? []) as ClassificationRule[]).filter((r) => r.active);
      if (activeRules.length === 0) {
        toast.error("Nenhuma regra ativa");
        return;
      }

      const data = await fetchAllPages((from, to) => {
        let query = supabase
          .from("transactions")
          .select("id, description, memo, amount, category_id, classified_by")
          .eq("company_id", companyId);
        if (onlyPending) query = query.is("category_id", null);
        else query = query.or("category_id.is.null,classified_by.eq.rule");
        return query.order("id").range(from, to);
      });

      const groups = new Map<string, { categoryId: string; ruleId: string; ids: string[] }>();
      for (const tx of data) {
        const match = findCategoryForTransaction(activeRules, {
          description: tx.description,
          memo: tx.memo,
          amount: Number(tx.amount),
        });
        if (!match || match.categoryId === tx.category_id) continue;
        const key = `${match.categoryId}:${match.ruleId}`;
        const group = groups.get(key) ?? { ...match, ids: [] };
        group.ids.push(tx.id);
        groups.set(key, group);
      }

      let updated = 0;
      for (const group of groups.values()) {
        for (const ids of chunk(group.ids, 200)) {
          const result = await supabase
            .from("transactions")
            .update({
              category_id: group.categoryId,
              rule_id: group.ruleId,
              classified_by: "rule",
            })
            .in("id", ids);
          if (result.error) throw result.error;
          updated += ids.length;
        }
      }

      toast.success(`${updated} lançamento(s) reclassificado(s)`);
      queryClient.invalidateQueries({ queryKey: ["transactions", companyId] });
    } catch (error) {
      toast.error("Erro ao reprocessar", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setReprocessing(false);
    }
  }

  const categoryLabel = (id: string) => {
    const cat = (categories.data ?? []).find((c) => c.id === id);
    if (!cat) return "—";
    return cat.code ? `${cat.code} · ${cat.name}` : cat.name;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova regra</CardTitle>
          <CardDescription>
            Regras são aplicadas na importação, da menor para a maior prioridade. A primeira que
            combinar define a categoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              createRule.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Comparação</Label>
              <Select value={matchType} onValueChange={setMatchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="pattern">Texto procurado na descrição</Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="TARIFA"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de valor</Label>
              <Select value={amountSign} onValueChange={setAmountSign}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMOUNT_SIGNS.map((sign) => (
                    <SelectItem key={sign.value} value={sign.value}>
                      {sign.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min">Valor mínimo</Label>
              <Input
                id="min"
                type="number"
                step="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Valor máximo</Label>
              <Input
                id="max"
                type="number"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma conta do plano" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {categoryLabel(cat.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>
            <div className="lg:col-span-3">
              <Button type="submit" disabled={!categoryId || createRule.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                Criar regra
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => reprocess(true)} disabled={reprocessing}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Aplicar nos pendentes
        </Button>
        <Button variant="outline" onClick={() => reprocess(false)} disabled={reprocessing}>
          Reprocessar tudo (mantém ajustes manuais)
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Ordem</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead className="w-64">Categoria</TableHead>
              <TableHead className="w-24">Ativa</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rules.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma regra cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              (rules.data ?? []).map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="num text-sm">{rule.priority}</TableCell>
                  <TableCell className="text-sm">
                    {MATCH_TYPES.find((t) => t.value === rule.match_type)?.label ?? rule.match_type}{" "}
                    <span className="font-medium">“{rule.pattern}”</span>
                    <span className="text-muted-foreground">
                      {rule.amount_sign !== "any"
                        ? ` · ${AMOUNT_SIGNS.find((s) => s.value === rule.amount_sign)?.label}`
                        : ""}
                      {rule.min_amount ? ` · min ${rule.min_amount}` : ""}
                      {rule.max_amount ? ` · max ${rule.max_amount}` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{categoryLabel(rule.category_id)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.active}
                      onCheckedChange={(checked) =>
                        toggleRule.mutate({ id: rule.id, active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover regra"
                      onClick={() => removeRule.mutate(rule.id)}
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
    </div>
  );
}
