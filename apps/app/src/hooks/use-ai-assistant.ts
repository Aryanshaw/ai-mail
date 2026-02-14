"use client";

import { useWebSocket } from "@/hooks/use-websocket";
import {
  AIChatRequestContext,
  AIModelSelector,
  AIUiAction,
  ChatActionPayload,
  ChatCompletedPayload,
  ChatDeltaPayload,
  ChatErrorPayload,
  ChatMessage,
  ChatRequestPayload,
  WsEnvelope,
} from "@/types/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseAIAssistantOptions {
  model: AIModelSelector;
  onAction: (action: AIUiAction, payload: { chatId: string; prompt: string; results: ChatActionPayload["results"] }) => void | Promise<void>;
}

export function useAIAssistant(options: UseAIAssistantOptions) {
  const { model, onAction } = options;
  const { send, subscribe, status } = useWebSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const activeChatIdRef = useRef<string | null>(null);
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const activePromptRef = useRef<string>("");

  const sendMessage = useCallback(
    async (message: string, context: AIChatRequestContext): Promise<void> => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isLoading) {
        return;
      }

      if (status !== "connected") {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            text: "Realtime connection is not ready. Please wait and try again.",
            status: "error",
          },
        ]);
        return;
      }

      const chatId = `chat-${Date.now()}`;
      const assistantMessageId = `assistant-${chatId}`;
      const userMessage: ChatMessage = {
        id: `user-${chatId}`,
        role: "user",
        text: trimmedMessage,
        status: "completed",
      };
      const assistantStreamingMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        status: "streaming",
      };

      activeChatIdRef.current = chatId;
      activeAssistantMessageIdRef.current = assistantMessageId;
      activePromptRef.current = trimmedMessage;
      setMessages((currentMessages) => [
        ...currentMessages,
        userMessage,
        assistantStreamingMessage,
      ]);
      setIsLoading(true);

      try {
        const eventPayload: ChatRequestPayload = {
          chatId,
          message: trimmedMessage,
          model,
          context,
        };
        send({
          type: "chat_request",
          eventId: `${chatId}-request`,
          payload: eventPayload,
        } as WsEnvelope<ChatRequestPayload>);
      } catch (error) {
        console.error("Error in useAIAssistant.sendMessage:", error);
        setMessages((currentMessages) =>
          currentMessages.map((chatMessage) => {
            if (chatMessage.id !== assistantMessageId) {
              return chatMessage;
            }
            return {
              ...chatMessage,
              text: "I could not process that request right now. Please try again.",
              status: "error",
            };
          })
        );
        setIsLoading(false);
      }
    },
    [isLoading, model, send, status]
  );

  useEffect(() => {
    const unsubscribeStart = subscribe("chat_start", (event) => {
      const payload = event.payload as { chatId?: string };
      if (payload.chatId !== activeChatIdRef.current) {
        return;
      }
      setIsLoading(true);
    });

    const unsubscribeDelta = subscribe("chat_delta", (event) => {
      const payload = event.payload as ChatDeltaPayload;
      if (payload.chatId !== activeChatIdRef.current) {
        return;
      }
      const assistantMessageId = activeAssistantMessageIdRef.current;
      if (!assistantMessageId) {
        return;
      }
      setMessages((currentMessages) =>
        currentMessages.map((chatMessage) => {
          if (chatMessage.id !== assistantMessageId) {
            return chatMessage;
          }
          return {
            ...chatMessage,
            text: `${chatMessage.text}${payload.delta}`,
            status: "streaming",
          };
        })
      );
    });

    const unsubscribeAction = subscribe("chat_action", (event) => {
      const payload = event.payload as ChatActionPayload;
      if (payload.chatId !== activeChatIdRef.current) {
        return;
      }
      try {
        void onAction(payload.action, {
          chatId: payload.chatId,
          prompt: activePromptRef.current,
          results: payload.results,
        });
      } catch (error) {
        console.error("Error in useAIAssistant.chat_action:", error);
      }
    });

    const unsubscribeCompleted = subscribe("chat_completed", (event) => {
      const payload = event.payload as ChatCompletedPayload;
      if (payload.chatId !== activeChatIdRef.current) {
        return;
      }
      const assistantMessageId = activeAssistantMessageIdRef.current;
      if (assistantMessageId) {
        setMessages((currentMessages) =>
          currentMessages.map((chatMessage) => {
            if (chatMessage.id !== assistantMessageId) {
              return chatMessage;
            }
            return {
              ...chatMessage,
              text: payload.assistantMessage || chatMessage.text,
              status: "completed",
            };
          })
        );
      }
      activeChatIdRef.current = null;
      activeAssistantMessageIdRef.current = null;
      activePromptRef.current = "";
      setIsLoading(false);
    });

    const unsubscribeError = subscribe("chat_error", (event) => {
      const payload = event.payload as ChatErrorPayload;
      if (payload.chatId && payload.chatId !== activeChatIdRef.current) {
        return;
      }
      const assistantMessageId = activeAssistantMessageIdRef.current;
      if (assistantMessageId) {
        setMessages((currentMessages) =>
          currentMessages.map((chatMessage) => {
            if (chatMessage.id !== assistantMessageId) {
              return chatMessage;
            }
            return {
              ...chatMessage,
              text: payload.message || "I could not process that request right now. Please try again.",
              status: "error",
            };
          })
        );
      }
      activeChatIdRef.current = null;
      activeAssistantMessageIdRef.current = null;
      activePromptRef.current = "";
      setIsLoading(false);
    });

    return () => {
      unsubscribeStart();
      unsubscribeDelta();
      unsubscribeAction();
      unsubscribeCompleted();
      unsubscribeError();
    };
  }, [onAction, subscribe]);

  useEffect(() => {
    if (status === "connected" || !isLoading) {
      return;
    }

    const assistantMessageId = activeAssistantMessageIdRef.current;
    if (assistantMessageId) {
      setMessages((currentMessages) =>
        currentMessages.map((chatMessage) => {
          if (chatMessage.id !== assistantMessageId || chatMessage.status !== "streaming") {
            return chatMessage;
          }
          return {
            ...chatMessage,
            text: "Connection lost while generating response. Please try again.",
            status: "error",
          };
        })
      );
    }
    activeChatIdRef.current = null;
    activeAssistantMessageIdRef.current = null;
    activePromptRef.current = "";
    setIsLoading(false);
  }, [isLoading, status]);

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
