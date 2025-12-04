'use client'

import { RainbowKitProvider, connectorsForWallets, getDefaultWallets } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useMemo } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'

// Disable Coinbase CDP analytics
if (typeof window !== 'undefined') {
  (window as any).DISABLE_CDP_ERROR_REPORTING = true
  ;(window as any).DISABLE_CDP_USAGE_TRACKING = true
}

const queryClient = new QueryClient()
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id'
const chains = [mainnet] as [typeof mainnet]

const { wallets } = getDefaultWallets({
  appName: 'Cursorr',
  projectId,
})

// Filter out Coinbase Wallet to prevent analytics calls to cca-lite.coinbase.com.
// `getDefaultWallets` returns wallet *groups*, and the concrete wallet configs are
// not strongly typed with an `id` field here, so we use a relaxed type to inspect it.
const walletsWithoutCoinbase = wallets.filter((walletGroup: any) => {
  if (!walletGroup?.id) return true; // Keep groups without an id
  return !walletGroup.id.toLowerCase().includes('coinbase');
});

const connectors = connectorsForWallets(walletsWithoutCoinbase, {
  appName: 'Cursorr',
  projectId,
})

const wagmiConfig = createConfig({
  ssr: true,
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
  },
})

export function WalletProviders({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  }, [])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

