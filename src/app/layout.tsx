import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Velton's Kentucky Derby Party",
  description: "Live odds dashboard for the Kentucky Derby. Informational only.",
  applicationName: "Derby Party",
  appleWebApp: {
    capable: true,
    title: "Derby Party",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },
  openGraph: {
    title: "Velton's Kentucky Derby Party",
    description: "Live odds for the Kentucky Derby. Informational only.",
    siteName: "Velton's Kentucky Derby Party",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velton's Kentucky Derby Party",
    description: "Live odds for the Kentucky Derby. Informational only.",
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
