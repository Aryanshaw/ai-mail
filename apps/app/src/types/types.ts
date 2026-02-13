export type NavItemKey = "inbox" | "sent" | "compose" | "archived" | "discover";

export interface MailItem {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  dateLabel: string;
  unread: boolean;
  category?: "Important" | "Team" | "Personal";
  body: string;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}
