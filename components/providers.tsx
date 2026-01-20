"use client";

import { SessionProvider } from "next-auth/react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

import { CartProvider } from "../contexts/cart-context";
import { SplitScreenProvider } from "../contexts/SplitScreenProvider";
import { UserInfoProvider } from "../contexts/UserInfoProvider";
import { WebSocketProvider } from "../contexts/websocket-context";
import { ThemeProvider } from "./custom/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <ThemeAwareToaster />
        <WebSocketProvider>
          <SplitScreenProvider>
            <UserInfoProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </UserInfoProvider>
          </SplitScreenProvider>
        </WebSocketProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

function ThemeAwareToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={theme as "light" | "dark" | "system"}
      richColors
    />
  );
}
