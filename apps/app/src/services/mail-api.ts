import { apiClient } from "@/lib/api-client";
import { MailDetail, MailListResponse } from "@/types/types";

export async function getInbox(params: {
  pageToken?: string | null;
  pageSize?: number;
}): Promise<MailListResponse> {
  const response = await apiClient.get<MailListResponse>("/mail/inbox", {
    params: {
      page_token: params.pageToken || undefined,
      page_size: params.pageSize || 20,
    },
  });
  return response.data;
}

export async function getSent(params: {
  pageToken?: string | null;
  pageSize?: number;
}): Promise<MailListResponse> {
  const response = await apiClient.get<MailListResponse>("/mail/sent", {
    params: {
      page_token: params.pageToken || undefined,
      page_size: params.pageSize || 20,
    },
  });
  return response.data;
}

export async function getMailDetail(messageId: string): Promise<MailDetail> {
  const response = await apiClient.get<MailDetail>(`/mail/${messageId}`);
  return response.data;
}

export async function markMailRead(messageId: string): Promise<{ ok: boolean; id: string; unread: boolean }> {
  const response = await apiClient.post<{ ok: boolean; id: string; unread: boolean }>(
    `/mail/${messageId}/read`
  );
  return response.data;
}
