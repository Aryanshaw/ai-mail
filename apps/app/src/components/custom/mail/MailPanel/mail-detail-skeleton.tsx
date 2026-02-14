import { Skeleton } from "@/components/ui/skeleton";

export function MailDetailSkeleton() {
  return (
    <div className="mail-content-divider flex h-full min-h-0 flex-col">
      <div className="mail-panel-border border-b px-4 py-4">
        <Skeleton className="mb-3 h-3 w-20 bg-zinc-200/70 dark:bg-zinc-700/40" />
        <Skeleton className="mb-2 h-6 w-72 bg-zinc-200/70 dark:bg-zinc-700/40" />
        <Skeleton className="h-4 w-40 bg-zinc-200/70 dark:bg-zinc-700/40" />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton
            key={`mail-detail-skeleton-${index}`}
            className="h-4 w-full bg-zinc-200/70 dark:bg-zinc-700/40"
          />
        ))}
      </div>
    </div>
  );
}
