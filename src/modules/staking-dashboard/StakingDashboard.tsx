'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Pause, Play, Trash2, Plus, ExternalLink, ArrowRight, Zap, Shield } from 'lucide-react';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from '@/core/handlers/ErrorModal';
import { StakingPositionRecord } from '@/types';

interface StakingDashboardProps {
  currentAddress: string | null;
  onError: (type: ErrorType, msg?: string) => void;
  onExploreStrategies: () => void;
}

interface EventLog {
  id: string;
  time: string;
  contract: string;
  topic: string;
  data: string;
}

export const StakingDashboard: React.FC<StakingDashboardProps> = ({
  currentAddress,
  onError,
  onExploreStrategies,
}) => {
  const [positions, setPositions] = useState<StakingPositionRecord[]>([
    {
      id: 'pos-1',
      strategyName: 'DeFi Alpha Pool',
      operator: STELLAR_CONFIG.demoAccounts.operator,
      principalAmount: 1000,
      lockupSeconds: 60, // 60s for rapid test
      lastCheckpointTimestamp: Math.floor(Date.now() / 1000) - 30, // 30s ago
      status: 'Active',
      initiatedTimestamp: Math.floor(Date.now() / 1000) - 300,
    },
    {
      id: 'pos-2',
      strategyName: 'Stellar Liquid Vault',
      operator: STELLAR_CONFIG.demoAccounts.operator,
      principalAmount: 2500,
      lockupSeconds: 300, // 5 mins
      lastCheckpointTimestamp: Math.floor(Date.now() / 1000) - 120, // 120s ago
      status: 'Active',
      initiatedTimestamp: Math.floor(Date.now() / 1000) - 1000,
    },
  ]);

  const [eventLogs, setEventLogs] = useState<EventLog[]>([
    {
      id: 'evt-1',
      time: new Date(Date.now() - 300000).toLocaleTimeString(),
      contract: 'CBW5...2H2',
      topic: 'strategy',
      data: `[id: 1, operator: GBJV...HIZ, APY: 800bps]`,
    },
    {
      id: 'evt-2',
      time: new Date(Date.now() - 250000).toLocaleTimeString(),
      contract: 'CBW5...2H2',
      topic: 'stake',
      data: `[staker: GDL7...7U, amount: 1000 syUSD]`,
    },
  ]);

  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Live timer for general lockup checks
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addEventLog = (topic: string, data: string) => {
    const newLog: EventLog = {
      id: `evt-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      contract: 'CBW5...2H2',
      topic,
      data,
    };
    setEventLogs((prev) => [newLog, ...prev]);
  };

  const handlePause = async (posId: string) => {
    setActionLoading(posId);
    setTimeout(() => {
      setPositions((prev) =>
        prev.map((p) => (p.id === posId ? { ...p, status: 'Paused' } : p))
      );
      addEventLog('status', `[staker: GDL7...7U, status: Paused]`);
      setActionLoading(null);
    }, 600);
  };

  const handleResume = async (posId: string) => {
    setActionLoading(posId);
    setTimeout(() => {
      setPositions((prev) =>
        prev.map((p) => (p.id === posId ? { ...p, status: 'Active' } : p))
      );
      addEventLog('status', `[staker: GDL7...7U, status: Active]`);
      setActionLoading(null);
    }, 600);
  };

  const handleTerminate = async (posId: string) => {
    setActionLoading(posId);
    setTimeout(() => {
      setPositions((prev) =>
        prev.map((p) => (p.id === posId ? { ...p, status: 'Terminated' } : p))
      );
      addEventLog('status', `[staker: GDL7...7U, status: Terminated]`);
      setActionLoading(null);
    }, 600);
  };

  const getLockupProgress = (lastCheckpoint: number, lockup: number) => {
    if (lastCheckpoint === 0) return { unlocked: true, text: 'First checkpoint available' };
    const nextCheckpoint = lastCheckpoint + lockup;
    const diff = nextCheckpoint - now;
    if (diff <= 0) {
      return { unlocked: true, text: 'Checkpoint Available' };
    }
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return {
      unlocked: false,
      text: `Maturity: ${mins > 0 ? `${mins}m ` : ''}${secs}s locked`,
      diff,
    };
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview Banner */}
      <div className="p-8 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 text-slate-800 border border-slate-200">
              <Zap className="w-5 h-5 text-slate-900" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-mono">STAKING OVERVIEW</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-sans">
            Monitor decentralized liquidity allocations, trigger yield aggregation events on-chain, or terminate locked portfolios.
          </p>
        </div>
        <button
          onClick={onExploreStrategies}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-950 hover:bg-slate-800 text-xs font-mono font-medium text-white transition-colors rounded-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>STAKE CAPITAL</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {positions.map((pos) => {
          const progress = getLockupProgress(pos.lastCheckpointTimestamp, pos.lockupSeconds);
          const isPaused = pos.status === 'Paused';
          const isTerminated = pos.status === 'Terminated';
          const apyBps = pos.id === 'pos-1' ? 800 : 1200; // 8% or 12%

          return (
            <div
              key={pos.id}
              className={`p-8 bg-white border flex flex-col justify-between space-y-6 ${
                isTerminated
                  ? 'border-slate-100 opacity-60'
                  : isPaused
                  ? 'border-amber-200'
                  : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      Strategy Allocation
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 font-sans">{pos.strategyName}</h3>
                  </div>
                  <span
                    className={`px-3 py-1 text-[10px] font-mono font-bold uppercase border ${
                      pos.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : pos.status === 'Paused'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {pos.status}
                  </span>
                </div>

                {/* Ticker Box */}
                {!isTerminated && (
                  <LiveYieldTicker
                    principal={pos.principalAmount}
                    apyBps={apyBps}
                    lastCheckpoint={pos.lastCheckpointTimestamp}
                    isPaused={isPaused}
                  />
                )}

                <div className="p-4 bg-slate-50 border border-slate-100 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Vault Operator</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${pos.operator}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-800 hover:text-slate-950 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{formatAddress(pos.operator)}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Principal Deposit</span>
                    <span className="font-bold text-slate-900">
                      {pos.principalAmount} syUSD
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expected Yield (APY)</span>
                    <span className="text-emerald-600 font-bold">{(apyBps / 100).toFixed(2)}%</span>
                  </div>
                </div>

                {/* Countdown Progress */}
                {!isTerminated && (
                  <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lockup Maturity:</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 border ${
                        progress.unlocked
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isPaused ? 'Timer Frozen (Paused)' : progress.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                {!isTerminated && (
                  <>
                    {pos.status === 'Active' ? (
                      <button
                        onClick={() => handlePause(pos.id)}
                        disabled={actionLoading === pos.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-700 font-mono text-[11px] font-medium transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>PAUSE</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResume(pos.id)}
                        disabled={actionLoading === pos.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-mono text-[11px] font-medium transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>RESUME</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTerminate(pos.id)}
                      disabled={actionLoading === pos.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-mono text-[11px] font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>UNSTAKE</span>
                    </button>
                  </>
                )}
                {isTerminated && (
                  <div className="w-full py-2 text-center font-mono text-xs text-rose-700 bg-rose-50/20 border border-rose-100">
                    Liquidity terminated & principal returned
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* On-Chain Events Ledger Section */}
      <div className="p-8 bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 font-mono">ON-CHAIN EVENT LEDGER (SOROBAN POLLING)</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            Listening to Stellar Testnet RPC...
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-150 font-mono text-xs divide-y divide-slate-200/60 max-h-48 overflow-y-auto space-y-2">
          {eventLogs.map((log) => (
            <div key={log.id} className="pt-2 flex items-start gap-4">
              <span className="text-slate-400 shrink-0">{log.time}</span>
              <span className="text-slate-800 font-bold shrink-0">{log.contract}</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 font-bold uppercase text-[9px] border border-slate-300 shrink-0">
                {log.topic}
              </span>
              <span className="text-slate-600 break-all">{log.data}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* Real-Time Precision Yield Ticker Component */
interface TickerProps {
  principal: number;
  apyBps: number;
  lastCheckpoint: number;
  isPaused: boolean;
}

const SECONDS_PER_YEAR = 31536000;

export const LiveYieldTicker: React.FC<TickerProps> = ({
  principal,
  apyBps,
  lastCheckpoint,
  isPaused,
}) => {
  const [accrued, setAccrued] = useState<number>(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const updateTicker = () => {
      if (isPaused) {
        const elapsed = Math.max(0, lastCheckpoint - lastCheckpoint);
        const yieldAmount = (principal * apyBps * elapsed) / (10000 * SECONDS_PER_YEAR);
        setAccrued(yieldAmount);
        return;
      }

      const elapsedMs = Date.now() - (lastCheckpoint * 1000);
      const elapsedSeconds = Math.max(0, elapsedMs / 1000);
      const yieldVal = (principal * apyBps * elapsedSeconds) / (10000 * SECONDS_PER_YEAR);
      setAccrued(yieldVal);

      animationFrameId.current = requestAnimationFrame(updateTicker);
    };

    updateTicker();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [principal, apyBps, lastCheckpoint, isPaused]);

  return (
    <div className="p-5 border border-emerald-100 bg-emerald-50/20 flex flex-col items-start gap-1">
      <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase tracking-widest">
        Accruing Yield (syUSD)
      </span>
      <span className="text-3xl font-mono font-bold tracking-tight text-emerald-800 leading-none">
        {accrued.toFixed(8)}
      </span>
    </div>
  );
};
