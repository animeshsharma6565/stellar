'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Pause, Play, Trash2, Plus, ExternalLink, ArrowRight, Zap, Shield } from 'lucide-react';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from '@/core/handlers/ErrorModal';
import { StakingPositionRecord } from '@/types';
import {
  fetchPosition,
  fetchRecentEvents,
  pausePosition,
  resumePosition,
  terminatePosition,
  ContractCallError,
  OnChainEvent,
} from '@/utils/sorobanClient';

interface StakingDashboardProps {
  currentAddress: string | null;
  onError: (type: ErrorType, msg?: string) => void;
  onExploreStrategies: () => void;
}

const STRATEGY_NAMES: Record<number, string> = {
  1: 'DeFi Alpha Pool',
  2: 'Stellar Liquid Vault',
  3: 'Global Yield Core',
};

const STRATEGY_APY: Record<string, number> = {
  'DeFi Alpha Pool': 800,
  'Stellar Liquid Vault': 1200,
  'Global Yield Core': 1500,
};

export const StakingDashboard: React.FC<StakingDashboardProps> = ({
  currentAddress,
  onError,
  onExploreStrategies,
}) => {
  // On-chain positions are seeded under the fixed staker demo identity for this testnet build,
  // so reads always target that address; writes sign with whichever wallet is actually connected.
  const stakerAddress = STELLAR_CONFIG.demoAccounts.staker;
  const operatorAddress = STELLAR_CONFIG.demoAccounts.operator;
  const signerAddress = currentAddress || STELLAR_CONFIG.demoAccounts.staker;

  const [positions, setPositions] = useState<StakingPositionRecord[]>([]);
  const [eventLogs, setEventLogs] = useState<OnChainEvent[]>([]);
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const pos = await fetchPosition(stakerAddress, operatorAddress);
    if (pos) {
      setPositions([
        {
          id: `${pos.staker}-${pos.operator}`,
          strategyName: STRATEGY_NAMES[pos.strategy_id] ?? `Strategy #${pos.strategy_id}`,
          operator: pos.operator,
          principalAmount: Number(pos.principal_amount) / 10 ** STELLAR_CONFIG.tokenDecimals,
          lockupSeconds: Number(pos.min_duration),
          lastCheckpointTimestamp: Number(pos.last_checkpoint_timestamp),
          status: (pos.status?.tag ?? 'Active') as StakingPositionRecord['status'],
          initiatedTimestamp: Number(pos.initiated_at),
        },
      ]);
    } else {
      setPositions([]);
    }

    const events = await fetchRecentEvents(12);
    setEventLogs(events);
  }, [stakerAddress, operatorAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live timer for general lockup checks; polls real on-chain events/positions every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    const poll = setInterval(() => {
      refresh();
    }, 15000);
    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [refresh]);

  const handlePause = async (posId: string) => {
    setActionLoading(posId);
    try {
      await pausePosition(signerAddress, operatorAddress);
      await refresh();
    } catch (err: any) {
      const code = err instanceof ContractCallError ? err.message : '';
      if (code === 'SIGNATURE_REJECTED') onError('SIGNATURE_REJECTED');
      else onError('INSUFFICIENT_FUNDS', err?.message ?? 'Pause transaction failed on-chain.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (posId: string) => {
    setActionLoading(posId);
    try {
      await resumePosition(signerAddress, operatorAddress);
      await refresh();
    } catch (err: any) {
      const code = err instanceof ContractCallError ? err.message : '';
      if (code === 'SIGNATURE_REJECTED') onError('SIGNATURE_REJECTED');
      else onError('INSUFFICIENT_FUNDS', err?.message ?? 'Resume transaction failed on-chain.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTerminate = async (posId: string) => {
    setActionLoading(posId);
    try {
      await terminatePosition(signerAddress, operatorAddress);
      await refresh();
    } catch (err: any) {
      const code = err instanceof ContractCallError ? err.message : '';
      if (code === 'SIGNATURE_REJECTED') onError('SIGNATURE_REJECTED');
      else onError('INSUFFICIENT_FUNDS', err?.message ?? 'Unstake transaction failed on-chain.');
    } finally {
      setActionLoading(null);
    }
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
          const apyBps = STRATEGY_APY[pos.strategyName] ?? 800;

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
