import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sidequest | Find your next favorite game",
  description: "A home for the games you haven't played yet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}