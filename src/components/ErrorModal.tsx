'use client';

import React from 'react';
import { AlertTriangle, Download, XCircle, Clock, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';

export type ErrorType = 'NO_WALLET' | 'SIGNATURE_REJECTED' | 'CYCLE_NOT_DUE' | 'INSUFFICIENT_FUNDS' | null;

interface ErrorModalProps {
  errorType: ErrorType;
  errorMessage?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  errorType,
  errorMessage,
  onClose,
  onRetry,
}) => {
  if (!errorType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-slate-700/60 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>

        {errorType === 'NO_WALLET' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Freighter Wallet Not Detected</h3>
            <p className="text-sm text-slate-300">
              SubScript requires the Freighter Wallet browser extension to interact with Stellar Testnet smart contracts.
            </p>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
              <p>• Install Freighter extension from official store</p>
              <p>• Enable Testnet in Freighter settings</p>
              <p>• Refresh this page after installation</p>
            </div>
            <div className="flex gap-3 pt-2">
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl gradient-bg font-medium text-white shadow-lg hover:opacity-90 transition-opacity"
              >
                <span>Install Freighter</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {errorType === 'SIGNATURE_REJECTED' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Transaction Signature Rejected</h3>
            <p className="text-sm text-slate-300">
              {errorMessage || 'You declined or cancelled the transaction signature request in Freighter.'}
            </p>
            <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/40 text-xs text-rose-300 text-left">
              No funds were transferred and no contract state was modified.
            </div>
            <div className="flex gap-3 pt-2">
              {onRetry && (
                <button
                  onClick={() => {
                    onClose();
                    onRetry();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl gradient-bg font-medium text-white shadow-lg hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Transaction</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {(errorType === 'CYCLE_NOT_DUE' || errorType === 'INSUFFICIENT_FUNDS') && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {errorType === 'CYCLE_NOT_DUE' ? (
                <Clock className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-xl font-bold text-white">
              {errorType === 'CYCLE_NOT_DUE' ? 'Billing Cycle Not Due' : 'Insufficient Funds / Allowance'}
            </h3>
            <p className="text-sm text-slate-300">
              {errorMessage ||
                (errorType === 'CYCLE_NOT_DUE'
                  ? 'The billing interval has not elapsed yet. Subscription pull is strictly time-enforced on-chain.'
                  : 'Subscriber balance or token approval allowance is lower than the required subscription billing amount.')}
            </p>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
              {errorType === 'CYCLE_NOT_DUE' ? (
                <>
                  <p>• Soroban contract checks: <code>current_time &gt;= last_paid + interval</code></p>
                  <p>• Automated billing cannot pull funds prematurely</p>
                </>
              ) : (
                <>
                  <p>• Mint additional sUSD testnet tokens</p>
                  <p>• Ensure vault has spending allowance approved</p>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl gradient-bg font-medium text-white shadow-lg hover:opacity-90 transition-opacity"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
