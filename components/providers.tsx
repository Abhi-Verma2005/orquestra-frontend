"use client";

import { SessionProvider } from "next-auth/react";

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
