"use client";

import { getInbox, getMailDetail, getSent, markMailRead, sendMail } from "@/services/mail-api";
import { MailDetail, MailItem, MailboxType, SendMailPayload } from "@/types/types";
import { useCallback, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 20;

export function useMail() {
  const [mailbox, setMailbox] = useState<MailboxType>("inbox");
  const [mails, setMails] = useState<MailItem[]>([]);
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [selectedMailDetail, setSelectedMailDetail] = useState<MailDetail | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [aiResultItems, setAiResultItems] = useState<MailItem[] | null>(null);
  const [aiResultQuery, setAiResultQuery] = useState<string | null>(null);

  const fetchList = useCallback(
    async (targetMailbox: MailboxType, pageToken?: string | null, append = false) => {
      try {
        const apiCall = targetMailbox === "sent" ? getSent : getInbox;
        const data = await apiCall({ pageToken, pageSize: DEFAULT_PAGE_SIZE });

        setNextPageToken(data.nextPageToken || null);
        setMails((prev) => (append ? [...prev, ...data.items] : data.items));

        if (!append) {
          setSelectedMailId(null);
          setSelectedMailDetail(null);
          setAiResultItems(null);
          setAiResultQuery(null);
        }
      } catch (error) {
        console.error("Error in useMail.fetchList:", error);
        if (!append) {
          setMails([]);
          setSelectedMailId(null);
          setSelectedMailDetail(null);
          setNextPageToken(null);
          setAiResultItems(null);
          setAiResultQuery(null);
        }
      }
    },
    []
  );

  const loadMailbox = useCallback(
    async (targetMailbox: MailboxType) => {
      try {
        setMailbox(targetMailbox);
        setIsListLoading(true);
        setSelectedMailId(null);
        setSelectedMailDetail(null);
        await fetchList(targetMailbox, null, false);
      } catch (error) {
        console.error("Error in useMail.loadMailbox:", error);
      } finally {
        setIsListLoading(false);
      }
    },
    [fetchList]
  );

  const loadInitialInbox = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      setMailbox("inbox");
      await fetchList("inbox", null, false);
    } catch (error) {
      console.error("Error in useMail.loadInitialInbox:", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchList]);

  const refreshCurrentMailbox = useCallback(async () => {
    try {
      setIsListLoading(true);
      setSelectedMailId(null);
      setSelectedMailDetail(null);
      setAiResultItems(null);
      setAiResultQuery(null);
      await fetchList(mailbox, null, false);
    } catch (error) {
      console.error("Error in useMail.refreshCurrentMailbox:", error);
    } finally {
      setIsListLoading(false);
    }
  }, [fetchList, mailbox]);

  const loadMore = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      await fetchList(mailbox, nextPageToken, true);
    } catch (error) {
      console.error("Error in useMail.loadMore:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchList, isLoadingMore, mailbox, nextPageToken]);

  const openMail = useCallback(
    async (mailId: string) => {
      try {
        setSelectedMailId(mailId);
        setIsDetailLoading(true);

        const detail = await getMailDetail(mailId);
        setSelectedMailDetail(detail);

        // Keep list and detail states aligned as soon as one mail is opened.
        setMails((prev) =>
          prev.map((mail) => (mail.id === mailId ? { ...mail, unread: detail.unread } : mail))
        );

        if (mailbox === "inbox" && detail.unread) {
          setMails((prev) =>
            prev.map((mail) => (mail.id === mailId ? { ...mail, unread: false } : mail))
          );
          setSelectedMailDetail((prev) =>
            prev && prev.id === mailId ? { ...prev, unread: false } : prev
          );

          try {
            await markMailRead(mailId);
          } catch (error) {
            console.error("Error in useMail.openMail.markMailRead:", error);
          }
        }
      } catch (error) {
        console.error("Error in useMail.openMail:", error);
      } finally {
        setIsDetailLoading(false);
      }
    },
    [mailbox]
  );

  const selectedMail = useMemo<MailItem | null>(() => {
    if (!selectedMailId) {
      return null;
    }
    if (selectedMailDetail && selectedMailDetail.id === selectedMailId) {
      return selectedMailDetail;
    }
    return mails.find((mail) => mail.id === selectedMailId) || null;
  }, [mails, selectedMailDetail, selectedMailId]);

  const unreadCount = useMemo(() => mails.filter((mail) => mail.unread).length, [mails]);
  const displayedMails = useMemo(() => aiResultItems ?? mails, [aiResultItems, mails]);
  const isAiResultsActive = useMemo(() => aiResultItems !== null, [aiResultItems]);

  const sendComposeMail = useCallback(
    async (payload: SendMailPayload) => {
      try {
        setIsSendingMail(true);
        await sendMail(payload);
        await refreshCurrentMailbox();
      } catch (error) {
        console.error("Error in useMail.sendComposeMail:", error);
        throw error;
      } finally {
        setIsSendingMail(false);
      }
    },
    [refreshCurrentMailbox]
  );

  const applyAiResults = useCallback((items: MailItem[], query: string) => {
    try {
      setAiResultItems(items);
      setAiResultQuery(query);
      setSelectedMailId(null);
      setSelectedMailDetail(null);
    } catch (error) {
      console.error("Error in useMail.applyAiResults:", error);
    }
  }, []);

  const clearAiResults = useCallback(() => {
    try {
      setAiResultItems(null);
      setAiResultQuery(null);
    } catch (error) {
      console.error("Error in useMail.clearAiResults:", error);
    }
  }, []);

  return {
    mailbox,
    mails,
    displayedMails,
    selectedMail,
    selectedMailId,
    unreadCount,
    isInitialLoading,
    isListLoading,
    isDetailLoading,
    isLoadingMore,
    isSendingMail,
    hasMore: !!nextPageToken,
    isAiResultsActive,
    aiResultQuery,
    loadInitialInbox,
    loadMailbox,
    refreshCurrentMailbox,
    loadMore,
    openMail,
    sendComposeMail,
    applyAiResults,
    clearAiResults,
  };
}
