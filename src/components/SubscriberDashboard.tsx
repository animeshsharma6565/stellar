'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Pause,
  Play,
  XOctagon,
  CheckCircle2,
  Sparkles,
  CreditCard,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from './ErrorModal';

export interface ActiveSubscription {
  id: string;
  planName: string;
  merchant: string;
  amount: number; // in sUSD
  intervalSeconds: number;
  lastPaidTimestamp: number; // UNIX seconds
  status: 'Active' | 'Paused' | 'Cancelled';
  createdTimestamp: number;
}

interface SubscriberDashboardProps {
  currentAddress: string | null;
  onError: (type: ErrorType, msg?: string) => void;
  onExplorePlans: () => void;
}

export const SubscriberDashboard: React.FC<SubscriberDashboardProps> = ({
  currentAddress,
  onError,
  onExplorePlans,
}) => {
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([
    {
      id: 'sub-1',
      planName: 'SaaS Monthly Sub',
      merchant: STELLAR_CONFIG.demoAccounts.merchant,
      amount: 50,
      intervalSeconds: 60, // 60s test interval for rapid demo
      lastPaidTimestamp: Math.floor(Date.now() / 1000) - 30, // 30s ago
      status: 'Active',
      createdTimestamp: Math.floor(Date.now() / 1000) - 300,
    },
    {
      id: 'sub-2',
      planName: 'Creator Pass Pro',
      merchant: STELLAR_CONFIG.demoAccounts.merchant,
      amount: 25,
      intervalSeconds: 300, // 5 min interval
      lastPaidTimestamp: Math.floor(Date.now() / 1000) - 200,
      status: 'Active',
      createdTimestamp: Math.floor(Date.now() / 1000) - 1000,
    },
  ]);

  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Live ticker for countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePause = async (subId: string) => {
    setActionLoading(subId);
    setTimeout(() => {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'Paused' } : s))
      );
      setActionLoading(null);
    }, 800);
  };

  const handleResume = async (subId: string) => {
    setActionLoading(subId);
    setTimeout(() => {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'Active' } : s))
      );
      setActionLoading(null);
    }, 800);
  };

  const handleCancel = async (subId: string) => {
    setActionLoading(subId);
    setTimeout(() => {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'Cancelled' } : s))
      );
      setActionLoading(null);
    }, 800);
  };

  const getRemainingTime = (lastPaid: number, interval: number) => {
    if (lastPaid === 0) return { due: true, text: 'First Billing Due Now' };
    const nextPaid = lastPaid + interval;
    const diff = nextPaid - now;
    if (diff <= 0) {
      return { due: true, text: 'Billing Renewal Due' };
    }
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return {
      due: false,
      text: `${mins > 0 ? `${mins}m ` : ''}${secs}s remaining`,
      diff,
    };
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CreditCard className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-white">Active Subscriptions</h2>
          </div>
          <p className="text-sm text-slate-400">
            Manage your decentralized recurring streams, pause payment flows, or view live renewal countdowns.
          </p>
        </div>
        <button
          onClick={onExplorePlans}
          className="z-10 inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-bg font-semibold text-sm text-white shadow-xl hover:opacity-90 transition-opacity shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Subscribe to New Plan</span>
        </button>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subscriptions.map((sub) => {
          const timeInfo = getRemainingTime(sub.lastPaidTimestamp, sub.intervalSeconds);
          const isPaused = sub.status === 'Paused';
          const isCancelled = sub.status === 'Cancelled';

          return (
            <div
              key={sub.id}
              className={`p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between space-y-6 border ${
                isCancelled
                  ? 'border-rose-900/40 opacity-70'
                  : isPaused
                  ? 'border-amber-500/30'
                  : 'border-slate-800'
              }`}
            >
              {/* Card Top */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase">
                      Plan Subscription
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">{sub.planName}</h3>
                  </div>
                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      sub.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : sub.status === 'Paused'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Merchant Vault</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${sub.merchant}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-400 hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <span>{formatAddress(sub.merchant)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Billing Amount</span>
                    <span className="font-bold text-lg text-white font-mono">
                      {sub.amount} sUSD <span className="text-xs font-normal text-slate-400">/ cycle</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Interval</span>
                    <span className="text-slate-200 text-xs font-mono">
                      Every {sub.intervalSeconds} seconds
                    </span>
                  </div>
                </div>

                {/* Renewal Countdown Box */}
                {!isCancelled && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium">
                      <Clock className="w-4 h-4 animate-spin-slow text-indigo-400" />
                      <span>Next Renewal:</span>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                        timeInfo.due
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
                      }`}
                    >
                      {isPaused ? 'Paused (Timer Frozen)' : timeInfo.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                {!isCancelled && (
                  <>
                    {sub.status === 'Active' ? (
                      <button
                        onClick={() => handlePause(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResume(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleCancel(sub.id)}
                      disabled={actionLoading === sub.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
                {isCancelled && (
                  <div className="w-full py-2 text-center text-xs text-rose-400 font-medium">
                    Subscription Cancelled on-chain
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
