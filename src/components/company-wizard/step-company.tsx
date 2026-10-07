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
          value={value.cnpj}
          onChange={(e) => onChange({ ...value, cnpj: e.target.value })}
        />
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
