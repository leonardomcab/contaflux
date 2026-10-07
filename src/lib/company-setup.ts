import type { BankAccountSuggestion } from "./dominio-coa";

export type BankAccountDraft = {
  key: string;
  label: string;
  bankId: string;
  accountNumber: string;
};

let draftCounter = 0;

export function newBankAccountDraft(
  patch: Partial<Omit<BankAccountDraft, "key">> = {},
): BankAccountDraft {
  draftCounter += 1;
  return { key: `bank-${draftCounter}`, label: "", bankId: "", accountNumber: "", ...patch };
}

export function draftsFromSuggestions(suggestions: BankAccountSuggestion[]): BankAccountDraft[] {
  return suggestions.map((s) =>
    newBankAccountDraft({
      label: s.agency ? `${s.label} - AG ${s.agency}` : s.label,
      accountNumber: s.accountNumber ?? "",
    }),
  );
}

/** Mensagens por linha; vazio quando tudo está certo. */
export function validateBankAccounts(drafts: BankAccountDraft[]): Map<string, string> {
  const errors = new Map<string, string>();
  const seen = new Map<string, string>();
  for (const draft of drafts) {
    if (!draft.label.trim()) {
      errors.set(draft.key, "Informe um apelido para a conta.");
      continue;
    }
    // bank_accounts é única por (empresa, banco, conta); duas linhas iguais quebrariam o cadastro.
    const identity = `${draft.bankId.trim()}|${draft.accountNumber.trim()}`;
    const first = seen.get(identity);
    if (first !== undefined) {
      errors.set(
        draft.key,
        identity === "|"
          ? `Só uma conta pode ficar sem banco e número (já usado em "${first}").`
          : `Mesmo banco e número de "${first}".`,
      );
      continue;
    }
    seen.set(identity, draft.label.trim());
  }
  return errors;
}

export function cnpjDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}
