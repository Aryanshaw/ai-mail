import { apiClient } from "@/lib/api-client";
import { AIChatRequestContext, AIChatResponse } from "@/types/types";

interface AIChatRequestPayload {
  message: string;
  model: "auto" | "gemini" | "groq";
  context: AIChatRequestContext;
}

export async function sendAIChatMessage(payload: AIChatRequestPayload): Promise<AIChatResponse> {
  const response = await apiClient.post<AIChatResponse>("/ai/chat", { body: payload });
  return response.data;
}
