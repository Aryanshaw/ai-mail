import { ComposeWorkspace } from "@/components/custom/mail/MailPanel/compose-workspace";
import { EmailDetailPanel } from "@/components/custom/mail/MailPanel/email-detail-panel";
import { EmailListItem } from "@/components/custom/mail/MailPanel/email-list-item";
import { MailItem } from "@/types/types";
import { RefreshCcw } from "lucide-react";
import ComposeHeader from "./compose-header";

interface MainPanelProps {
  mails: MailItem[];
  selectedMail: MailItem | null;
  onSelectMail: (mailId: string) => void;
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
  isComposeOpen: boolean;
  onOpenCompose: () => void;
  onCloseCompose: () => void;
}

export function MainPanel({
  mails,
  selectedMail,
  onSelectMail,
  isAssistantOpen,
  onToggleAssistant,
  isComposeOpen,
  onOpenCompose,
  onCloseCompose,
}: MainPanelProps) {
  function refreshNewMails() {
    console.log("refreshNewMails: Refreshing for new mails");
  }

  function handleSendComposeMail(draft: {
    to: string;
    cc: string;
    subject: string;
    body: string;
  }) {
    try {
      console.log("handleSendComposeMail: Sending mail draft", draft);
      onCloseCompose();
    } catch (error) {
      console.error("handleSendComposeMail: Failed to send mail draft", error);
    }
  }

  function handleSelectMail(mailId: string) {
    onCloseCompose();
    onSelectMail(mailId);
  }

  return (
    <section className="mail-glass-card flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2">
      {/* Primary command bar with action-first hierarchy. */}
      <ComposeHeader
        onToggleAssistant={onToggleAssistant}
        isAssistantOpen={isAssistantOpen}
        onCompose={onOpenCompose}
      />

      {/* Unified inbox area with explicit list-detail divider. */}
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-black/8 bg-white/10 backdrop-md dark:border-white/10 lg:flex-row">
        {!isComposeOpen ? (
          <div className="flex min-h-0 max-w-xs flex-col">
            <div className="mail-panel-border flex items-center justify-between border-b px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
                Priority Inbox
              </p>
              <button
                className="cursor-pointer rounded-md bg-black/10 p-2 dark:bg-white/10"
                onClick={refreshNewMails}
                type="button"
              >
                <RefreshCcw size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {mails.map((mail) => {
                const isSelected = selectedMail?.id === mail.id;

                return (
                  <EmailListItem
                    key={mail.id}
                    mail={mail}
                    isSelected={isSelected}
                    onSelect={handleSelectMail}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="h-full min-h-0 flex-1">
          {isComposeOpen ? (
            <ComposeWorkspace onClose={onCloseCompose} onSend={handleSendComposeMail} />
          ) : (
            /* Email details component */
            <EmailDetailPanel selectedMail={selectedMail} />
          )}
        </div>
      </div>
    </section>
  );
}
