import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseOfx, type OfxStatement } from "@/lib/ofx";
import { findCategoryForTransaction, type ClassificationRule } from "@/lib/rules";
import { formatCurrency, formatDate } from "@/lib/format";
import { monthOf } from "@/lib/period";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/empresas/$companyId/importar")({
  component: ImportPage,
});

function ImportPage() {
  const { companyId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [statement, setStatement] = useState<OfxStatement | null>(null);
  const [fileName, setFileName] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const imports = useQuery({
    queryKey: ["imports", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imports")
        .select("id, file_name, period_start, period_end, inserted_count, duplicate_count, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  async function handleFile(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseOfx(buffer);
      setStatement(parsed);
      setFileName(file.name);
      setAccountLabel(
        parsed.accountNumber
          ? `Conta ${parsed.accountNumber}${parsed.bankId ? ` · banco ${parsed.bankId}` : ""}`
          : file.name.replace(/\.ofx$/i, ""),
      );
    } catch (error) {
      toast.error("Não foi possível ler o arquivo", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function confirmImport() {
    if (!statement) return;
    setSaving(true);
    try {
      const rulesResult = await supabase
        .from("rules")
        .select("id, category_id, match_type, pattern, amount_sign, min_amount, max_amount, priority, active")
        .eq("company_id", companyId)
        .eq("active", true);
      if (rulesResult.error) throw rulesResult.error;
      const rules = (rulesResult.data ?? []) as ClassificationRule[];

      const payload = statement.transactions.map((t) => {
        const match = findCategoryForTransaction(rules, {
          description: t.description,
          memo: t.memo,
          amount: t.amount,
        });
        return {
          fitid: t.fitid,
          posted_at: t.postedAt,
          amount: t.amount,
          trn_type: t.trnType,
          description: t.description,
          memo: t.memo,
          check_number: t.checkNumber,
          category_id: match?.categoryId ?? null,
          rule_id: match?.ruleId ?? null,
          classified_by: match ? "rule" : null,
        };
      });

      const { data, error } = await supabase.rpc("import_statement", {
        p_company_id: companyId,
        p_bank_id: statement.bankId,
        p_account_number: statement.accountNumber,
        p_account_label: accountLabel || fileName,
        p_file_name: fileName,
        p_period_start: statement.periodStart,
        p_period_end: statement.periodEnd,
        p_transactions: payload,
      });
      if (error) throw error;
      const result = data as { inserted: number; duplicates: number };

      toast.success("Extrato importado", {
        description: `${result.inserted} novos lançamentos, ${result.duplicates} repetidos ignorados.`,
      });
      setStatement(null);
      setFileName("");
      if (inputRef.current) inputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["imports", companyId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", companyId] });
      queryClient.invalidateQueries({ queryKey: ["accounts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["period-bounds", companyId] });
      queryClient.invalidateQueries({ queryKey: ["export-summary", companyId] });
      navigate({
        to: "/empresas/$companyId",
        params: { companyId },
        search:
          statement.periodStart && statement.periodEnd
            ? { de: monthOf(statement.periodStart), ate: monthOf(statement.periodEnd) }
            : {},
      });
    } catch (error) {
      toast.error("Erro ao importar", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar extrato OFX</CardTitle>
          <CardDescription>
            Selecione o arquivo gerado pelo banco. Lançamentos já importados são ignorados
            automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border bg-muted/40 px-6 py-12 text-center transition-colors hover:border-primary/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
          >
            <FileUp className="h-7 w-7 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Arraste o arquivo .ofx aqui ou clique para escolher
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".ofx,.OFX,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>

          {statement ? (
            <div className="space-y-4 rounded-md border border-border p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Info label="Arquivo" value={fileName} />
                <Info
                  label="Período"
                  value={`${formatDate(statement.periodStart)} — ${formatDate(statement.periodEnd)}`}
                />
                <Info label="Lançamentos" value={String(statement.transactions.length)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-label">Apelido da conta</Label>
                <Input
                  id="account-label"
                  value={accountLabel}
                  onChange={(e) => setAccountLabel(e.target.value)}
                />
              </div>
              <div className="max-h-72 overflow-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-32 text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement.transactions.slice(0, 50).map((t) => (
                      <TableRow key={t.fitid}>
                        <TableCell className="num text-sm">{formatDate(t.postedAt)}</TableCell>
                        <TableCell className="text-sm">{t.description}</TableCell>
                        <TableCell
                          className={`num text-right text-sm ${t.amount >= 0 ? "text-credit" : "text-debit"}`}
                        >
                          {formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Button onClick={confirmImport} disabled={saving}>
                  <Upload className="mr-2 h-4 w-4" />
                  {saving ? "Importando..." : "Confirmar importação"}
                </Button>
                <Button variant="ghost" onClick={() => setStatement(null)} disabled={saving}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Importações recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead className="w-56">Período</TableHead>
                <TableHead className="w-28 text-right">Novos</TableHead>
                <TableHead className="w-28 text-right">Repetidos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(imports.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma importação ainda.
                  </TableCell>
                </TableRow>
              ) : (
                (imports.data ?? []).map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="text-sm">{imp.file_name}</TableCell>
                    <TableCell className="num text-sm">
                      {formatDate(imp.period_start)} — {formatDate(imp.period_end)}
                    </TableCell>
                    <TableCell className="num text-right text-sm">{imp.inserted_count}</TableCell>
                    <TableCell className="num text-right text-sm text-muted-foreground">
                      {imp.duplicate_count}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="num mt-1 text-sm">{value}</p>
    </div>
  );
}
