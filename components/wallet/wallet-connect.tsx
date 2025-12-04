'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

import { Button } from '@/components/ui/button';
import { useWalletAddresses } from '@/contexts/wallet-context';

export function WalletConnect() {
  const { publicKey, disconnect: disconnectSolana } = useWallet();
  const { setVisible } = useWalletModal();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { disconnect: disconnectEth } = useDisconnect();
  const { setSolanaAddress, setEthereumAddress } = useWalletAddresses();

  // Sync Solana wallet address
  useEffect(() => {
    if (publicKey) {
      setSolanaAddress(publicKey.toString());
    } else {
      setSolanaAddress(null);
    }
  }, [publicKey, setSolanaAddress]);

  // Sync Ethereum wallet address
  useEffect(() => {
    if (isEthConnected && ethAddress) {
      setEthereumAddress(ethAddress);
    } else {
      setEthereumAddress(null);
    }
  }, [isEthConnected, ethAddress, setEthereumAddress]);

  const handleConnectSolana = () => {
    setVisible(true);
  };

  const handleDisconnectSolana = async () => {
    await disconnectSolana();
    setSolanaAddress(null);
  };

  const handleDisconnectEthereum = () => {
    disconnectEth();
    setEthereumAddress(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Solana Wallet */}
      <div className="flex items-center gap-2">
        {publicKey ? (
          <>
            <span className="text-sm text-muted-foreground">
              Solana: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnectSolana}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectSolana}
          >
            Connect Solana
          </Button>
        )}
      </div>

      {/* Ethereum Wallet */}
      <div className="flex items-center gap-2">
        {isEthConnected && ethAddress ? (
          <>
            <span className="text-sm text-muted-foreground">
              Ethereum: {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnectEthereum}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <ConnectButton />
        )}
      </div>
    </div>
  );
}

