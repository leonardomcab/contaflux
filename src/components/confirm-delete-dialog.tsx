import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type DeleteImpact = { label: string; count: number }[];

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  impactKey,
  loadImpact,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  impactKey: readonly unknown[];
  loadImpact: () => Promise<DeleteImpact>;
  onConfirm: () => void;
  pending: boolean;
}) {
  const impact = useQuery({
    queryKey: ["delete-impact", ...impactKey],
    queryFn: loadImpact,
    enabled: open,
    staleTime: 0,
    gcTime: 0,
  });

  const affected = (impact.data ?? []).filter((item) => item.count > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          {impact.isLoading ? (
            <p className="text-muted-foreground">Calculando o impacto...</p>
          ) : impact.isError ? (
            <p className="text-destructive">Não foi possível calcular o impacto.</p>
          ) : affected.length === 0 ? (
            <p className="text-muted-foreground">Nenhum outro registro será afetado.</p>
          ) : (
            <ul className="space-y-1">
              {affected.map((item) => (
                <li key={item.label} className="flex justify-between gap-4">
                  <span>{item.label}</span>
                  <span className="num font-medium">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending || impact.isLoading || impact.isError}
            onClick={onConfirm}
          >
            {pending ? "Excluindo..." : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export async function countRows(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
