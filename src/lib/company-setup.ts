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

export const CNPJ_LENGTH = 14;
export const CNPJ_MASKED_LENGTH = 18;

/**
 * Aplica a máscara 00.000.000/0000-00 conforme o usuário digita e descarta o excedente.
 * Aceita o CNPJ alfanumérico da Receita (IN RFB 2.229/2024): letras nas 12 primeiras
 * posições; os 2 dígitos verificadores são sempre numéricos.
 */
export function formatCnpj(value: string | null | undefined): string {
  let clean = "";
  for (const char of (value ?? "").toUpperCase()) {
    if (clean.length === CNPJ_LENGTH) break;
    if (clean.length < 12 ? /[0-9A-Z]/.test(char) : /\d/.test(char)) clean += char;
  }
  const parts = [
    clean.slice(0, 2),
    clean.slice(2, 5),
    clean.slice(5, 8),
    clean.slice(8, 12),
    clean.slice(12),
  ];
  const separators = ["", ".", ".", "/", "-"];
  return parts.map((part, i) => (part ? separators[i] + part : "")).join("");
}

/** O CNPJ é opcional, mas se for informado precisa estar completo. */
export function isCnpjCompleteOrEmpty(value: string): boolean {
  const length = formatCnpj(value).replace(/[./-]/g, "").length;
  return length === 0 || length === CNPJ_LENGTH;
}
