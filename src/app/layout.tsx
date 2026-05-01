import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velton Derby Party — Live Odds",
  description: "Live Kentucky Derby win-pool odds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden text-derby-cream antialiased">{children}</body>
    </html>
  );
}
