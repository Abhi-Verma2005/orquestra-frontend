"use client";

import { Wallet, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PortfolioData {
  address: string;
  chain: string;
  nativeBalance: number;
  nativePriceUsd: number;
  nativeValueUsd: number;
  tokens: Array<{
    symbol: string;
    amount: number;
    priceUsd: number;
    valueUsd: number;
  }>;
  totalTokensCount?: number;
  lastUpdated?: string;
}

interface WalletBalanceResult {
  portfolios?: Array<[string, PortfolioData]>;
  summary?: string;
}

interface WalletBalanceRendererProps {
  result?: WalletBalanceResult;
}

export function WalletBalanceRenderer({ result }: WalletBalanceRendererProps) {
  if (!result || !result.portfolios || result.portfolios.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No wallet data available</p>
      </div>
    );
  }

  // Handle both tuple format [string, PortfolioData] and object format
  const portfolios = result.portfolios.map((item) => {
    if (Array.isArray(item) && item.length === 2) {
      return [item[0] as string, item[1] as PortfolioData] as [string, PortfolioData];
    }
    // Fallback: if it's already an object, try to extract chain name
    const data = item as any;
    return [data.chain || 'unknown', data] as [string, PortfolioData];
  });

  // Calculate total value across all chains
  const totalValue = portfolios.reduce((sum, [, data]) => {
    if (!data || typeof data.nativeValueUsd !== 'number') return sum;
    const chainValue = data.nativeValueUsd + (data.tokens?.reduce((tokenSum: number, token: any) => tokenSum + (token.valueUsd || 0), 0) || 0);
    return sum + chainValue;
  }, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Total Portfolio Value Header */}
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Wallet Portfolio</h2>
      </div>

      {/* Total Value Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
            <div className="text-4xl font-bold text-primary">
              ${totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chain Portfolios */}
      <div className="grid grid-cols-1 gap-4">
        {portfolios.map(([chainName, data]) => {
          const chainDisplayName = chainName === 'solana' ? 'Solana' : 'Ethereum';
          const nativeSymbol = chainName === 'solana' ? 'SOL' : 'ETH';
          const chainTotalValue = data.nativeValueUsd + (data.tokens?.reduce((sum, token) => sum + token.valueUsd, 0) || 0);

          return (
            <Card key={chainName} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-full ${
                      chainName === 'solana' ? 'bg-purple-500' : 'bg-blue-500'
                    }`} />
                    <span>{chainDisplayName}</span>
                  </div>
                  {data.lastUpdated && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {new Date(data.lastUpdated).toLocaleTimeString()}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chain Total Value */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Total Value</span>
                  <span className="text-lg font-bold">
                    ${chainTotalValue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Native Balance */}
                {data.nativeBalance > 0 && (
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="size-4 text-muted-foreground" />
                          <span className="font-semibold">{nativeSymbol}</span>
                        </div>
                        <div className="text-sm text-muted-foreground ml-6">
                          {data.nativeBalance.toFixed(6)} {nativeSymbol}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-semibold">
                          ${data.nativeValueUsd.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @ ${data.nativePriceUsd.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tokens */}
                {data.tokens && data.tokens.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Tokens</div>
                    <div className="space-y-2">
                      {data.tokens.map((token, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              {token.amount.toFixed(4)}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-semibold">
                              ${token.valueUsd.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @ ${token.priceUsd.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Address */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet className="size-3" />
                    <span className="font-mono break-all">
                      {data.address.slice(0, 8)}...{data.address.slice(-6)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

