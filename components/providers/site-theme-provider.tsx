"use client";

import { useEffect, type ReactNode } from "react";
import { useSiteSettingsQuery } from "@/hooks/use-site-data";
import { initialSiteData } from "@/lib/site-data";

export function SiteThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useSiteSettingsQuery();
  const content = data?.content ?? initialSiteData.content;
  const theme = data?.theme ?? initialSiteData.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--foreground", theme.foreground);
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--muted-foreground", theme.mutedForeground);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--ring", theme.ring);
    root.style.setProperty("--info", theme.info);
    document.title = `${content.brandName} | French, culture & connection`;

    if (content.faviconImage) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      icon.href = content.faviconImage;
    }
  }, [content.brandName, content.faviconImage, theme]);

  return children;
}
