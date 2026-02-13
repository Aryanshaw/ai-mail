"use client";

import { AIPanel } from "@/components/custom/mail/AiChat/ai-panel";
import { LeftSidebar } from "@/components/custom/mail/left-sidebar";
import { MainPanel } from "@/components/custom/mail/MailPanel/main-panel";
import { chatMessages, mailItems } from "@/components/custom/mail/MailPanel/mock-data";
import { NavItemKey } from "@/types/types";
import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface MailWorkspaceProps {
  user: {
    first_name?: string;
    last_name?: string;
    avatar?: string;
  } | null;
  onLogout: () => void;
}

const AI_PANEL_MIN_WIDTH = 280;
const AI_PANEL_MAX_WIDTH = 520;
const AI_PANEL_DEFAULT_WIDTH = 320;

export function MailWorkspace({ user, onLogout }: MailWorkspaceProps) {
  const [activeNav, setActiveNav] = useState<NavItemKey>("inbox");
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantWidth, setAssistantWidth] = useState(AI_PANEL_DEFAULT_WIDTH);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedMail = useMemo(() => {
    if (!selectedMailId) {
      return null;
    }
    return mailItems.find((mail) => mail.id === selectedMailId) ?? null;
  }, [selectedMailId]);

  const handleAssistantResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = assistantWidth;
    const contentWidth = contentRef.current?.getBoundingClientRect().width ?? 1200;
    const maxWidth = Math.min(AI_PANEL_MAX_WIDTH, Math.floor(contentWidth * 0.55));

    const nextCursor = document.body.style.cursor;
    const nextUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const proposedWidth = startWidth - deltaX;
      const clampedWidth = Math.max(AI_PANEL_MIN_WIDTH, Math.min(maxWidth, proposedWidth));
      setAssistantWidth(clampedWidth);
    };

    const onPointerUp = () => {
      document.body.style.cursor = nextCursor;
      document.body.style.userSelect = nextUserSelect;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  function toggleChatPanel() {
    setIsAssistantOpen((prev) => !prev);
  }

  function handleNavChange(nextNav: NavItemKey) {
    setActiveNav(nextNav);

    if (nextNav === "compose") {
      setIsComposeOpen(true);
      return;
    }

    if (nextNav === "inbox") {
      setIsComposeOpen(false);
    }
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
            onNavChange={handleNavChange}
            user={user}
            onLogout={onLogout}
          />

          <div ref={contentRef} className="flex h-full min-h-0 min-w-0 flex-1 gap-1">
            <MainPanel
              mails={mailItems}
              selectedMail={selectedMail}
              onSelectMail={setSelectedMailId}
              isAssistantOpen={isAssistantOpen}
              onToggleAssistant={() => setIsAssistantOpen((prev) => !prev)}
              isComposeOpen={isComposeOpen}
              onOpenCompose={() => setIsComposeOpen(true)}
              onCloseCompose={() => setIsComposeOpen(false)}
            />
            <AIPanel
              messages={chatMessages}
              isOpen={isAssistantOpen}
              width={assistantWidth}
              onResizeStart={handleAssistantResizeStart}
              onToggle={toggleChatPanel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
