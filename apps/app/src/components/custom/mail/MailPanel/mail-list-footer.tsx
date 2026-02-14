import { LoaderCircle } from "lucide-react";

interface MailListFooterProps {
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function MailListFooter({ isLoadingMore, hasMore, onLoadMore }: MailListFooterProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="px-2 pb-3">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className="w-full cursor-pointer rounded-md border border-white/45 bg-white/62 px-3 py-2 text-sm font-medium text-zinc-800 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
      >
        {isLoadingMore ? (
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" />
            Loading more...
          </span>
        ) : (
          "Load more"
        )}
      </button>
    </div>
  );
}
