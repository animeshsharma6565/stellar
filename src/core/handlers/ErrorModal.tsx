'use client';

import React from 'react';
import { AlertTriangle, Download, XCircle, Clock, RefreshCw, ExternalLink, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md p-8 bg-white border border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-950 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {errorType === 'NO_WALLET' && (
          <div className="text-left space-y-5">
            <div className="w-12 h-12 rounded-none bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Download className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 font-sans">Freighter Wallet Not Found</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                SolarYield requires the Freighter Wallet extension to authenticate credentials and sign smart contract transactions on the Stellar Testnet.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1.5 font-mono">
              <p>• Install the Freighter Wallet extension</p>
              <p>• Enable Testnet in Freighter configurations</p>
              <p>• Refresh this browser tab once complete</p>
            </div>
            <div className="flex gap-3 pt-2">
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 font-mono text-xs text-white transition-colors"
              >
                <span>Install Wallet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="py-2.5 px-4 bg-white border border-slate-200 text-slate-600 font-mono text-xs hover:bg-slate-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {errorType === 'SIGNATURE_REJECTED' && (
          <div className="text-left space-y-5">
            <div className="w-12 h-12 rounded-none bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 font-sans">Signature Request Cancelled</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                {errorMessage || 'The user aborted or declined the signing process in the Freighter Wallet popup.'}
              </p>
            </div>
            <div className="p-4 bg-rose-50/50 border border-rose-100/80 text-[11px] text-rose-700 font-mono">
              Action halted: No native assets were transferred, and contract states remain unchanged.
            </div>
            <div className="flex gap-3 pt-2">
              {onRetry && (
                <button
                  onClick={() => {
                    onClose();
                    onRetry();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 font-mono text-xs text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Request</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="py-2.5 px-4 bg-white border border-slate-200 text-slate-600 font-mono text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {(errorType === 'CYCLE_NOT_DUE' || errorType === 'INSUFFICIENT_FUNDS') && (
          <div className="text-left space-y-5">
            <div className="w-12 h-12 rounded-none bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              {errorType === 'CYCLE_NOT_DUE' ? (
                <Clock className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 font-sans">
                {errorType === 'CYCLE_NOT_DUE' ? 'Lockup Period Unexpired' : 'Insufficient Capital / Limit'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                {errorMessage ||
                  (errorType === 'CYCLE_NOT_DUE'
                    ? 'The yield strategy lockup interval has not yet elapsed. Strategy operations are strictly time-locked.'
                    : 'The target wallet balance or designated contract spending limit is insufficient to execute the action.')}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1.5 font-mono">
              {errorType === 'CYCLE_NOT_DUE' ? (
                <>
                  <p>• Ledger Constraint: <code>timestamp &gt;= last_checkpoint + lockup</code></p>
                  <p>• Chronological checkpoints prevent premature rewards access</p>
                </>
              ) : (
                <>
                  <p>• Verify you have sufficient syUSD testnet balance</p>
                  <p>• Increase the liquidity vault allowance approval limit</p>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 font-mono text-xs text-white transition-colors"
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
