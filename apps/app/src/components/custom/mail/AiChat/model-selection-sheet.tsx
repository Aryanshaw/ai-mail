"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIModelSelector } from "@/types/types";

interface ModelSelectionSheetProps {
  value: AIModelSelector;
  onChange: (value: AIModelSelector) => void;
  disabled?: boolean;
}

const MODEL_OPTIONS: Array<{ value: AIModelSelector; label: string }> = [
  { value: "gemini", label: "Gemini (2.5 Flash)" },
  { value: "groq", label: "Llama (Groq)" },
];

function getModelLabel(value: AIModelSelector): string {
  const option = MODEL_OPTIONS.find((modelOption) => modelOption.value === value);
  return option?.label || "Select model";
}

export function ModelSelectionSheet({
  value,
  onChange,
  disabled = false,
}: ModelSelectionSheetProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue === "gemini" || nextValue === "groq") {
          onChange(nextValue);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger
        disabled={disabled}
        size="sm"
        className="h-6 w-auto cursor-pointer border-0 bg-transparent px-1.5 text-xs shadow-none focus-visible:ring-0"
      >
        <SelectValue>{getModelLabel(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="top"
        align="start"
        sideOffset={5}
        collisionPadding={8}
        className="w-fit rounded-md border border-black/10 bg-popover p-1 text-popover-foreground dark:border-white/20"
      >
        {MODEL_OPTIONS.map((modelOption) => (
          <SelectItem
            key={modelOption.value}
            value={modelOption.value}
            className="cursor-pointer px-1.5 py-1 text-xs"
          >
            {modelOption.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
