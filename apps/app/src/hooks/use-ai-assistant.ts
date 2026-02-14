"use client";

import { sendAIChatMessage } from "@/services/ai-api";
import { AIChatRequestContext, AIChatResponse, ChatMessage } from "@/types/types";
import { useCallback, useMemo, useState } from "react";

interface UseAIAssistantOptions {
  model: "auto" | "gemini" | "groq";
}

export function useAIAssistant(options: UseAIAssistantOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (message: string, context: AIChatRequestContext): Promise<AIChatResponse | null> => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isLoading) {
        return null;
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmedMessage,
      };

      setMessages((currentMessages) => [...currentMessages, userMessage]);
      setIsLoading(true);

      try {
        const response = await sendAIChatMessage({
          message: trimmedMessage,
          model: options.model,
          context,
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: response.assistantMessage,
        };
        setMessages((currentMessages) => [...currentMessages, assistantMessage]);

        return response;
      } catch (error) {
        console.error("Error in useAIAssistant.sendMessage:", error);
        const assistantErrorMessage: ChatMessage = {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "I could not process that request right now. Please try again.",
        };
        setMessages((currentMessages) => [...currentMessages, assistantErrorMessage]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, options.model]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return useMemo(
    () => ({
      messages,
      isLoading,
      sendMessage,
      clearMessages,
    }),
    [messages, isLoading, sendMessage, clearMessages]
  );
}
