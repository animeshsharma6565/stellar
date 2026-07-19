'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Shield, PlusCircle, ArrowRight, Layers, Clock } from 'lucide-react';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from './ErrorModal';

interface Plan {
  id: number;
  name: string;
  merchant: string;
  amount: number;
  intervalSeconds: number;
  description: string;
  features: string[];
}

interface PlanExplorerProps {
  currentAddress: string | null;
  onError: (type: ErrorType, msg?: string) => void;
  onSubscribed: () => void;
}

export const PlanExplorer: React.FC<PlanExplorerProps> = ({
  currentAddress,
  onError,
  onSubscribed,
}) => {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 1,
      name: 'SaaS Monthly Sub',
      merchant: STELLAR_CONFIG.demoAccounts.merchant,
      amount: 50,
      intervalSeconds: 60,
      description: 'Standard SaaS recurring software subscription plan.',
      features: [
        'Automated 60s test interval pulls',
        'Direct allowance authorization',
        'Pause & Resume controls',
        'Instant vault Settlement',
      ],
    },
    {
      id: 2,
      name: 'Creator Pass Pro',
      merchant: STELLAR_CONFIG.demoAccounts.merchant,
      amount: 25,
      intervalSeconds: 300,
      description: 'Exclusive creator pass tier for premium community content.',
      features: [
        '300s automated billing cycle',
        'Transparent Stellar ledger receipts',
        'Non-custodial allowance approval',
        'On-chain dispute resolution',
      ],
    },
    {
      id: 3,
      name: 'Enterprise Data Stream',
      merchant: STELLAR_CONFIG.demoAccounts.merchant,
      amount: 150,
      intervalSeconds: 3600,
      description: 'High-throughput real-time enterprise data access stream.',
      features: [
        '1-hour recurring payment stream',
        'Priority API throughput access',
        'Decentralized revenue accounting',
        'Zero platform lock-in',
      ],
    },
  ]);

  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanAmount, setNewPlanAmount] = useState('75');
  const [newPlanInterval, setNewPlanInterval] = useState('60');

  const handleSubscribe = async (plan: Plan) => {
    if (!currentAddress) {
      onError('NO_WALLET');
      return;
    }
    setSubscribingId(plan.id);
    setTimeout(() => {
      setSubscribingId(null);
      onSubscribed();
    }, 1200);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    const newPlan: Plan = {
      id: plans.length + 1,
      name: newPlanName,
      merchant: currentAddress || STELLAR_CONFIG.demoAccounts.merchant,
      amount: parseFloat(newPlanAmount) || 50,
      intervalSeconds: parseInt(newPlanInterval) || 60,
      description: 'Custom subscription plan created on Soroban Testnet.',
      features: ['Automated interval collection', 'Soroban smart contract safety'],
    };
    setPlans([...plans, newPlan]);
    setShowCreateModal(false);
    setNewPlanName('');
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-white">Subscription Plan Explorer</h2>
          </div>
          <p className="text-sm text-slate-400">
            Discover decentralized subscription plans or publish your own SaaS payment stream.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-bg font-semibold text-sm text-white shadow-xl hover:opacity-90 transition-opacity shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Plan</span>
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-6 rounded-2xl glass-panel glass-panel-hover border border-slate-800 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono text-purple-400 font-semibold tracking-wider uppercase">
                  Plan #{plan.id}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="text-3xl font-extrabold font-mono text-white">
                  {plan.amount} <span className="text-sm font-normal text-slate-400">sUSD</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Interval: {plan.intervalSeconds} seconds</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">Plan Highlights:</span>
                <ul className="space-y-1.5">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={subscribingId === plan.id}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl gradient-bg font-semibold text-xs text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <span>{subscribingId === plan.id ? 'Authorizing Allowance...' : 'Subscribe Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Create Soroban Subscription Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Premium SaaS Tier"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (sUSD)</label>
                  <input
                    type="number"
                    required
                    value={newPlanAmount}
                    onChange={(e) => setNewPlanAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Interval (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={newPlanInterval}
                    onChange={(e) => setNewPlanInterval(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl gradient-bg font-semibold text-xs text-white shadow-lg hover:opacity-90"
                >
                  Publish Plan to Soroban
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
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
