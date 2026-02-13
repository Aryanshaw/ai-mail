"use client";

import { AIPanel } from "@/components/custom/mail/ai-panel";
import { LeftSidebar } from "@/components/custom/mail/left-sidebar";
import { MainPanel } from "@/components/custom/mail/main-panel";
import { chatMessages, mailItems } from "@/components/custom/mail/mock-data";
import { NavItemKey } from "@/components/custom/mail/types";
import { useMemo, useState } from "react";

interface MailWorkspaceProps {
  fullName: string;
  onLogout: () => void;
}

export function MailWorkspace({ fullName, onLogout }: MailWorkspaceProps) {
  const [activeNav, setActiveNav] = useState<NavItemKey>("inbox");
  const [selectedMailId, setSelectedMailId] = useState(mailItems[0]?.id ?? "");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const selectedMail = useMemo(
    () => mailItems.find((mail) => mail.id === selectedMailId) ?? mailItems[0],
    [selectedMailId]
  );

  if (!selectedMail) {
    return null;
  }

  return (
    <div className="relative h-full w-full overflow-hidden mail-app-colors backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 z-10 mail-app-overlay" />
      <div className="pointer-events-none absolute inset-0 z-10 mail-app-noise" />

      <div className="relative z-20 flex h-full min-h-0 w-full flex-col p-3 sm:p-4 lg:p-6">
        {/* Panel shell keeps hierarchy structured and separated. */}
        <div className="flex h-full min-h-0 flex-1 flex-col gap-1 lg:flex-row">
          <LeftSidebar
            activeNav={activeNav}
            onNavChange={setActiveNav}
            userLabel={fullName}
            onLogout={onLogout}
          />

          <div className="flex h-full min-h-0 min-w-0 flex-1 gap-1">
            <MainPanel
              mails={mailItems}
              selectedMail={selectedMail}
              onSelectMail={setSelectedMailId}
              isAssistantOpen={isAssistantOpen}
              onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
            />
            <AIPanel
              messages={chatMessages}
              isOpen={isAssistantOpen}
              onToggle={() => setIsAssistantOpen((prev) => !prev)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
