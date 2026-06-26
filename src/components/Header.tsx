/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, RotateCcw, ShieldCheck, ShieldAlert, Zap } from 'lucide-react';
import { State } from '../types';

interface HeaderProps {
  seed: number;
  currentState: State;
  ledgerLength: number;
  halted: boolean;
  haltReason: string;
  onReset: () => void;
  onReseed: () => void;
  onAddSampleLedger: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  seed,
  currentState,
  ledgerLength,
  halted,
  haltReason,
  onReset,
  onReseed,
  onAddSampleLedger,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 p-4 sticky top-0 z-40" id="vek-header">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo and Core Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg md:text-xl font-bold text-zinc-100 tracking-tight">
                VEK-Core v0.1
              </h1>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 uppercase tracking-wider">
                Verifiable Execution Kernel
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Zero-Trust Ledger Verification & State Machine Auditor
            </p>
          </div>
        </div>

        {/* Live Kernel Metrics */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 font-mono text-xs">
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg flex flex-col min-w-[70px]">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Seed S₀</span>
            <span className="text-zinc-200 font-bold">{seed}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg flex flex-col min-w-[80px]">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Clock σ_t</span>
            <span className="text-zinc-200 font-bold">{currentState.logical_clock}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg flex flex-col min-w-[90px]">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">State Value</span>
            <span className="text-emerald-400 font-bold">{currentState.value}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg flex flex-col min-w-[70px]">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Ledger</span>
            <span className="text-zinc-200 font-bold">{ledgerLength} blocks</span>
          </div>

          {/* Status Flag */}
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Kernel Integrity</span>
            {halted ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/50 border border-rose-500/40 text-rose-400 font-semibold animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>HALTED</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {ledgerLength === 0 && (
            <button
              onClick={onAddSampleLedger}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5"
              id="btn-sample-ledger"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Demo</span>
            </button>
          )}
          <button
            onClick={onReseed}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            id="btn-reseed"
            title="Choose a random cryptographic genesis seed"
          >
            New Seed
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-950/30 text-rose-300 border border-rose-950 hover:bg-rose-950/60 transition-colors flex items-center gap-1.5"
            id="btn-reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {halted && (
        <div className="max-w-7xl mx-auto mt-3 p-2 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-start gap-2 animate-bounce">
          <span className="font-mono font-bold uppercase shrink-0 px-1.5 py-0.5 rounded bg-rose-900 text-white text-[9px]">
            Active Halt
          </span>
          <span className="font-mono">
            {haltReason || "KERNEL_HALTED: Write rejected on a compromised kernel. System locked for forensic audit."}
          </span>
        </div>
      )}
    </header>
  );
};
