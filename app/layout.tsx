import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}