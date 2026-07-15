'use client';

import React, { useState } from 'react';
import { Layers, Plus, ArrowRight, CheckCircle, Clock, X } from 'lucide-react';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from '@/core/handlers/ErrorModal';
import { StakingStrategy } from '@/types';

interface StrategyExplorerProps {
  currentAddress: string | null;
  onError: (type: ErrorType, msg?: string) => void;
  onSubscribed: () => void;
}

export const StrategyExplorer: React.FC<StrategyExplorerProps> = ({
  currentAddress,
  onError,
  onSubscribed,
}) => {
  const [strategies, setStrategies] = useState<StakingStrategy[]>([
    {
      id: 1,
      name: 'DeFi Alpha Pool',
      operator: STELLAR_CONFIG.demoAccounts.operator,
      apyBps: 800, // 8%
      lockupSeconds: 60,
      description: 'High frequency testnet yield strategy with a 60-second checkpoint maturity.',
      features: [
        'Maturity interval: 60s rapid testing',
        'Direct smart contract authorization',
        'Pause & resume mechanisms',
        'Instant liquidity settlement',
      ],
    },
    {
      id: 2,
      name: 'Stellar Liquid Vault',
      operator: STELLAR_CONFIG.demoAccounts.operator,
      apyBps: 1200, // 12%
      lockupSeconds: 300,
      description: 'Medium duration stable liquidity aggregation vault paying yield in syUSD.',
      features: [
        'Maturity interval: 300s testing cycle',
        'Verified on-chain receipt logs',
        'Non-custodial vault mechanics',
        'Automatic checkpoint compounding',
      ],
    },
    {
      id: 3,
      name: 'Global Yield Core',
      operator: STELLAR_CONFIG.demoAccounts.operator,
      apyBps: 1500, // 15%
      lockupSeconds: 3600,
      description: 'Long-term enterprise-grade yield aggregator running on Soroban.',
      features: [
        'Maturity interval: 1-hour locked cycles',
        'Priority execution queue routing',
        'Decentralized accounting audits',
        'Zero admin platform lock-in',
      ],
    },
  ]);

  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newApy, setNewApy] = useState('10'); // 10%
  const [newLockup, setNewLockup] = useState('60'); // 60s

  const handleSubscribe = async (strategy: StakingStrategy) => {
    if (!currentAddress) {
      onError('NO_WALLET');
      return;
    }
    setSubscribingId(strategy.id);
    setTimeout(() => {
      setSubscribingId(null);
      onSubscribed();
    }, 1000);
  };

  const handleCreateStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const apyPct = parseFloat(newApy) || 10;
    const newStrategy: StakingStrategy = {
      id: strategies.length + 1,
      name: newName,
      operator: currentAddress || STELLAR_CONFIG.demoAccounts.operator,
      apyBps: Math.round(apyPct * 100),
      lockupSeconds: parseInt(newLockup) || 60,
      description: 'Custom yield strategy created on Stellar Testnet.',
      features: ['Automated interval collection', 'Soroban smart contract safety'],
    };
    setStrategies([...strategies, newStrategy]);
    setShowCreateModal(false);
    setNewName('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="p-8 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 border border-slate-200">
              <Layers className="w-5 h-5 text-slate-800" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-mono">YIELD STRATEGY EXPLORER</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-sans">
            Discover on-chain staking strategies, subscribe to yield pools, or register custom strategy templates.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-950 hover:bg-slate-800 text-xs font-mono font-medium text-white transition-colors rounded-none shrink-0"
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
            className="p-8 bg-white border border-slate-200 flex flex-col justify-between space-y-6"
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
                      <CheckCircle className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe(strat)}
              disabled={subscribingId === strat.id}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs transition-colors"
            >
              <span>{subscribingId === strat.id ? 'AUTHORIZING...' : 'STAKE INTO POOL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Register Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-md p-8 bg-white border border-slate-200 shadow-2xl space-y-6">
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
                  className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-slate-800 text-slate-800 bg-white"
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
                    className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-slate-800 text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Lockup (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={newLockup}
                    onChange={(e) => setNewLockup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-slate-800 text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs transition-colors"
                >
                  Publish Strategy
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
