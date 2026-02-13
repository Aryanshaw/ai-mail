import { Button } from "@/components/ui/button";
import { ChevronRight, Filter, Search } from "lucide-react";

interface ComposeHeaderProps {
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
  onCompose: () => void;
}

const ComposeHeader = ({ onToggleAssistant, isAssistantOpen, onCompose }: ComposeHeaderProps) => {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-black/8 bg-white/35 p-3 dark:border-white/12 dark:bg-white/5">
      <Button
        type="button"
        size="sm"
        className="mail-compose-button cursor-pointer rounded-lg text-sm"
        onClick={onCompose}
      >
        Compose
      </Button>

      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
        <input
          type="text"
          placeholder="Search mail"
          className="h-9 w-full rounded-lg border mail-panel-border bg-white/72 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-white focus:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-white/30 dark:focus:bg-white/15"
        />
      </div>

      <Button
        type="button"
        size="sm"
        className="cursor-pointer rounded-lg border border-white/45 bg-white/62 text-zinc-800 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
      >
        <Filter className="size-4" />
        Filter
      </Button>

      <button
        type="button"
        onClick={onToggleAssistant}
        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/40 bg-white/58 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-all hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15 lg:hidden"
      >
        {isAssistantOpen ? "Hide AI" : "Show AI"}
        <ChevronRight
          className={`size-3.5 transition-transform ${isAssistantOpen ? "rotate-180" : "rotate-0"}`}
        />
      </button>
    </div>
  );
};

export default ComposeHeader;
