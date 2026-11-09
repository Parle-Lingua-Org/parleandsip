import type { Metadata } from "next";
import { SiteDataProvider } from "@/lib/site-store";
import "./theme.css";

export const metadata: Metadata = {
  title: "Parle & Sip | French, culture & connection",
  description: "French, Francophone culture, creativity and connection. Learn. Connect. Experience. Parlez et profitez !",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteDataProvider>{children}</SiteDataProvider>
      </body>
    </html>
  );
}