'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, Copy, ShieldCheck } from 'lucide-react';
import * as freighter from '@stellar/freighter-api';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from './ErrorModal';

interface WalletConnectProps {
  currentAddress: string | null;
  setCurrentAddress: (addr: string | null) => void;
  activeRole: 'subscriber' | 'merchant' | 'explorer';
  setActiveRole: (role: 'subscriber' | 'merchant' | 'explorer') => void;
  onError: (type: ErrorType, msg?: string) => void;
  tokenBalance: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  currentAddress,
  setCurrentAddress,
  activeRole,
  setActiveRole,
  onError,
  tokenBalance,
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkFreighterConnection();
  }, []);

  const checkFreighterConnection = async () => {
    try {
      if (typeof window !== 'undefined' && freighter.isConnected) {
        const connected = await freighter.isConnected();
        if (connected) {
          const fn = (freighter as any).getAddress || (freighter as any).requestAccess;
          if (fn) {
            const res = await fn();
            const addr = typeof res === 'string' ? res : res?.address;
            if (addr) setCurrentAddress(addr);
          }
        }
      }
    } catch {
      // Wallet not detected or user ignored prompt
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const checkFn = freighter.isConnected;
      if (!checkFn) {
        onError('NO_WALLET');
        setLoading(false);
        return;
      }
      const connected = await checkFn();
      if (!connected) {
        onError('NO_WALLET');
        setLoading(false);
        return;
      }

      const getAddrFn = (freighter as any).getAddress || (freighter as any).requestAccess;
      if (getAddrFn) {
        const res = await getAddrFn();
        const addr = typeof res === 'string' ? res : res?.address;
        if (addr) {
          setCurrentAddress(addr);
        } else {
          onError('NO_WALLET');
        }
      } else {
        onError('NO_WALLET');
      }
    } catch (err: any) {
      if (err?.message?.includes('User declined') || err?.message?.includes('User rejected')) {
        onError('SIGNATURE_REJECTED', 'User declined wallet connection request.');
      } else {
        onError('NO_WALLET');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (!currentAddress) return;
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-4)}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Role Selector Tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            setActiveRole('subscriber');
            if (!currentAddress) setCurrentAddress(STELLAR_CONFIG.demoAccounts.subscriber);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeRole === 'subscriber'
              ? 'gradient-bg text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Subscriber Portal
        </button>
        <button
          onClick={() => {
            setActiveRole('merchant');
            if (!currentAddress) setCurrentAddress(STELLAR_CONFIG.demoAccounts.merchant);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeRole === 'merchant'
              ? 'gradient-bg text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Merchant Vault
        </button>
        <button
          onClick={() => setActiveRole('explorer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeRole === 'explorer'
              ? 'gradient-bg text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Plan Explorer
        </button>
      </div>

      {/* Network Badge */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Stellar Testnet</span>
      </div>

      {/* Wallet Status / Connect Button */}
      {currentAddress ? (
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 pl-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-slate-200">{truncateAddress(currentAddress)}</span>
            <button
              onClick={handleCopyAddress}
              title="Copy Address"
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800"></div>

          <div className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-medium">
            {tokenBalance} sUSD
          </div>

          <button
            onClick={() => setCurrentAddress(null)}
            className="px-2 py-1 text-slate-400 hover:text-rose-400 transition-colors text-[11px]"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnectWallet}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg font-semibold text-xs text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          <span>{loading ? 'Connecting...' : 'Connect Freighter'}</span>
        </button>
      )}
    </div>
  );
};
