import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompanyPeriod } from "@/hooks/use-company-period";
import { formatMonth } from "@/lib/period";

const ALL = "__all__";

export function PeriodFilter({ period }: { period: CompanyPeriod }) {
  const empty = !period.loading && period.months.length === 0;
  const disabled = period.loading || empty;
  const placeholder = period.loading ? "Carregando..." : empty ? "Sem lançamentos" : "Todos";

  const startValue = period.all ? ALL : (period.start ?? "");
  const endValue = period.all ? ALL : (period.end ?? "");

  function handleStart(value: string) {
    if (value === ALL) return period.setAll();
    period.setRange(value, period.end && !period.all ? period.end : value);
  }

  function handleEnd(value: string) {
    if (value === ALL) return period.setAll();
    period.setRange(period.start && !period.all ? period.start : value, value);
  }

  return (
    <>
      <div className="space-y-2">
        <Label>Mês inicial</Label>
        <MonthSelect
          value={startValue}
          months={period.months}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleStart}
        />
      </div>
      <div className="space-y-2">
        <Label>Mês final</Label>
        <MonthSelect
          value={endValue}
          months={period.months}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleEnd}
        />
      </div>
    </>
  );
}

function MonthSelect({
  value,
  months,
  disabled,
  placeholder,
  onChange,
}: {
  value: string;
  months: string[];
  disabled: boolean;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={disabled ? "" : value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos os períodos</SelectItem>
        <SelectSeparator />
        {months.map((month) => (
          <SelectItem key={month} value={month}>
            {formatMonth(month)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
