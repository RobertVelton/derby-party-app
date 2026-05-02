import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velton Derby Party — Live Odds",
  description: "Live Kentucky Derby win-pool odds dashboard.",
  applicationName: "Derby Party",
  appleWebApp: {
    capable: true,
    title: "Derby Party",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0805",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden text-derby-cream antialiased">{children}</body>
    </html>
  );
}
