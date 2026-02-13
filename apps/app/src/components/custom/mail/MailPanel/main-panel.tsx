import { EmailDetailPanel } from "@/components/custom/mail/MailPanel/email-detail-panel";
import { EmailListItem } from "@/components/custom/mail/MailPanel/email-list-item";
import { MailItem } from "@/types/types";
import ComposeHeader from "./compose-header";

interface MainPanelProps {
  mails: MailItem[];
  selectedMail: MailItem | null;
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
      <ComposeHeader onToggleAssistant={onToggleAssistant} isAssistantOpen={isAssistantOpen} />

      {/* Unified inbox area with explicit list-detail divider. */}
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-md lg:flex-row backdrop-md bg-white/10 border border-black/8 dark:border-white/10">
        <div className="flex min-h-0 flex-col max-w-xs">
          <div className="mail-panel-border border-b px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
            Priority Inbox
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {mails.map((mail) => {
              const isSelected = selectedMail?.id === mail.id;

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

        <div className="h-full min-h-0 flex-1">
          {/* Email details component */}
          <EmailDetailPanel selectedMail={selectedMail} />
        </div>
      </div>
    </section>
  );
}
