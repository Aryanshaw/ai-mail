import { MailItem } from "@/components/custom/mail/types";
import { Button } from "@/components/ui/button";
import { Forward, Reply, Star } from "lucide-react";

interface EmailDetailPanelProps {
  selectedMail: MailItem;
}

export function EmailDetailPanel({ selectedMail }: EmailDetailPanelProps) {
  return (
    <div className="mail-content-divider flex h-full min-h-0 flex-col">
      {/* Header carries message context before body content. */}
      <div className="mail-panel-border border-b px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Email Detail</p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{selectedMail.subject}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">From {selectedMail.sender}</p>
      </div>

      {/* Body remains scrollable while header and actions stay anchored. */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-300">{selectedMail.body}</p>
      </div>

      {/* Quick actions for the selected message thread. */}
      <div className="mail-panel-border flex flex-wrap gap-2 border-t px-4 py-3">
        <Button
          type="button"
          size="sm"
          className="cursor-pointer rounded-lg border border-white/45 bg-white/68 text-zinc-800 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
        >
          <Reply className="size-4" />
          Reply
        </Button>
        <Button
          type="button"
          size="sm"
          className="cursor-pointer rounded-lg border border-white/45 bg-white/68 text-zinc-800 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
        >
          <Forward className="size-4" />
          Forward
        </Button>
        <Button
          type="button"
          size="sm"
          className="cursor-pointer rounded-lg border border-white/45 bg-white/68 text-zinc-800 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
        >
          <Star className="size-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
