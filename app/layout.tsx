import { Metadata } from "next";
import { Toaster } from "sonner";

import { Providers } from "../components/providers";
import { auth } from "./(auth)/auth";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://oms-chat.vercel.app"),
  title: {
    default: "Web3 Chat",
    template: "%s | Web3 Chat",
  },
  description:
    "AI-powered Web3 chat with wallet-aware assistance and group conversations.",
  openGraph: {
    title: "Web3 Chat",
    description:
      "AI-powered Web3 chat application with wallet integration and group conversation features.",
    url: "https://oms-chat.vercel.app",
    siteName: "OMS Chat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OMS Chat Assistant",
    description:
      "AI-powered Web3 chat application with wallet integration and group conversation features.",
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
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Toaster position="top-center" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
