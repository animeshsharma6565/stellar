'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Clock, CheckCircle, ArrowRight, X } from 'lucide-react';
import { getStrategies, registerStrategy, approveVaultAllowance, initiateStaking, ContractCallError } from '@/utils/sorobanClient';
import { ErrorType } from '@/core/handlers/ErrorModal';
import { StakingStrategy } from '@/types';

interface StrategyExplorerProps {
  currentAddress: string | null;
  onError: (type: ErrorType, msg?: string) => void;
  onSubscribed: () => void;
}

const STATIC_METADATA: Record<number, { description: string; features: string[] }> = {
  1: {
    description: 'Direct yield pools utilizing stable rate arbitrage protocols on Stellar Network.',
    features: ['8.00% Target APY', 'Continuous Accruals', 'Low slippage checkpoint lockups']
  },
  2: {
    description: 'High APY vault optimization strategies utilizing compound automated liquidity routing.',
    features: ['12.00% Target APY', 'Auto-compounding simulators', 'Premium liquidity provisions']
  }
};

export const StrategyExplorer: React.FC<StrategyExplorerProps> = ({
  currentAddress,
  onError,
  onSubscribed,
}) => {
  const [strategies, setStrategies] = useState<StakingStrategy[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  
  // Staking state
  const [stakeAmount, setStakeAmount] = useState<string>('500');
  const [subscribingId, setSubscribingId] = useState<number | null>(null);

  // Form registration state
  const [newName, setNewName] = useState<string>('');
  const [newApy, setNewApy] = useState<string>('10');
  const [newLockup, setNewLockup] = useState<string>('60');
  const [registering, setRegistering] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getStrategies();
      const mapped = data.map((d: any) => {
        const meta = STATIC_METADATA[d.strategy_id] ?? {
          description: 'Custom on-chain yield staking vault template.',
          features: [`${(d.apy_bps / 100).toFixed(2)}% Target APY`, 'Secured locks', 'Operator controlled distributions']
        };
        return {
          id: d.strategy_id,
          name: d.name,
          description: meta.description,
          apyBps: d.apy_bps,
          lockupSeconds: d.lockup_seconds,
          operator: d.operator,
          active: d.active,
          features: meta.features
        };
      });
      setStrategies(mapped);
    } catch (err) {
      console.error('Failed to load strategies:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubscribe = async (strategy: StakingStrategy) => {
    if (!currentAddress) {
      onError('NO_WALLET');
      return;
    }
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      onError('INSUFFICIENT_FUNDS', 'Enter a valid positive stake amount.');
      return;
    }

    setSubscribingId(strategy.id);
    try {
      await approveVaultAllowance(currentAddress, amount);
      await initiateStaking(currentAddress, strategy.operator, strategy.id, amount);
      onSubscribed();
    } catch (err: any) {
      const code = err instanceof ContractCallError ? err.message : '';
      if (code === 'SIGNATURE_REJECTED') onError('SIGNATURE_REJECTED');
      else if (code === 'INSUFFICIENT_FUNDS') onError('INSUFFICIENT_FUNDS', 'Wallet balance or allowance too low for this stake amount.');
      else onError('INSUFFICIENT_FUNDS', err?.message ?? 'Staking transaction failed on-chain.');
    } finally {
      setSubscribingId(null);
    }
  };

  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !currentAddress) return;
    const apyPct = parseFloat(newApy) || 10;
    const nextId = strategies.length > 0 ? Math.max(...strategies.map((s) => s.id)) + 1 : 1;

    setRegistering(true);
    try {
      await registerStrategy(
        currentAddress,
        nextId,
        newName,
        Math.round(apyPct * 100),
        parseInt(newLockup) || 60
      );
      setShowCreateModal(false);
      setNewName('');
      await refresh();
    } catch (err: any) {
      const code = err instanceof ContractCallError ? err.message : '';
      if (code === 'SIGNATURE_REJECTED') onError('SIGNATURE_REJECTED');
      else onError('INSUFFICIENT_FUNDS', err?.message ?? 'Strategy registration failed on-chain.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="p-8 bg-white border border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-all">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 border border-slate-900">
              <Layers className="w-5 h-5 text-slate-800" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-mono">STRATEGY EXPLORER</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-sans">
            Discover on-chain staking strategies, subscribe to yield pools, or register custom strategy templates.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-950 hover:bg-slate-800 text-xs font-mono font-medium text-white transition-colors rounded-none shrink-0 border border-slate-950"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER STRATEGY</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strat) => (
          <div
            key={strat.id}
            className="p-8 fintech-card flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Strategy Pool #{strat.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 font-sans">{strat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{strat.description}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-2xl font-bold font-mono text-slate-950">
                  {(strat.apyBps / 100).toFixed(2)}% <span className="text-xs font-mono text-slate-400">APY</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lockup: {strat.lockupSeconds} seconds</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">Highlights:</span>
                <ul className="space-y-2">
                  {strat.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Amount syUSD"
                className="w-full px-3 py-2 border border-slate-900 focus:outline-none focus:bg-slate-50 text-xs font-mono text-slate-800 bg-white"
              />
              <button
                onClick={() => handleSubscribe(strat)}
                disabled={subscribingId === strat.id}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
              >
                <span>{subscribingId === strat.id ? 'AUTHORIZING...' : 'STAKE INTO POOL'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {strategies.length === 0 && (
        <div className="p-8 bg-white border border-slate-200 text-center text-xs font-mono text-slate-400">
          Loading strategies from YieldPoolManager on Stellar Testnet…
        </div>
      )}

      {/* Register Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-8 bg-white border border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-mono">REGISTER YIELD STRATEGY</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStrategy} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Strategy Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. DeFi Vault Alpha"
                  className="w-full px-3 py-2 border border-slate-900 focus:outline-none focus:bg-slate-50 text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">APY (%)</label>
                  <input
                    type="number"
                    required
                    value={newApy}
                    onChange={(e) => setNewApy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-900 focus:outline-none focus:bg-slate-50 text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Lockup (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={newLockup}
                    onChange={(e) => setNewLockup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-900 focus:outline-none focus:bg-slate-50 text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs transition-colors disabled:opacity-50"
                >
                  {registering ? 'Publishing...' : 'Publish Strategy'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
