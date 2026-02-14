import { MailItem } from "@/types/types";

interface EmailListItemProps {
  mail: MailItem;
  isSelected: boolean;
  onSelect: (mailId: string) => void;
}

export function EmailListItem({ mail, isSelected, onSelect }: EmailListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mail.id)}
      className={`mb-2 w-full cursor-pointer border-b border-black/10 dark:border-white/8 px-2 py-3 text-left transition-all duration-300 ${
        isSelected
          ? "border-white/45 bg-white/62 shadow-sm dark:border-white/20 dark:bg-white/12 rounded-md"
          : "hover:border-white/30 hover:bg-white/42 dark:hover:border-white/14 dark:hover:bg-white/8"
      }`}
    >
      {/* Top row: sender truncates on the left, date fixed on the right. */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <p
          className={`min-w-0 flex-1 text-sm truncate ${
            mail.unread
              ? "font-semibold text-zinc-900 dark:text-zinc-100"
              : "font-medium text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {mail.sender}
        </p>
        <p className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{mail.dateLabel}</p>
      </div>

      {/* Subject */}
      <p
        className={`truncate text-sm ${
          mail.unread
            ? "font-semibold text-zinc-800 dark:text-zinc-100"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
      >
        {mail.subject}
      </p>
      <p className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-400">{mail.snippet}</p>

      {/* Category */}
      {mail.category ? (
        <span className="mt-2 inline-flex rounded-full border border-white/45 bg-white/55 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-white/20 dark:bg-white/10 dark:text-zinc-300">
          {mail.category}
        </span>
      ) : null}
    </button>
  );
}
