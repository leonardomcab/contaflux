import { useState } from "react";
import { CNPJ_MASKED_LENGTH, formatCnpj, isCnpjCompleteOrEmpty } from "@/lib/company-setup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CompanyData = { name: string; cnpj: string; notes: string };

export function StepCompany({
  value,
  onChange,
}: {
  value: CompanyData;
  onChange: (value: CompanyData) => void;
}) {
  const [cnpjTouched, setCnpjTouched] = useState(false);
  const cnpjIncomplete = cnpjTouched && !isCnpjCompleteOrEmpty(value.cnpj);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company-name">Nome</Label>
        <Input
          id="company-name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-cnpj">CNPJ</Label>
        <Input
          id="company-cnpj"
          className="num"
          placeholder="00.000.000/0000-00"
          autoComplete="off"
          maxLength={CNPJ_MASKED_LENGTH}
          value={value.cnpj}
          aria-invalid={cnpjIncomplete}
          aria-describedby={cnpjIncomplete ? "company-cnpj-error" : undefined}
          onBlur={() => setCnpjTouched(true)}
          onChange={(e) => onChange({ ...value, cnpj: formatCnpj(e.target.value) })}
        />
        {cnpjIncomplete ? (
          <p id="company-cnpj-error" className="text-xs text-destructive">
            O CNPJ precisa ter 14 caracteres. Deixe em branco se não souber.
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-notes">Observações</Label>
        <Textarea
          id="company-notes"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </div>
    </div>
  );
}
