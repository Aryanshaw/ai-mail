import { ChatMessage } from "@/components/custom/mail/types";
import { Button } from "@/components/ui/button";
import { Bot, ChevronLeft, ChevronRight, SendHorizontal, Sparkles } from "lucide-react";

interface AIPanelProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onToggle: () => void;
}

export function AIPanel({ messages, isOpen, onToggle }: AIPanelProps) {
  return (
    <aside
      className={`mail-ai-panel-separator mail-glass-card relative h-full min-h-0 overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? "w-full lg:w-[320px]" : "w-11"
      }`}
    >
      {/* Collapsed assistant rail handle anchored to panel edge. */}
      {!isOpen ? (
        <div className="flex h-full items-start justify-center pt-4">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/40 bg-white/68 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 transition-all hover:bg-white dark:border-white/20 dark:bg-white/12 dark:text-zinc-200 dark:hover:bg-white/18"
            aria-label="Open AI assistant"
          >
            <Sparkles className="size-3.5" />
            <ChevronLeft className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex h-full flex-col p-3">
          <div className="mb-3 rounded-2xl border border-white/30 bg-white/35 p-3 dark:border-white/12 dark:bg-white/6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-white/40 bg-white/60 p-1.5 dark:border-white/15 dark:bg-white/10">
                  <Bot className="size-4 text-zinc-800 dark:text-zinc-100" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Assistant</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Thread-aware suggestions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/35 bg-white/60 p-1.5 text-zinc-700 transition-all hover:bg-white dark:border-white/18 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/16"
                aria-label="Collapse AI assistant"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" className="mail-chip-button cursor-pointer rounded-lg text-xs">
                Compose
              </Button>
              <Button type="button" size="sm" className="mail-chip-button cursor-pointer rounded-lg text-xs">
                Summarize
              </Button>
            </div>
          </div>

          <div className="mail-glass-inner mb-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-2xl p-3">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-md border px-3 py-2 text-sm leading-6 transition-all ${
                    isAssistant
                      ? "self-start border-white/35 bg-white/55 text-zinc-700 dark:border-white/16 dark:bg-white/10 dark:text-zinc-200"
                      : "self-end border-white/48 bg-white/75 text-zinc-900 dark:border-white/20 dark:bg-white/15 dark:text-zinc-100"
                  }`}
                >
                  {message.text}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/30 bg-white/35 p-3 dark:border-white/12 dark:bg-white/6">
            <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Ask AI for summary or quick draft</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about this thread..."
                className="h-9 flex-1 rounded-lg border border-white/40 bg-white/70 px-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-white focus:bg-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-white/30 dark:focus:bg-white/15"
              />
              <Button type="button" size="sm" className="mail-send-button cursor-pointer rounded-lg px-3">
                <SendHorizontal className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
