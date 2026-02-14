import { apiClient } from "@/lib/api-client";

interface WsTokenResponse {
  token: string;
}

export async function issueWebSocketToken(): Promise<WsTokenResponse> {
  const response = await apiClient.post<WsTokenResponse>("/ws/token");
  return response.data;
}
