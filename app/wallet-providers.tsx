'use client'

import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useMemo } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Disable Coinbase CDP analytics and WalletConnect telemetry
if (typeof window !== 'undefined') {
  (window as any).DISABLE_CDP_ERROR_REPORTING = true
  ;(window as any).DISABLE_CDP_USAGE_TRACKING = true
  // Disable WalletConnect analytics
  ;(window as any).__WALLETCONNECT_DISABLE_ANALYTICS__ = true
  ;(window as any).__WALLETCONNECT_DISABLE_REMOTE_CONFIG__ = true
}

const queryClient = new QueryClient()
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id'
const chains = [mainnet] as [typeof mainnet]

// Lazy initialization of wagmi config to prevent SSR issues with IndexedDB
let wagmiConfig: ReturnType<typeof createConfig> | null = null

function getWagmiConfig() {
  if (wagmiConfig) return wagmiConfig

  // Only initialize on client side to avoid IndexedDB access during SSR
  if (typeof window === 'undefined') {
    // Return a minimal config for SSR that won't be used
    wagmiConfig = createConfig({
      ssr: true,
      chains,
      connectors: [],
      transports: {
        [mainnet.id]: http(),
      },
    })
    return wagmiConfig
  }

  // Use only injected wallet connector to avoid WalletConnect, Coinbase, and other API calls
  // This prevents external API calls to web3modal, walletconnect, and coinbase analytics
  const connectors = [
    injected({}),
  ]

  wagmiConfig = createConfig({
    ssr: true,
    chains,
    connectors,
    transports: {
      [mainnet.id]: http(),
    },
  })

  return wagmiConfig
}

export function WalletProviders({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  }, [])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )

  const config = useMemo(() => getWagmiConfig(), [])

  return (
    <WagmiProvider config={config}>
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

