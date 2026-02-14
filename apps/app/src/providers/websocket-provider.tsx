"use client";

import { issueWebSocketToken } from "@/services/ws-api";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type WebSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export interface WsEnvelope<T = unknown> {
  type: string;
  eventId?: string;
  ts?: string;
  payload: T;
}

type WsMessageHandler = (event: WsEnvelope) => void;

interface WebSocketContextValue {
  status: WebSocketStatus;
  lastError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (event: WsEnvelope) => void;
  subscribe: (type: string, handler: WsMessageHandler) => () => void;
}

const RETRY_DELAY_MS = 3000;

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

function getWebSocketEventsUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
  const sanitizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${sanitizedBaseUrl}/ws/events?token=${encodeURIComponent(token)}`;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WebSocketStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const isConnectingRef = useRef(false);
  const connectRef = useRef<() => Promise<void>>(async () => undefined);
  const handlersRef = useRef<Map<string, Set<WsMessageHandler>>>(new Map());

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const dispatchEvent = useCallback((event: WsEnvelope) => {
    const typedHandlers = handlersRef.current.get(event.type);
    typedHandlers?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in WebSocketProvider.dispatchEvent.typedHandler:", error);
      }
    });

    const wildcardHandlers = handlersRef.current.get("*");
    wildcardHandlers?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in WebSocketProvider.dispatchEvent.wildcardHandler:", error);
      }
    });
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current) {
      return;
    }

    clearReconnectTimeout();
    setStatus("reconnecting");

    reconnectTimeoutRef.current = setTimeout(() => {
      void connectRef.current();
    }, RETRY_DELAY_MS);
  }, [clearReconnectTimeout]);

  const cleanupSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }

    socketRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (isConnectingRef.current) {
      return;
    }

    const existingSocket = socketRef.current;
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      isConnectingRef.current = true;
      setStatus((prevStatus) => (prevStatus === "reconnecting" ? "reconnecting" : "connecting"));
      setLastError(null);

      const tokenResponse = await issueWebSocketToken();
      const wsUrl = getWebSocketEventsUrl(tokenResponse.token);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("connected");
        setLastError(null);
      };

      socket.onmessage = (messageEvent) => {
        try {
          const parsedEvent = JSON.parse(messageEvent.data) as WsEnvelope;
          if (!parsedEvent || typeof parsedEvent.type !== "string") {
            return;
          }
          dispatchEvent(parsedEvent);
        } catch (error) {
          console.error("Error in WebSocketProvider.onmessage:", error);
        }
      };

      socket.onerror = () => {
        setStatus("error");
        setLastError("WebSocket connection error");
      };

      socket.onclose = () => {
        socketRef.current = null;
        if (!shouldReconnectRef.current) {
          setStatus("disconnected");
          return;
        }
        scheduleReconnect();
      };
    } catch (error) {
      console.error("Error in WebSocketProvider.connect:", error);
      setStatus("error");
      setLastError(error instanceof Error ? error.message : String(error));
      scheduleReconnect();
    } finally {
      isConnectingRef.current = false;
    }
  }, [dispatchEvent, scheduleReconnect]);

  connectRef.current = connect;

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearReconnectTimeout();
    cleanupSocket();
    setStatus("disconnected");
  }, [cleanupSocket, clearReconnectTimeout]);

  const send = useCallback((event: WsEnvelope) => {
    try {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket is not connected");
      }

      socket.send(JSON.stringify(event));
    } catch (error) {
      console.error("Error in WebSocketProvider.send:", error);
      setLastError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const subscribe = useCallback((type: string, handler: WsMessageHandler) => {
    const existingHandlers = handlersRef.current.get(type) || new Set<WsMessageHandler>();
    existingHandlers.add(handler);
    handlersRef.current.set(type, existingHandlers);

    return () => {
      const currentHandlers = handlersRef.current.get(type);
      if (!currentHandlers) {
        return;
      }
      currentHandlers.delete(handler);
      if (currentHandlers.size === 0) {
        handlersRef.current.delete(type);
      }
    };
  }, []);

  useEffect(() => {
    shouldReconnectRef.current = true;
    void connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      cleanupSocket();
    };
  }, [clearReconnectTimeout, cleanupSocket, connect]);

  const contextValue = useMemo<WebSocketContextValue>(
    () => ({
      status,
      lastError,
      connect,
      disconnect,
      send,
      subscribe,
    }),
    [status, lastError, connect, disconnect, send, subscribe]
  );

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}
