import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { type KeyboardEvent, useId } from "react";

interface RecipientChipInputProps {
  label: string;
  placeholder: string;
  recipients: string[];
  inputValue: string;
  errorMessage?: string;
  onInputChange: (value: string) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputBlur: () => void;
  onRemoveRecipient: (recipientIndex: number) => void;
}

export function RecipientChipInput({
  label,
  placeholder,
  recipients,
  inputValue,
  errorMessage,
  onInputChange,
  onInputKeyDown,
  onInputBlur,
  onRemoveRecipient,
}: RecipientChipInputProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      <label htmlFor={inputId}>{label}</label>
      {/* Input shell supports chip wrapping without breaking layout. */}
      <div className="mail-recipient-shell flex min-h-10 w-full flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5">
        {recipients.map((recipient, recipientIndex) => (
          <Badge
            key={`${recipient}-${recipientIndex}`}
            className="mail-recipient-chip rounded-full px-2.5 py-1 text-xs"
          >
            <span className="truncate">{recipient}</span>
            <button
              type="button"
              onMouseDown={(event) => {
                // Keep focus on the input; prevents blur-commit side effects during chip delete.
                event.preventDefault();
              }}
              onClick={() => onRemoveRecipient(recipientIndex)}
              className="mail-recipient-chip-remove cursor-pointer rounded-full p-0.5"
              aria-label={`Remove ${recipient}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}

        <input
          id={inputId}
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onInputKeyDown}
          onBlur={onInputBlur}
          type="text"
          placeholder={placeholder}
          className="mail-recipient-input h-7 min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none"
        />
      </div>

      {errorMessage ? (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}
