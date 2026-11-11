"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventRecord, EventSaveInput } from "@/lib/events-shared";
import { queryKeys } from "@/lib/query-keys";
import type { SiteContent, SiteTheme } from "@/lib/site-data";
import type { TicketTemplate } from "@/lib/ticket-pdf-shared";

async function readJson<T>(response: Response) {
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.siteSettings,
    queryFn: async () => {
      const response = await fetch("/api/site-settings", { cache: "no-store" });
      return readJson<{ content: SiteContent; theme: SiteTheme; ticketTemplate: TicketTemplate }>(response);
    },
  });
}

export function usePublishedEventsQuery() {
  return useQuery({
    queryKey: queryKeys.publishedEvents,
    queryFn: async () => {
      const response = await fetch("/api/events", { cache: "no-store" });
      const result = await readJson<{ events: EventRecord[] }>(response);
      return result.events;
    },
  });
}

export function useAdminEventsQuery() {
  return useQuery({
    queryKey: queryKeys.adminEvents,
    queryFn: async () => {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const result = await readJson<{ events: EventRecord[] }>(response);
      return result.events;
    },
  });
}

export function useSaveEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: EventSaveInput) => {
      const response = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      const result = await readJson<{ event: EventRecord }>(response);
      return result.event;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminEvents }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publishedEvents }),
      ]);
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/admin/events?id=${encodeURIComponent(eventId)}`, { method: "DELETE" });
      await readJson<{ ok: boolean }>(response);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminEvents }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publishedEvents }),
      ]);
    },
  });
}

export function useSaveSiteSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content?: Partial<SiteContent>; theme?: Partial<SiteTheme>; ticketTemplate?: TicketTemplate }) => {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return readJson<{ content: SiteContent; theme: SiteTheme; ticketTemplate: TicketTemplate }>(response);
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKeys.siteSettings, data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings });
    },
  });
}
