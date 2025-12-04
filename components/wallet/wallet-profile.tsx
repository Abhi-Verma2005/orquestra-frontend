'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletAddresses } from '@/contexts/wallet-context';

export function WalletProfile() {
  const { publicKey, disconnect: disconnectSolana } = useWallet();
  const { setVisible } = useWalletModal();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { disconnect: disconnectEth } = useDisconnect();
  const { setSolanaAddress, setEthereumAddress } = useWalletAddresses();
  
  const prevSolanaKeyRef = useRef<string | null>(null);
  const prevEthAddressRef = useRef<string | null>(null);

  // Sync Solana wallet address
  useEffect(() => {
    const currentAddress = publicKey ? publicKey.toString() : null;
    if (prevSolanaKeyRef.current !== currentAddress) {
      prevSolanaKeyRef.current = currentAddress;
      setSolanaAddress(currentAddress);
    }
  }, [publicKey, setSolanaAddress]);

  // Sync Ethereum wallet address
  useEffect(() => {
    const currentAddress = isEthConnected && ethAddress ? ethAddress : null;
    if (prevEthAddressRef.current !== currentAddress) {
      prevEthAddressRef.current = currentAddress;
      setEthereumAddress(currentAddress);
    }
  }, [isEthConnected, ethAddress, setEthereumAddress]);

  const handleConnectSolana = () => {
    setVisible(true);
  };

  const handleDisconnectSolana = async () => {
    await disconnectSolana();
    setSolanaAddress(null);
  };

  const handleDisconnectEthereum = async () => {
    disconnectEth();
    setEthereumAddress(null);
  };

  const hasConnectedWallets = publicKey || (isEthConnected && ethAddress);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full relative"
        >
          <User className="size-4" />
          {hasConnectedWallets && (
            <span className="absolute top-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Wallet Connections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Solana Wallet */}
        <div className="px-2 py-1.5">
          <div className="text-xs text-muted-foreground mb-2">Solana</div>
          {publicKey ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground truncate">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectSolana}
                className="h-7"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectSolana}
              className="w-full h-7"
            >
              Connect Solana
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Ethereum Wallet */}
        <div className="px-2 py-1.5">
          <div className="text-xs text-muted-foreground mb-2">Ethereum</div>
          {isEthConnected && ethAddress ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground truncate">
                {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectEthereum}
                className="h-7"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <ConnectButton />
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

