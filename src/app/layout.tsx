import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RuleRoom",
  description: "A precedent memory system for Reddit moderators."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
