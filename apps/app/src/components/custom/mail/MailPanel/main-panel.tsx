import { ComposeWorkspace } from "@/components/custom/mail/MailPanel/compose-workspace";
import { EmailDetailPanel } from "@/components/custom/mail/MailPanel/email-detail-panel";
import { EmailListItem } from "@/components/custom/mail/MailPanel/email-list-item";
import { MailDetailSkeleton } from "@/components/custom/mail/MailPanel/mail-detail-skeleton";
import { MailListFooter } from "@/components/custom/mail/MailPanel/mail-list-footer";
import { MailListSkeleton } from "@/components/custom/mail/MailPanel/mail-list-skeleton";
import { MailItem } from "@/types/types";
import { RefreshCcw } from "lucide-react";
import ComposeHeader from "./compose-header";

interface MainPanelProps {
  mailbox: "inbox" | "sent";
  mails: MailItem[];
  selectedMail: MailItem | null;
  onSelectMail: (mailId: string) => void;
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
  isComposeOpen: boolean;
  onOpenCompose: () => void;
  onCloseCompose: () => void;
  isInitialLoading: boolean;
  isListLoading: boolean;
  isDetailLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
}

export function MainPanel({
  mailbox,
  mails,
  selectedMail,
  onSelectMail,
  isAssistantOpen,
  onToggleAssistant,
  isComposeOpen,
  onOpenCompose,
  onCloseCompose,
  isInitialLoading,
  isListLoading,
  isDetailLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onRefresh,
}: MainPanelProps) {
  function handleSendComposeMail(draft: { to: string; cc: string; subject: string; body: string }) {
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
                {mailbox === "sent" ? "Sent Mail" : "Priority Inbox"}
              </p>
              <button
                className="cursor-pointer rounded-md bg-black/10 p-2 dark:bg-white/10"
                onClick={onRefresh}
                type="button"
              >
                <RefreshCcw size={14} className={isListLoading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isInitialLoading ? (
                <MailListSkeleton />
              ) : mails.length === 0 ? (
                <div className="p-4 text-sm text-zinc-600 dark:text-zinc-400">
                  No messages found.
                </div>
              ) : (
                <>
                  <div className="px-2 py-2">
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
                  <MailListFooter
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    onLoadMore={onLoadMore}
                  />
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="h-full min-h-0 flex-1">
          {isComposeOpen ? (
            <ComposeWorkspace onClose={onCloseCompose} onSend={handleSendComposeMail} />
          ) : isDetailLoading ? (
            <MailDetailSkeleton />
          ) : (
            <EmailDetailPanel selectedMail={selectedMail} />
          )}
        </div>
      </div>
    </section>
  );
}
