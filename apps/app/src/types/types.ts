export type NavItemKey = "inbox" | "sent" | "compose" | "archived" | "discover";
export type MailboxType = "inbox" | "sent";

export interface MailItem {
  id: string;
  sender: string;
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

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}
