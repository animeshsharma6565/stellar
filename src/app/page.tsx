'use client';

import React, { useState } from 'react';
import { Shield, CreditCard, Vault, Layers, Sparkles, ExternalLink, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { WalletConnect } from '@/components/WalletConnect';
import { SubscriberDashboard } from '@/components/SubscriberDashboard';
import { MerchantDashboard } from '@/components/MerchantDashboard';
import { PlanExplorer } from '@/components/PlanExplorer';
import { ErrorModal, ErrorType } from '@/components/ErrorModal';
import { STELLAR_CONFIG } from '@/config/contracts';

export default function Home() {
  const [currentAddress, setCurrentAddress] = useState<string | null>(
    STELLAR_CONFIG.demoAccounts.subscriber
  );
  const [activeRole, setActiveRole] = useState<'subscriber' | 'merchant' | 'explorer'>('subscriber');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState<string>('950');

  const triggerError = (type: ErrorType, msg?: string) => {
    setErrorType(type);
    if (msg) setErrorMessage(msg);
  };

  return (
    <main className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">SubScript</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold">
                  LEVEL 3
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Decentralized Recurring Billing on Soroban</p>
            </div>
          </div>

          {/* Wallet Connect & Navigation */}
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
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Error Simulation Helper Ribbon */}
        <div className="mb-6 p-4 rounded-xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-200">Interactive Error Handler Playground:</span>
            <span className="hidden md:inline">Test required Level 3 dApp error state feedback</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerError('NO_WALLET')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors font-medium"
            >
              Simulate Missing Wallet
            </button>
            <button
              onClick={() =>
                triggerError('SIGNATURE_REJECTED', 'User cancelled transaction signing request in Freighter.')
              }
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors font-medium"
            >
              Simulate Rejected Signature
            </button>
            <button
              onClick={() =>
                triggerError(
                  'CYCLE_NOT_DUE',
                  'Billing cycle interval not met: Next collection available in 14m 20s.'
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors font-medium"
            >
              Simulate Cycle Not Due
            </button>
          </div>
        </div>

        {/* Dynamic View rendering */}
        {activeRole === 'subscriber' && (
          <SubscriberDashboard
            currentAddress={currentAddress}
            onError={triggerError}
            onExplorePlans={() => setActiveRole('explorer')}
          />
        )}

        {activeRole === 'merchant' && (
          <MerchantDashboard currentAddress={currentAddress} onError={triggerError} />
        )}

        {activeRole === 'explorer' && (
          <PlanExplorer
            currentAddress={currentAddress}
            onError={triggerError}
            onSubscribed={() => setActiveRole('subscriber')}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>SubScript dApp • Stellar Soroban Testnet</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contracts.subscriptionManager}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>SubscriptionManager</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contracts.merchantVault}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>MerchantVault</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contracts.token}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Token Contract</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Error Modal */}
      <ErrorModal
        errorType={errorType}
        errorMessage={errorMessage}
        onClose={() => setErrorType(null)}
      />
    </main>
  );
}
