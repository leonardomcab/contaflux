import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      <path d="M8 11.5h15M19 7.5l4 4-4 4" />
      <path d="M24 20.5H9M13 16.5l-4 4 4 4" />
    </svg>
  );
}
