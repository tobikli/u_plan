import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="w-fit shrink-0">{action}</div>
    </div>
  );
}

export function OverviewStats({
  items,
}: {
  items: { label: string; value: ReactNode; detail: string }[];
}) {
  return (
    <section
      aria-label="Overview summary"
      className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card shadow-xs lg:grid-cols-4"
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`min-w-0 p-4 sm:p-5 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0 lg:border-l" : ""}`}
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
            {item.value}
          </p>
          <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
            {item.detail}
          </p>
        </div>
      ))}
    </section>
  );
}

export function OverviewLoading() {
  return (
    <div
      role="status"
      aria-label="Loading overview"
      className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8 lg:p-10"
    >
      <Skeleton className="h-24" />
      <Skeleton className="h-28" />
      <Skeleton className="h-80" />
      <span className="sr-only">Loading your studies…</span>
    </div>
  );
}
