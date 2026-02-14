import { Skeleton } from "@/components/ui/skeleton";

export function MailListSkeleton() {
  return (
    <div className="space-y-2 px-2 py-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`mail-list-skeleton-${index}`}
          className="rounded-md border border-black/10 bg-white/40 p-3 dark:border-white/10 dark:bg-white/6"
        >
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-6 w-42 bg-zinc-200/70 dark:bg-zinc-700/40" />
            <Skeleton className="h-4 w-34 bg-zinc-200/70 dark:bg-zinc-700/40" />
          </div>
          <Skeleton className="mb-2 h-4 w-56 bg-zinc-200/70 dark:bg-zinc-700/40" />
          <Skeleton className="h-3 w-full bg-zinc-200/70 dark:bg-zinc-700/40" />
        </div>
      ))}
    </div>
  );
}
