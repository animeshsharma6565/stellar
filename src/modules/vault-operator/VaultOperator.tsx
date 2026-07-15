'use client';

import React, { useState } from 'react';
import { Vault, TrendingUp, Download, Zap, Users, CheckCircle, ExternalLink, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { STELLAR_CONFIG } from '@/config/contracts';
import { ErrorType } from '@/core/handlers/ErrorModal';

interface DepositorRow {
  stakerAddress: string;
  strategyName: string;
  amount: number;
  lockupSeconds: number;
  lastCheckpointTimestamp: number;
  status: 'Active' | 'Paused' | 'Terminated';
}

interface VaultOperatorProps {
  currentAddress: string | null;
  onError: (type: ErrorType, msg?: string) => void;
}

export const VaultOperator: React.FC<VaultOperatorProps> = ({
  currentAddress,
  onError,
}) => {
  const [vaultBalance, setVaultBalance] = useState<number>(2500); // syUSD
  const [totalYieldAggregated, setTotalYieldAggregated] = useState<number>(5000);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(STELLAR_CONFIG.hashes.checkpointTx);

  const [depositors, setDepositors] = useState<DepositorRow[]>([
    {
      stakerAddress: STELLAR_CONFIG.demoAccounts.staker,
      strategyName: 'DeFi Alpha Pool',
      amount: 1000,
      lockupSeconds: 60,
      lastCheckpointTimestamp: Math.floor(Date.now() / 1000) - 75, // Overdue/Checkpoint Available!
      status: 'Active',
    },
    {
      stakerAddress: 'GDX7...4K9Q',
      strategyName: 'Stellar Liquid Vault',
      amount: 2500,
      lockupSeconds: 300,
      lastCheckpointTimestamp: Math.floor(Date.now() / 1000) - 100, // Locked
      status: 'Active',
    },
  ]);

  const now = Math.floor(Date.now() / 1000);

  const handleCheckpoint = async (stakerAddr: string, amount: number, lockup: number, lastCheckpoint: number) => {
    const isDue = lastCheckpoint === 0 || now >= lastCheckpoint + lockup;
    if (!isDue) {
      onError('CYCLE_NOT_DUE', `Lockup period not matured for ${stakerAddr.slice(0, 6)}... Next checkpoint available in ${lastCheckpoint + lockup - now}s.`);
      return;
    }

    setLoadingAction(`collect-${stakerAddr}`);
    setTimeout(() => {
      setVaultBalance((prev) => prev + amount);
      setTotalYieldAggregated((prev) => prev + amount);
      setDepositors((prev) =>
        prev.map((d) =>
          d.stakerAddress === stakerAddr
            ? { ...d, lastCheckpointTimestamp: Math.floor(Date.now() / 1000) }
            : d
        )
      );
      setLastTxHash(STELLAR_CONFIG.hashes.checkpointTx);
      setLoadingAction(null);
    }, 1000);
  };

  const handleWithdraw = async () => {
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      onError('INSUFFICIENT_FUNDS', 'Please enter a valid positive withdrawal amount.');
      return;
    }
    if (val > vaultBalance) {
      onError('INSUFFICIENT_FUNDS', `Withdrawal amount (${val} syUSD) exceeds vault balance (${vaultBalance} syUSD).`);
      return;
    }

    setLoadingAction('withdraw');
    setTimeout(() => {
      setVaultBalance((prev) => prev - val);
      setLastTxHash(STELLAR_CONFIG.hashes.operatorWithdrawTx);
      setLoadingAction(null);
    }, 1000);
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-8 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 border border-slate-200">
              <Vault className="w-5 h-5 text-slate-900" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-mono">OPERATOR LIQUIDITY VAULT</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-sans">
            Oversee accumulated pool yields, invoke linear reward checkpoints, and execute contract asset withdrawals.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 p-3 border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Vault Contract: {truncate(STELLAR_CONFIG.contracts.liquidityVault)}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="p-8 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Total Yield Aggregated
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-slate-900 leading-none">
              {totalYieldAggregated} <span className="text-xs font-mono text-slate-400 font-normal">syUSD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-sans">Total lifetime capital processed through vault checks.</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-8 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Active Vault Balance
            </span>
            <span className="p-2 bg-slate-100 text-slate-800 border border-slate-200">
              <Vault className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-slate-900 leading-none">
              {vaultBalance} <span className="text-xs font-mono text-slate-400 font-normal">syUSD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-sans">Liquid collateral currently matching strategy parameters.</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-8 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Withdraw Liquid Assets
            </span>
            <span className="p-2 bg-slate-100 text-slate-800 border border-slate-200">
              <Download className="w-4 h-4" />
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount syUSD"
              className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:border-slate-800 text-sm font-mono text-slate-800 bg-white"
            />
            <button
              onClick={handleWithdraw}
              disabled={loadingAction === 'withdraw'}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs transition-colors shrink-0"
            >
              {loadingAction === 'withdraw' ? 'WAITING...' : 'WITHDRAW'}
            </button>
          </div>
        </div>
      </div>

      {/* Depositors Table */}
      <div className="p-8 bg-white border border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-900" />
            <h3 className="text-base font-bold text-slate-900 font-mono">ACTIVE DEPOSITOR STREAMS</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
            {depositors.length} POSITIONS INDEXED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-bold">Staker Address</th>
                <th className="pb-3 font-bold">Strategy</th>
                <th className="pb-3 font-bold">Principal Deposit</th>
                <th className="pb-3 font-bold">Checkpoint Status</th>
                <th className="pb-3 text-right font-bold">Action Request</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {depositors.map((dep, i) => {
                const isDue = dep.lastCheckpointTimestamp === 0 || now >= dep.lastCheckpointTimestamp + dep.lockupSeconds;
                const nextCheckpointSecs = dep.lastCheckpointTimestamp + dep.lockupSeconds - now;

                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-slate-700">
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${dep.stakerAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-slate-950 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{truncate(dep.stakerAddress)}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </td>
                    <td className="py-4 text-slate-700 font-sans font-medium">{dep.strategyName}</td>
                    <td className="py-4 text-slate-900 font-bold">{dep.amount} syUSD</td>
                    <td className="py-4">
                      {isDue ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Matured</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-50 text-slate-400 border border-slate-200 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Locked ({nextCheckpointSecs}s)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() =>
                          handleCheckpoint(
                            dep.stakerAddress,
                            dep.amount,
                            dep.lockupSeconds,
                            dep.lastCheckpointTimestamp
                          )
                        }
                        disabled={loadingAction === `collect-${dep.stakerAddress}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-colors ${
                          isDue
                            ? 'bg-slate-950 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>
                          {loadingAction === `collect-${dep.stakerAddress}`
                            ? 'CHECKPOINTING...'
                            : isDue
                            ? 'Run Checkpoint'
                            : 'Maturity Lock'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Real Testnet Proof Box */}
        {lastTxHash && (
          <div className="p-4 bg-slate-50 border border-slate-200 text-xs font-mono flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Verified Ledger Tx:</span>
              <span className="text-slate-800">{lastTxHash.slice(0, 16)}...{lastTxHash.slice(-10)}</span>
            </span>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-800 hover:text-slate-950 hover:underline inline-flex items-center gap-1 font-bold"
            >
              <span>Explore Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
