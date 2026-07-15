'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, CheckSquare, Copy, Shield, LogOut } from 'lucide-react';
import * as freighter from '@stellar/freighter-api';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from './ErrorModal';

interface WalletConnectProps {
  currentAddress: string | null;
  setCurrentAddress: (addr: string | null) => void;
  activeRole: 'staker' | 'operator' | 'explorer';
  setActiveRole: (role: 'staker' | 'operator' | 'explorer') => void;
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
    <div className="flex flex-wrap items-center gap-4">
      {/* Role Tabs */}
      <div className="flex bg-[#f3f4f6] p-1 border border-slate-200 rounded-none">
        <button
          onClick={() => {
            setActiveRole('staker');
            if (!currentAddress) setCurrentAddress(STELLAR_CONFIG.demoAccounts.staker);
          }}
          className={`px-4 py-2 text-xs font-mono font-medium transition-all rounded-none ${
            activeRole === 'staker'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Staking Portal
        </button>
        <button
          onClick={() => {
            setActiveRole('operator');
            if (!currentAddress) setCurrentAddress(STELLAR_CONFIG.demoAccounts.operator);
          }}
          className={`px-4 py-2 text-xs font-mono font-medium transition-all rounded-none ${
            activeRole === 'operator'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Operator Vault
        </button>
        <button
          onClick={() => setActiveRole('explorer')}
          className={`px-4 py-2 text-xs font-mono font-medium transition-all rounded-none ${
            activeRole === 'explorer'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Strategy Explorer
        </button>
      </div>

      {/* Connection Indicator */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-700 text-xs font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Stellar Testnet</span>
      </div>

      {/* Connect Status */}
      {currentAddress ? (
        <div className="flex items-center gap-2 border border-slate-200 bg-white p-1.5 pl-4 text-xs rounded-none">
          <div className="flex items-center gap-2 font-mono">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-slate-800">{truncateAddress(currentAddress)}</span>
            <button
              onClick={handleCopyAddress}
              title="Copy Address"
              className="text-slate-400 hover:text-slate-900 p-0.5 transition-colors"
            >
              {copied ? (
                <span className="text-[10px] text-emerald-600 font-mono">copied</span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

          <div className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-800 font-mono text-[11px]">
            {tokenBalance} syUSD
          </div>

          <button
            onClick={() => setCurrentAddress(null)}
            title="Disconnect Wallet"
            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnectWallet}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 font-mono font-medium text-xs text-white transition-colors rounded-none disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          <span>{loading ? 'CONNECTING...' : 'CONNECT WALLET'}</span>
        </button>
      )}
    </div>
  );
};
