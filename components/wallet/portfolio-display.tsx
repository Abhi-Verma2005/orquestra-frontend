'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Token {
  symbol: string;
  amount: number;
  priceUsd: number;
  valueUsd: number;
  priceChange24h?: number | null;
}

interface PortfolioData {
  chain: string;
  address: string;
  nativeBalance: number;
  nativePriceUsd: number;
  nativeValueUsd: number;
  tokens: Token[];
  totalTokensCount?: number;
  lastUpdated?: string;
}

interface PortfolioDisplayProps {
  data: PortfolioData;
}

export function PortfolioDisplay({ data }: PortfolioDisplayProps) {
  const totalValue = data.nativeValueUsd + data.tokens.reduce((sum, token) => sum + token.valueUsd, 0);
  const chainName = data.chain === 'solana' ? 'Solana' : 'Ethereum';
  const nativeSymbol = data.chain === 'solana' ? 'SOL' : 'ETH';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{chainName} Portfolio</span>
          {data.lastUpdated && (
            <span className="text-xs text-muted-foreground font-normal">
              Updated {new Date(data.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Value */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
          <div className="text-3xl font-bold">${totalValue.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}</div>
        </div>

        {/* Native Balance */}
        {data.nativeBalance > 0 && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{nativeSymbol}</div>
                <div className="text-sm text-muted-foreground">
                  {data.nativeBalance.toFixed(6)} {nativeSymbol}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  ${data.nativeValueUsd.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  ${data.nativePriceUsd.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tokens */}
        {data.tokens.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Tokens</div>
            <div className="space-y-2">
              {data.tokens.map((token, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {token.amount.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${token.valueUsd.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                    {token.priceChange24h !== undefined && token.priceChange24h !== null && (
                      <div
                        className={`text-sm ${
                          token.priceChange24h >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {token.priceChange24h >= 0 ? '+' : ''}
                        {token.priceChange24h.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div className="text-xs text-muted-foreground break-all">
          {data.address.slice(0, 6)}...{data.address.slice(-4)}
        </div>
      </CardContent>
    </Card>
  );
}

