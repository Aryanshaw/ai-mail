"use client";

import { useWebSocketContext } from "@/providers/websocket-provider";

export function useWebSocket() {
  return useWebSocketContext();
}
