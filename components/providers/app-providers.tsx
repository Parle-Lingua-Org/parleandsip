"use client";

import { useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { SiteThemeProvider } from "@/components/providers/site-theme-provider";
import { queryKeys } from "@/lib/query-keys";

const CACHE_KEY = "parle-and-sip-query-cache";
const CACHE_MAX_AGE = 1000 * 60 * 60 * 12; // 12 hours

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 12,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
}

function shouldPersistQuery(queryKey: readonly unknown[]) {
  if (queryKey[0] === queryKeys.siteSettings[0]) return true;
  if (queryKey[0] === "events" && queryKey[1] === "published") return true;
  return false;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      key: CACHE_KEY,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && shouldPersistQuery(query.queryKey),
        },
      }}
    >
      <ConfirmProvider>
        <SiteThemeProvider>{children}</SiteThemeProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "border-2 border-foreground shadow-[3px_3px_0_var(--foreground)] font-sans",
              title: "text-sm font-semibold",
              description: "text-xs",
            },
          }}
        />
      </ConfirmProvider>
    </PersistQueryClientProvider>
  );
}
