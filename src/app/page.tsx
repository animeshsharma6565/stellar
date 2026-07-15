'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Sparkles, ExternalLink, Zap, AlertCircle, ArrowUpRight } from 'lucide-react';
import { WalletConnect } from '@/core/handlers/WalletConnect';
import { StakingDashboard } from '@/modules/staking-dashboard/StakingDashboard';
import { VaultOperator } from '@/modules/vault-operator/VaultOperator';
import { StrategyExplorer } from '@/modules/strategy-explorer/StrategyExplorer';
import { ErrorModal, ErrorType } from '@/core/handlers/ErrorModal';
import { STELLAR_CONFIG } from '@/config/contracts';
import { fetchTokenBalance } from '@/utils/sorobanClient';

export default function Home() {
  const [currentAddress, setCurrentAddress] = useState<string | null>(
    STELLAR_CONFIG.demoAccounts.staker
  );
  const [activeRole, setActiveRole] = useState<'staker' | 'operator' | 'explorer'>('staker');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState<string>('0.00');

  const triggerError = (type: ErrorType, msg?: string) => {
    setErrorType(type);
    if (msg) setErrorMessage(msg);
  };

  const refreshBalance = useCallback(async () => {
    if (!currentAddress) return;
    const bal = await fetchTokenBalance(currentAddress);
    setTokenBalance(bal.toFixed(2));
  }, [currentAddress]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <main className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col justify-between selection:bg-slate-950 selection:text-white font-sans antialiased">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-950 font-mono">SolarYield</span>
                <span className="px-2 py-0.5 rounded-none bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-mono font-bold uppercase tracking-wider">
                  Level 3
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Stellar Yield Staking & Liquidity Vaults</p>
            </div>
          </div>

          {/* Wallet Connect & Role Navigation */}
          <WalletConnect
            currentAddress={currentAddress}
            setCurrentAddress={setCurrentAddress}
            activeRole={activeRole}
            setActiveRole={setActiveRole}
            onError={triggerError}
            tokenBalance={tokenBalance}
          />
        </div>
      </header>

      {/* Main Content Body */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Error Simulation Helper Ribbon */}
        <div className="mb-8 p-5 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-slate-600 animate-pulse" />
            <span className="font-bold text-slate-800">SIMULATOR CONTROLS:</span>
            <span className="hidden md:inline">Test required Level 3 client-side exception states</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerError('NO_WALLET')}
              className="px-3 py-1.5 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-700 font-bold transition-colors"
            >
              Missing Wallet
            </button>
            <button
              onClick={() =>
                triggerError('SIGNATURE_REJECTED', 'Freighter Wallet transaction signing rejected by keysigner.')
              }
              className="px-3 py-1.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-bold transition-colors"
            >
              Rejected Signature
            </button>
            <button
              onClick={() =>
                triggerError(
                  'CYCLE_NOT_DUE',
                  'Vesting checkpoint timestamp criteria not met: Maturity expected in 14m 20s.'
                )
              }
              className="px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
            >
              Unexpired Lockup
            </button>
          </div>
        </div>

        {/* Dynamic View rendering */}
        {activeRole === 'staker' && (
          <StakingDashboard
            currentAddress={currentAddress}
            onError={triggerError}
            onExploreStrategies={() => setActiveRole('explorer')}
          />
        )}

        {activeRole === 'operator' && (
          <VaultOperator currentAddress={currentAddress} onError={triggerError} />
        )}

        {activeRole === 'explorer' && (
          <StrategyExplorer
            currentAddress={currentAddress}
            onError={triggerError}
            onSubscribed={() => setActiveRole('staker')}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-8 bg-white text-[11px] font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>SolarYield Protocol • Stellar Soroban Testnet</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contracts.yieldManager}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-800 flex items-center gap-1 hover:underline"
            >
              <span>YieldManager</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contracts.liquidityVault}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-800 flex items-center gap-1 hover:underline"
            >
              <span>LiquidityVault</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contracts.rewardToken}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-800 flex items-center gap-1 hover:underline"
            >
              <span>RewardToken</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </footer>

      {/* Error Modal overlay */}
      <ErrorModal
        errorType={errorType}
        errorMessage={errorMessage}
        onClose={() => setErrorType(null)}
      />
    </main>
  );
}
