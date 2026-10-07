import { AlertTriangle } from "lucide-react";
import { cnpjDigits } from "@/lib/company-setup";
import { ChartOfAccountsImport, type ChartImport } from "@/components/chart-of-accounts-import";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function StepChartOfAccounts({
  value,
  onChange,
  companyCnpj,
}: {
  value: ChartImport | null;
  onChange: (value: ChartImport | null) => void;
  companyCnpj: string;
}) {
  const pdfCnpj = value?.chart.header.cnpj ?? null;
  const cnpjMismatch =
    pdfCnpj !== null &&
    cnpjDigits(companyCnpj) !== "" &&
    cnpjDigits(pdfCnpj) !== cnpjDigits(companyCnpj);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Envie o relatório "Plano de Contas" exportado em PDF pelo Domínio. Contas sintéticas e
        analíticas são importadas, com o tipo sugerido pelo grupo da classificação. Esta etapa é
        opcional.
      </p>
      {cnpjMismatch ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            O PDF é do CNPJ {pdfCnpj}
            {value?.chart.header.companyName ? ` (${value.chart.header.companyName})` : ""},
            diferente do CNPJ informado na etapa anterior.
          </AlertDescription>
        </Alert>
      ) : null}
      <ChartOfAccountsImport value={value} onChange={onChange} />
    </div>
  );
}
