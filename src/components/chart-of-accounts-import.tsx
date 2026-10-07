import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileUp, X } from "lucide-react";
import {
  buildImportRows,
  normalizeText,
  parseDominioChartOfAccounts,
  type CategoryKind,
  type DominioChart,
  type ImportRow,
} from "@/lib/dominio-coa";
import { extractPdfLines } from "@/lib/pdf-text";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ChartImport = { fileName: string; chart: DominioChart; rows: ImportRow[] };

const KIND_LABELS: Record<CategoryKind, string> = {
  despesa: "Despesa",
  receita: "Receita",
  transferencia: "Transferência",
};

export function ChartOfAccountsImport({
  value,
  onChange,
}: {
  value: ChartImport | null;
  onChange: (value: ChartImport | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [filter, setFilter] = useState("");

  async function handleFile(file: File) {
    setReading(true);
    try {
      const chart = parseDominioChartOfAccounts(await extractPdfLines(await file.arrayBuffer()));
      const rows = buildImportRows(chart);
      if (rows.length === 0) {
        toast.error("Nenhuma conta encontrada", {
          description: "Confira se o arquivo é o relatório Plano de Contas exportado pelo Domínio.",
        });
        return;
      }
      setFilter("");
      onChange({ fileName: file.name, chart, rows });
    } catch (error) {
      toast.error("Não foi possível ler o PDF", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const visibleRows = useMemo(() => {
    if (!value) return [];
    const term = normalizeText(filter);
    if (!term) return value.rows;
    return value.rows.filter(
      (row) =>
        normalizeText(row.name || row.description).includes(term) ||
        row.classification.startsWith(term) ||
        row.reducedCode === term,
    );
  }, [value, filter]);

  if (!value) {
    return (
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
          {reading
            ? "Lendo o PDF..."
            : "Arraste o PDF do plano de contas do Domínio aqui ou clique para escolher"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={reading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>
    );
  }

  const { chart, rows } = value;
  const selectedCount = rows.filter((row) => row.selected && row.name.trim()).length;
  const blankCount = rows.filter((row) => row.blank).length;
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => row.selected);

  function updateRows(codes: Set<string>, patch: Partial<ImportRow>) {
    if (!value) return;
    onChange({
      ...value,
      rows: value.rows.map((row) => (codes.has(row.reducedCode) ? { ...row, ...patch } : row)),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          <span className="font-medium">{value.fileName}</span>
          <span className="text-muted-foreground">
            {" "}
            · {rows.length} contas lidas · {selectedCount} serão importadas
          </span>
        </p>
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
          <X className="mr-1 h-4 w-4" />
          Trocar arquivo
        </Button>
      </div>

      {chart.declaredTotal !== null && chart.declaredTotal !== rows.length ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            O rodapé do PDF informa {chart.declaredTotal} contas, mas foram lidas {rows.length}.
            Confira se alguma página ficou de fora.
          </AlertDescription>
        </Alert>
      ) : null}
      {blankCount > 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {blankCount} {blankCount === 1 ? "conta veio" : "contas vieram"} sem descrição e{" "}
            {blankCount === 1 ? "ficou desmarcada" : "ficaram desmarcadas"}. Para importar, marque e
            digite um nome.
          </AlertDescription>
        </Alert>
      ) : null}

      <Input
        placeholder="Filtrar por nome, classificação ou código"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="max-h-[45vh] overflow-auto rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Marcar todas as contas visíveis"
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) =>
                    updateRows(new Set(visibleRows.map((row) => row.reducedCode)), {
                      selected: checked === true,
                    })
                  }
                />
              </TableHead>
              <TableHead className="w-16">Cód.</TableHead>
              <TableHead className="w-36">Classificação</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-10">T</TableHead>
              <TableHead className="w-40">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow
                key={row.reducedCode}
                className={cn(row.blank && "bg-accent/30", !row.selected && "opacity-60")}
              >
                <TableCell>
                  <Checkbox
                    aria-label={`Importar a conta ${row.reducedCode}`}
                    checked={row.selected}
                    onCheckedChange={(checked) =>
                      updateRows(new Set([row.reducedCode]), { selected: checked === true })
                    }
                  />
                </TableCell>
                <TableCell className="num text-xs">{row.reducedCode}</TableCell>
                <TableCell className="num text-xs">{row.classification}</TableCell>
                <TableCell
                  className={cn("text-sm", row.isSynthetic && "font-semibold")}
                  style={{ paddingLeft: `${0.5 + (row.level - 1) * 0.75}rem` }}
                >
                  {row.blank ? (
                    <Input
                      className="h-8"
                      placeholder="Sem descrição no PDF; digite um nome"
                      value={row.name}
                      onChange={(e) =>
                        updateRows(new Set([row.reducedCode]), {
                          name: e.target.value,
                          selected: e.target.value.trim() !== "" || row.selected,
                        })
                      }
                    />
                  ) : (
                    row.name
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.isSynthetic ? "S" : "A"}
                </TableCell>
                <TableCell>
                  <select
                    aria-label={`Tipo da conta ${row.reducedCode}`}
                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={row.kind}
                    onChange={(e) =>
                      updateRows(new Set([row.reducedCode]), {
                        kind: e.target.value as CategoryKind,
                      })
                    }
                  >
                    {Object.entries(KIND_LABELS).map(([kind, label]) => (
                      <option key={kind} value={kind}>
                        {label}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
