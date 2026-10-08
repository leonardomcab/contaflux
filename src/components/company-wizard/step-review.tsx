import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import type { BankAccountDraft } from "@/lib/company-setup";
import type { ChartImport } from "@/components/chart-of-accounts-import";
import { Button } from "@/components/ui/button";
import type { CompanyData } from "./step-company";

export function StepReview({
  company,
  chart,
  banks,
  onEdit,
  disabled,
}: {
  company: CompanyData;
  chart: ChartImport | null;
  banks: BankAccountDraft[];
  onEdit: (step: number) => void;
  disabled: boolean;
}) {
  const importedCount = chart
    ? chart.rows.filter((row) => row.selected && row.name.trim()).length
    : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Confira os dados antes de concluir. Nada foi gravado ainda.
      </p>

      <Section title="Dados da empresa" onEdit={() => onEdit(0)} disabled={disabled}>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-muted-foreground">Nome</dt>
          <dd className="font-medium">{company.name.trim()}</dd>
          <dt className="text-muted-foreground">CNPJ</dt>
          <dd className="num">{company.cnpj || "Não informado"}</dd>
          <dt className="text-muted-foreground">Observações</dt>
          <dd className="whitespace-pre-wrap">{company.notes.trim() || "—"}</dd>
        </dl>
      </Section>

      <Section title="Plano de contas" onEdit={() => onEdit(1)} disabled={disabled}>
        {chart ? (
          <p className="text-sm">
            {chart.fileName} · <span className="num">{importedCount}</span>{" "}
            {importedCount === 1 ? "conta será importada" : "contas serão importadas"}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum plano de contas importado.</p>
        )}
      </Section>

      <Section title="Contas bancárias" onEdit={() => onEdit(2)} disabled={disabled}>
        {banks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta bancária.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {banks.map((bank) => (
              <li key={bank.key} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium">{bank.label.trim()}</span>
                <span className="text-muted-foreground">
                  Banco <span className="num">{bank.bankId.trim() || "—"}</span> · Conta{" "}
                  <span className="num">{bank.accountNumber.trim() || "—"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  onEdit,
  disabled,
  children,
}: {
  title: string;
  onEdit: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={disabled}
          aria-label={`Editar ${title.toLowerCase()}`}
        >
          <Pencil className="mr-2 h-3 w-3" />
          Editar
        </Button>
      </div>
      {children}
    </section>
  );
}
