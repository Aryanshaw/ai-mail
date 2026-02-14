export type NavItemKey = "inbox" | "sent" | "compose" | "archived" | "discover";
export type MailboxType = "inbox" | "sent";

export interface MailItem {
  id: string;
  sender: string;
  to?: string | null;
  subject: string;
  snippet: string;
  dateLabel: string;
  unread: boolean;
  htmlBody?: string | null;
  category?: "Important" | "Team" | "Personal";
  body?: string;
}

export interface MailDetail extends MailItem {
  body: string;
}

export interface MailListResponse {
  items: MailItem[];
  nextPageToken: string | null;
}

export interface SendMailPayload {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export interface AIUiAction {
  type: "APPLY_FILTERS" | "SHOW_SEARCH_RESULTS" | "OPEN_EMAIL" | "CLEAR_AI_RESULTS" | "SHOW_ERROR";
  payload: Record<string, unknown>;
}

export interface AITrace {
  providerUsed: string;
  toolsCalled: string[];
  candidateCount: number;
  finalCount: number;
}

export interface AIChatRequestContext {
  activeMailbox: MailboxType;
  selectedMailId: string | null;
  currentFilters: Record<string, unknown>;
  timezone: string;
}

export interface AIChatResponse {
  assistantMessage: string;
  uiActions: AIUiAction[];
  results: MailItem[];
  trace: AITrace;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}
