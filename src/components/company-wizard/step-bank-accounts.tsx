import { Plus, Trash2 } from "lucide-react";
import { newBankAccountDraft, type BankAccountDraft } from "@/lib/company-setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StepBankAccounts({
  value,
  onChange,
  errors,
  suggested,
}: {
  value: BankAccountDraft[];
  onChange: (value: BankAccountDraft[]) => void;
  errors: Map<string, string>;
  suggested: boolean;
}) {
  function update(key: string, patch: Partial<BankAccountDraft>) {
    onChange(value.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {suggested
          ? 'Estas contas foram encontradas em "Bancos conta movimento" do plano de contas. Revise antes de concluir.'
          : "Cadastre as contas bancárias da empresa. Esta etapa é opcional."}{" "}
        O código do banco e o número da conta precisam ficar iguais aos do arquivo OFX (campos
        BANKID e ACCTID); assim a primeira importação usa esta conta em vez de criar outra.
      </p>

      {value.length === 0 ? (
        <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Nenhuma conta bancária.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((draft) => (
            <div key={draft.key} className="space-y-1">
              <div className="grid gap-2 md:grid-cols-[1fr_120px_180px_auto] md:items-end">
                <div className="space-y-1">
                  <Label htmlFor={`${draft.key}-label`} className="text-xs">
                    Apelido
                  </Label>
                  <Input
                    id={`${draft.key}-label`}
                    value={draft.label}
                    onChange={(e) => update(draft.key, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`${draft.key}-bank`} className="text-xs">
                    Código do banco
                  </Label>
                  <Input
                    id={`${draft.key}-bank`}
                    placeholder="0237"
                    value={draft.bankId}
                    onChange={(e) => update(draft.key, { bankId: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`${draft.key}-account`} className="text-xs">
                    Número da conta
                  </Label>
                  <Input
                    id={`${draft.key}-account`}
                    value={draft.accountNumber}
                    onChange={(e) => update(draft.key, { accountNumber: e.target.value })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${draft.label || "conta"}`}
                  onClick={() => onChange(value.filter((d) => d.key !== draft.key))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {errors.get(draft.key) ? (
                <p className="text-xs text-destructive">{errors.get(draft.key)}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange([...value, newBankAccountDraft()])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar conta
      </Button>
    </div>
  );
}
