"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WalletAddresses {
  solana: string | null;
  ethereum: string | null;
}

interface WalletContextType {
  addresses: WalletAddresses;
  setSolanaAddress: (address: string | null) => void;
  setEthereumAddress: (address: string | null) => void;
  clearAddresses: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = "wallet_addresses";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<WalletAddresses>({
    solana: null,
    ethereum: null,
  });

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAddresses(parsed);
        } catch (e) {
          console.error("Failed to parse stored wallet addresses:", e);
        }
      }
    }
  }, []);

  // Save to sessionStorage whenever addresses change
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    }
  }, [addresses]);


  const setSolanaAddress = useCallback((address: string | null) => {
    setAddresses((prev) => {
      if (prev.solana === address) {
        return prev; // No change, return same reference
      }
      return { ...prev, solana: address };
    });
  }, []);

  const setEthereumAddress = useCallback((address: string | null) => {
    setAddresses((prev) => {
      if (prev.ethereum === address) {
        return prev; // No change, return same reference
      }
      return { ...prev, ethereum: address };
    });
  }, []);

  const clearAddresses = useCallback(() => {
    setAddresses({ solana: null, ethereum: null });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        addresses,
        setSolanaAddress,
        setEthereumAddress,
        clearAddresses,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletAddresses() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletAddresses must be used within WalletProvider");
  }
  return context;
}

