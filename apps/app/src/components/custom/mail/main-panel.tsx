import { EmailDetailPanel } from "@/components/custom/mail/email-detail-panel";
import { EmailListItem } from "@/components/custom/mail/email-list-item";
import { MailItem } from "@/components/custom/mail/types";
import { Button } from "@/components/ui/button";
import { ChevronRight, Filter, Search } from "lucide-react";
import ComposeHeader from "./compose-header";

interface MainPanelProps {
  mails: MailItem[];
  selectedMail: MailItem;
  onSelectMail: (mailId: string) => void;
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
}

export function MainPanel({
  mails,
  selectedMail,
  onSelectMail,
  isAssistantOpen,
  onToggleAssistant,
}: MainPanelProps) {
  return (
    <section className="mail-glass-card flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2">
      {/* Primary command bar with action-first hierarchy. */}
      <ComposeHeader onToggleAssistant={onToggleAssistant} isAssistantOpen={isAssistantOpen}/>

      {/* Unified inbox area with explicit list-detail divider. */}
      <div className="mail-glass-inner grid min-h-0 flex-1 overflow-hidden rounded-xl lg:grid-cols-[0.52fr_1.08fr]">
        <div className="flex min-h-0 flex-col">
          <div className="border-b border-white/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            Priority Inbox
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {mails.map((mail) => {
              const isSelected = selectedMail.id === mail.id;

              return (
                <EmailListItem
                  key={mail.id}
                  mail={mail}
                  isSelected={isSelected}
                  onSelect={onSelectMail}
                />
              );
            })}
          </div>
        </div>

        {/* Email details component */}
        <EmailDetailPanel selectedMail={selectedMail} />
      </div>
    </section>
  );
}
