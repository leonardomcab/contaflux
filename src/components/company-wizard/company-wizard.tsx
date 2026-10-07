import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  draftsFromSuggestions,
  validateBankAccounts,
  type BankAccountDraft,
} from "@/lib/company-setup";
import { suggestBankAccounts, toCategoryPayload } from "@/lib/dominio-coa";
import { cn } from "@/lib/utils";
import type { ChartImport } from "@/components/chart-of-accounts-import";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StepBankAccounts } from "./step-bank-accounts";
import { StepChartOfAccounts } from "./step-chart-of-accounts";
import { StepCompany, type CompanyData } from "./step-company";

const STEPS = ["Dados da empresa", "Plano de contas", "Contas bancárias"] as const;

export function CompanyWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Nova empresa</DialogTitle>
          <DialogDescription>Cadastre um cliente do escritório.</DialogDescription>
        </DialogHeader>
        {/* Desmontar ao fechar zera o assistente para o próximo cadastro. */}
        {open ? <WizardBody onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function WizardBody({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState<CompanyData>({ name: "", cnpj: "", notes: "" });
  const [chart, setChart] = useState<ChartImport | null>(null);
  const [banks, setBanks] = useState<BankAccountDraft[]>([]);
  const [suggestedFrom, setSuggestedFrom] = useState<ChartImport["chart"] | null>(null);
  const [showBankErrors, setShowBankErrors] = useState(false);

  const bankErrors = validateBankAccounts(banks);

  function handleChartChange(next: ChartImport | null) {
    // Ao carregar um PDF, preenche nome e CNPJ só se ainda estiverem vazios.
    if (next && next.chart !== chart?.chart) {
      const { companyName, cnpj } = next.chart.header;
      setCompany((current) => ({
        ...current,
        name: current.name.trim() ? current.name : (companyName ?? ""),
        cnpj: current.cnpj.trim() ? current.cnpj : (cnpj ?? ""),
      }));
    }
    setChart(next);
  }

  function goToBanks() {
    // As sugestões entram uma vez por PDF e não apagam contas que o usuário já digitou.
    if (chart && chart.chart !== suggestedFrom) {
      const suggestions = draftsFromSuggestions(suggestBankAccounts(chart.chart.accounts));
      setBanks((current) => (current.length === 0 ? suggestions : current));
      setSuggestedFrom(chart.chart);
    }
    setStep(2);
  }

  const save = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_company_setup", {
        p_name: company.name,
        p_cnpj: company.cnpj || null,
        p_notes: company.notes || null,
        p_bank_accounts: banks.map((b) => ({
          label: b.label,
          bank_id: b.bankId,
          account_number: b.accountNumber,
        })),
        p_categories: chart ? toCategoryPayload(chart.rows) : [],
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (companyId) => {
      toast.success("Empresa cadastrada");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      onDone();
      navigate({ to: "/empresas/$companyId", params: { companyId } });
    },
    onError: (error: Error) => toast.error("Erro ao salvar", { description: error.message }),
  });

  function finish() {
    if (bankErrors.size > 0) {
      setShowBankErrors(true);
      return;
    }
    save.mutate();
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
              index === step
                ? "border-primary bg-primary text-primary-foreground"
                : index < step
                  ? "border-primary/40 text-foreground"
                  : "border-border text-muted-foreground",
            )}
          >
            {index < step ? <Check className="h-3 w-3" /> : <span>{index + 1}</span>}
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? <StepCompany value={company} onChange={setCompany} /> : null}
      {step === 1 ? (
        <StepChartOfAccounts
          value={chart}
          onChange={handleChartChange}
          companyCnpj={company.cnpj}
        />
      ) : null}
      {step === 2 ? (
        <StepBankAccounts
          value={banks}
          onChange={setBanks}
          errors={showBankErrors ? bankErrors : new Map()}
          suggested={suggestedFrom !== null && banks.length > 0}
        />
      ) : null}

      <DialogFooter className="gap-2">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={save.isPending}>
            Voltar
          </Button>
        ) : null}
        {step === 0 ? (
          <Button onClick={() => setStep(1)} disabled={!company.name.trim()}>
            Próximo
          </Button>
        ) : null}
        {step === 1 ? (
          <Button variant={chart ? "default" : "secondary"} onClick={goToBanks}>
            {chart ? "Próximo" : "Pular"}
          </Button>
        ) : null}
        {step === 2 ? (
          <Button onClick={finish} disabled={save.isPending || !company.name.trim()}>
            {save.isPending ? "Salvando..." : "Concluir"}
          </Button>
        ) : null}
      </DialogFooter>
    </div>
  );
}
