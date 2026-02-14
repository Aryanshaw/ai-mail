import { AIModelSelector, ChatMessage } from "@/types/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, GripVertical, Loader2, SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import AIAssistantHeader from "./ai-assistant-header";
import { ModelSelectionSheet } from "./model-selection-sheet";

interface AIPanelProps {
  messages: ChatMessage[];
  inputValue: string;
  isSending: boolean;
  isOpen: boolean;
  width: number;
  selectedModel: AIModelSelector;
  onToggle: () => void;
  onSelectModel: (value: AIModelSelector) => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onInputEnter: () => void;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
}

export function AIPanel({
  messages,
  inputValue,
  isSending,
  isOpen,
  width,
  selectedModel,
  onToggle,
  onSelectModel,
  onInputChange,
  onSend,
  onInputEnter,
  onResizeStart,
}: AIPanelProps) {
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const container = messageListRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [isOpen, isSending, messages]);

  return (
    <aside
      className={`group/ai mail-ai-panel-separator mail-glass-card relative h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
        isOpen ? "w-full" : "w-14"
      }`}
      style={isOpen ? { width: `${width}px` } : undefined}
    >
      {/* Desktop resize rail for drag-resizing the assistant panel. */}
      {isOpen ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize AI panel"
          onPointerDown={onResizeStart}
          className="absolute inset-y-0 left-0 z-30 hidden w-2 cursor-col-resize items-center justify-center transition-colors hover:bg-black/4 dark:hover:bg-white/8 lg:flex"
        >
          <div className="h-28 w-px rounded-full bg-black/22 opacity-0 transition-opacity duration-200 group-hover/ai:opacity-100 dark:bg-white/22" />
          <GripVertical className="absolute size-3.5 text-zinc-500 opacity-0 transition-opacity duration-200 group-hover/ai:opacity-100 dark:text-zinc-400" />
        </div>
      ) : null}

      {!isOpen ? (
        <div className="flex h-full p-1.5">
          <div className="flex w-full flex-col items-center gap-2 rounded-md">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex cursor-pointer items-center justify-center rounded-md border border-black/10 dark:border-white/8 p-2"
              aria-label="Open AI assistant"
            >
              <Sparkles className="size-4" />
              <ChevronLeft className="size-3 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col p-2">
          <AIAssistantHeader onToggle={onToggle} />

          {/* Message list */}
          <div
            ref={messageListRef}
            className="mail-glass-inner mb-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-md p-2"
          >
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-md border px-3 py-2 text-xs leading-6 transition-all ${
                    isAssistant
                      ? "self-start border-white/35 bg-white/55 text-zinc-700 dark:border-white/16 dark:bg-white/10 dark:text-zinc-200"
                      : "self-end border-white/48 bg-white/75 text-zinc-900 dark:border-white/20 dark:bg-white/15 dark:text-zinc-100"
                  }`}
                >
                  {message.status === "streaming" && !message.text ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-300" />
                      <span className="size-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-300 [animation-delay:140ms]" />
                      <span className="size-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-300 [animation-delay:280ms]" />
                    </span>
                  ) : (
                    message.text
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom chat bar */}
          <div className="rounded-md border border-white/30 bg-white/35 p-3 dark:border-white/12 dark:bg-white/6">
            <div className="relative rounded-lg border border-white/40 bg-white/70 dark:border-white/20 dark:bg-white/10">
              <textarea
                placeholder="Ask about this thread..."
                value={inputValue}
                disabled={isSending}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onInputEnter();
                  }
                }}
                rows={2}
                className="min-h-14 w-full resize-none rounded-lg bg-transparent px-2 py-4 pb-10 text-xs text-zinc-900 outline-none transition-all placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />

              <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between">
                <div className="pointer-events-auto">
                  <ModelSelectionSheet
                    value={selectedModel}
                    onChange={onSelectModel}
                    disabled={isSending}
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={onSend}
                  disabled={isSending}
                  className="mail-send-button pointer-events-auto cursor-pointer rounded-md px-2 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
