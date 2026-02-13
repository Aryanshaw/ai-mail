import { Bot, ChevronRight } from 'lucide-react'

const AIAssistantHeader = ({onToggle}:any) => {
  return (
    <div className="mb-2 rounded-md border border-white/30 bg-white/35 p-3 dark:border-white/12 dark:bg-white/6">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            <div className="rounded-md border border-white/40 bg-white/60 p-1.5 dark:border-white/15 dark:bg-white/10">
                <Bot className="size-4 text-zinc-800 dark:text-zinc-100" />
            </div>
            <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Assistant</p>
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
    </div>
  )
}

export default AIAssistantHeader