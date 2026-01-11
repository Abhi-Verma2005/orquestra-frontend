import { Metadata } from "next";
import { Toaster } from "sonner";

// SSR-safe polyfills (must be imported before any browser-only libs run)
import "./polyfills/indexeddb";

import { Providers } from "../components/providers";
import { auth } from "./(auth)/auth";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://oms-chat.vercel.app"),
  title: {
    default: "AI Chat",
    template: "%s | AI Chat",
  },
  description:
    "AI-powered chat with structured assistance and group conversations.",
  openGraph: {
    title: "AI Chat",
    description:
      "AI-powered chat application with group conversation features.",
    url: "https://oms-chat.vercel.app",
    siteName: "OMS Chat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat Assistant",
    description:
      "AI-powered chat application with group conversation features.",
  },
  alternates: {
    canonical: "https://oms-chat.vercel.app/",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <Toaster position="top-center" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
