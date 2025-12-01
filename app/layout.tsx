import { Metadata } from "next";
import { Toaster } from "sonner";

import { Providers } from "../components/providers";
import { auth } from "./(auth)/auth";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://oms-chat.vercel.app"),
  title: {
    default: "OMS Chat Assistant",
    template: "%s | OMS Chat",
  },
  description:
    "Chat with an AI assistant and collaborate with others in group conversations.",
  openGraph: {
    title: "OMS Chat Assistant",
    description:
      "AI-powered chat application with group conversation features. Chat with AI and collaborate with others.",
    url: "https://oms-chat.vercel.app",
    siteName: "OMS Chat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OMS Chat Assistant",
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
