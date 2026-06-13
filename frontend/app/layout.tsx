import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RallyLens — Video review workspace for racket-sport coaches",
    template: "%s · RallyLens",
  },
  description:
    "Upload match or practice footage, tag key moments, write coach notes, and share clean review sessions with athletes. Turn a 45-minute training video into a 5-minute coached review.",
  metadataBase: new URL("https://rallylens.app"),
  openGraph: {
    title: "RallyLens",
    description: "Video review workspace for racket-sport coaches.",
    type: "website",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
