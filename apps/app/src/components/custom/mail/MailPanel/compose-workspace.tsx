"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, X } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useMemo, useState } from "react";
import { RecipientChipInput } from "./recipient-chip-input";

export interface ComposeDraft {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

interface ComposeWorkspaceProps {
  onClose: () => void;
  onSend: (draft: ComposeDraft) => void;
}

const INITIAL_DRAFT: ComposeDraft = {
  to: "",
  cc: "",
  subject: "",
  body: "",
};

function normalizeRecipient(value: string) {
  return value.trim().replace(/[;,]+$/g, "");
}

function appendRecipientIfMissing(existingRecipients: string[], rawValue: string) {
  const normalizedRecipient = normalizeRecipient(rawValue);

  if (!normalizedRecipient) {
    return existingRecipients;
  }

  const hasExistingRecipient = existingRecipients.some(
    (recipient) => recipient.toLowerCase() === normalizedRecipient.toLowerCase()
  );

  if (hasExistingRecipient) {
    return existingRecipients;
  }

  return [...existingRecipients, normalizedRecipient];
}

export function ComposeWorkspace({ onClose, onSend }: ComposeWorkspaceProps) {
  const [draft, setDraft] = useState<ComposeDraft>(INITIAL_DRAFT);
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [toInputValue, setToInputValue] = useState("");
  const [ccInputValue, setCcInputValue] = useState("");
  const [toErrorMessage, setToErrorMessage] = useState("");

  const previewBody = useMemo(() => {
    if (draft.body.trim().length > 0) {
      return draft.body;
    }

    return "Your message preview appears here as you type.\n\nUse this panel to validate tone and structure before sending.";
  }, [draft.body]);

  const previewToText = toRecipients.join(", ");
  const previewCcText = ccRecipients.join(", ");

  const handleFieldChange = (field: keyof ComposeDraft, value: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  };

  const commitRecipient = (field: "to" | "cc") => {
    if (field === "to") {
      const nextRecipients = appendRecipientIfMissing(toRecipients, toInputValue);
      setToRecipients(nextRecipients);
      setToInputValue("");
      if (nextRecipients.length > 0) {
        setToErrorMessage("");
      }
      return;
    }

    const nextRecipients = appendRecipientIfMissing(ccRecipients, ccInputValue);
    setCcRecipients(nextRecipients);
    setCcInputValue("");
  };

  const handleRecipientKeyDown = (field: "to" | "cc", event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commitRecipient(field);
      return;
    }

    const currentInputValue = field === "to" ? toInputValue : ccInputValue;
    if (event.key === "Backspace" && currentInputValue.trim().length === 0) {
      if (field === "to") {
        setToRecipients((currentRecipients) => currentRecipients.slice(0, -1));
        return;
      }

      setCcRecipients((currentRecipients) => currentRecipients.slice(0, -1));
    }
  };

  const handleRemoveRecipient = (field: "to" | "cc", recipientIndexToRemove: number) => {
    if (field === "to") {
      setToRecipients((currentRecipients) =>
        currentRecipients.filter((_, recipientIndex) => recipientIndex !== recipientIndexToRemove)
      );
      return;
    }

    setCcRecipients((currentRecipients) =>
      currentRecipients.filter((_, recipientIndex) => recipientIndex !== recipientIndexToRemove)
    );
  };

  const handleDiscard = () => {
    setDraft(INITIAL_DRAFT);
    setToRecipients([]);
    setCcRecipients([]);
    setToInputValue("");
    setCcInputValue("");
    setToErrorMessage("");
    onClose();
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const finalizedToRecipients = appendRecipientIfMissing(toRecipients, toInputValue);
    const finalizedCcRecipients = appendRecipientIfMissing(ccRecipients, ccInputValue);

    if (finalizedToRecipients.length === 0) {
      setToErrorMessage("Add at least one recipient in To.");
      return;
    }

    onSend({
      ...draft,
      to: finalizedToRecipients.join(", "),
      cc: finalizedCcRecipients.join(", "),
    });

    setDraft(INITIAL_DRAFT);
    setToRecipients([]);
    setCcRecipients([]);
    setToInputValue("");
    setCcInputValue("");
    setToErrorMessage("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      {/* Header keeps compose controls anchored while body remains scrollable. */}
      <header className="flex items-start justify-between border-b px-4 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Compose mail</h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Write and preview your message side by side.
          </p>
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="mail-chip-button cursor-pointer rounded-lg"
          aria-label="Close compose"
          onClick={handleDiscard}
        >
          <X className="size-4" />
        </Button>
      </header>

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSend}>
        {/* The split layout mirrors your reference while preserving the app's glass style. */}
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-h-0 flex-col gap-3 rounded-md border p-3 border border-black/10 dark:border-white/10">
            <div className="grid gap-3 sm:grid-cols-2">
              <RecipientChipInput
                label="To"
                placeholder="name@company.com"
                recipients={toRecipients}
                inputValue={toInputValue}
                errorMessage={toErrorMessage}
                onInputChange={(value) => {
                  setToInputValue(value);
                  if (value.trim().length > 0) {
                    setToErrorMessage("");
                  }
                }}
                onInputKeyDown={(event) => handleRecipientKeyDown("to", event)}
                onInputBlur={() => commitRecipient("to")}
                onRemoveRecipient={(recipientIndex) => handleRemoveRecipient("to", recipientIndex)}
              />

              <RecipientChipInput
                label="Cc"
                placeholder="Optional"
                recipients={ccRecipients}
                inputValue={ccInputValue}
                onInputChange={setCcInputValue}
                onInputKeyDown={(event) => handleRecipientKeyDown("cc", event)}
                onInputBlur={() => commitRecipient("cc")}
                onRemoveRecipient={(recipientIndex) => handleRemoveRecipient("cc", recipientIndex)}
              />
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Subject
              <Input
                value={draft.subject}
                onChange={(event) => handleFieldChange("subject", event.target.value)}
                type="text"
                placeholder="Add subject"
                className="mail-compose-field h-10 border"
                required
              />
            </label>

            <label className="flex min-h-0 flex-1 flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Message
              <textarea
                value={draft.body}
                onChange={(event) => handleFieldChange("body", event.target.value)}
                placeholder="Write your email..."
                className="mail-compose-textarea min-h-56 w-full flex-1 resize-y rounded-lg border p-3 text-sm"
                required
              />
            </label>
          </div>

          <aside className="flex min-h-56 flex-col rounded-lg border p-3 border border-black/10 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
              Preview
            </p>
            <div className="mail-panel-border mt-2 flex min-h-0 flex-1 flex-col gap-3 border-t pt-3">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                To: {previewToText || "recipient@example.com"}
              </p>
              {previewCcText ? (
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Cc: {previewCcText}
                </p>
              ) : null}
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {draft.subject || "No subject"}
              </p>
              <p className="whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {previewBody}
              </p>
            </div>
          </aside>
        </div>

        <footer className="mail-panel-border flex items-center justify-between border-t px-4 py-3">
          <div className="hidden items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 sm:flex">
            <Sparkles className="size-3.5" />
            AI can improve this draft after send wiring is connected.
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="mail-chip-button cursor-pointer rounded-lg px-4"
              onClick={handleDiscard}
            >
              Discard
            </Button>
            <Button type="submit" className="mail-send-button cursor-pointer rounded-lg px-4">
              <Send className="size-4" />
              Send
            </Button>
          </div>
        </footer>
      </form>
    </section>
  );
}
