"use client";

import { SessionProvider } from "next-auth/react";

import { WalletProviders } from "../app/wallet-providers";
import { CartProvider } from "../contexts/cart-context";
import { SplitScreenProvider } from "../contexts/SplitScreenProvider";
import { UserInfoProvider } from "../contexts/UserInfoProvider";
import { WalletProvider } from "../contexts/wallet-context";
import { WebSocketProvider } from "../contexts/websocket-context";
import { ThemeProvider } from "./custom/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WalletProviders>
        <WalletProvider>
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
        </WalletProvider>
      </WalletProviders>
    </SessionProvider>
  );
}
