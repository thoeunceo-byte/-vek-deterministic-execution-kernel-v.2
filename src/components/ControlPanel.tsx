/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Flame, Terminal, Trash2, ArrowRightLeft, ShieldAlert } from 'lucide-react';

interface ControlPanelProps {
  onExecute: (event: string) => void;
  onTriggerAttack: (type: 'tamper-event' | 'value-hijack' | 'hash-splice' | 'clock-drift' | 'index-gap') => void;
  halted: boolean;
  logs: string[];
  onClearLogs: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onExecute,
  onTriggerAttack,
  halted,
  logs,
  onClearLogs,
}) => {
  const [customCmd, setCustomCmd] = useState('');
  const [addVal, setAddVal] = useState('50');
  const [subVal, setSubVal] = useState('20');

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    onExecute(customCmd.trim());
    setCustomCmd('');
  };

  return (
    <div className="flex flex-col gap-5" id="control-panel">
      {/* 1. Transaction & State Projection Controller */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4.5 h-4.5 text-emerald-400" />
          <h2 className="font-display font-semibold text-zinc-200 text-sm tracking-tight">
            Transaction Execution Panel
          </h2>
        </div>
        <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
          Project mathematical transformations on the active kernel. Commands must adhere strictly to the custom prefix protocol.
        </p>

        {/* Preset Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="border border-zinc-800 bg-zinc-900/50 p-3 rounded-lg flex flex-col gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">ADD Projector</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={addVal}
                onChange={(e) => setAddVal(e.target.value)}
                disabled={halted}
                className="w-full bg-zinc-950 text-xs px-2 py-1 rounded border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
              />
              <button
                onClick={() => onExecute(`ADD:${addVal}`)}
                disabled={halted || !addVal}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Run</span>
              </button>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/50 p-3 rounded-lg flex flex-col gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">SUB Projector</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={subVal}
                onChange={(e) => setSubVal(e.target.value)}
                disabled={halted}
                className="w-full bg-zinc-950 text-xs px-2 py-1 rounded border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
              />
              <button
                onClick={() => onExecute(`SUB:${subVal}`)}
                disabled={halted || !subVal}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Run</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Event Shell */}
        <form onSubmit={handleSubmitCustom} className="flex gap-2">
          <input
            type="text"
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            disabled={halted}
            placeholder={halted ? "Kernel locked..." : "e.g. ADD:1000 or INVALID_CMD"}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={halted || !customCmd.trim()}
            className="px-4 py-2 bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800 rounded-md text-xs font-medium transition-colors shrink-0"
          >
            Execute
          </button>
        </form>

        <div className="mt-3 flex justify-between items-center bg-rose-950/20 border border-rose-950/40 p-2.5 rounded-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-[10.5px] font-mono text-rose-300">Test Security Halt Protocols</span>
          </div>
          <button
            onClick={() => onExecute("CORRUPT_ACTION")}
            disabled={halted}
            className="px-2 py-1 bg-rose-900/40 border border-rose-800 hover:bg-rose-900 text-rose-200 text-[10px] font-mono rounded font-medium transition-colors disabled:opacity-50"
          >
            Trigger Protocol Violation
          </button>
        </div>
      </div>

      {/* 2. Adversarial Chaos Fuzzer (Threat Injector) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
          <h2 className="font-display font-semibold text-zinc-200 text-sm tracking-tight">
            Adversarial Chaos Fuzzer
          </h2>
        </div>
        <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
          Inject cryptographic anomalies or state mutations directly into the ledger to simulate state corruption, clock tampering, or data hijack threats.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => onTriggerAttack('tamper-event')}
            className="w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-rose-950/10 hover:border-rose-900/50 transition-all group flex flex-col gap-0.5"
            id="fuzz-tamper-event"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-rose-400 font-mono">
                [V1] Input Event Mutation
              </span>
              <span className="text-[9px] font-mono bg-zinc-800 group-hover:bg-rose-900 text-zinc-500 group-hover:text-rose-200 px-1.5 py-0.5 rounded">
                Rule 4
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">
              Alters input_event string inside a random block without regenerating hashes.
            </span>
          </button>

          <button
            onClick={() => onTriggerAttack('value-hijack')}
            className="w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-rose-950/10 hover:border-rose-900/50 transition-all group flex flex-col gap-0.5"
            id="fuzz-value-hijack"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-rose-400 font-mono">
                [V2] Memory / State Value Hijack
              </span>
              <span className="text-[9px] font-mono bg-zinc-800 group-hover:bg-rose-900 text-zinc-500 group-hover:text-rose-200 px-1.5 py-0.5 rounded">
                Rule 2 / 3
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">
              Injects arbitrary u64 values into pre-state or post-state parameters.
            </span>
          </button>

          <button
            onClick={() => onTriggerAttack('hash-splice')}
            className="w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-rose-950/10 hover:border-rose-900/50 transition-all group flex flex-col gap-0.5"
            id="fuzz-hash-splice"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-rose-400 font-mono">
                [V3] Ledger Hash Splice
              </span>
              <span className="text-[9px] font-mono bg-zinc-800 group-hover:bg-rose-900 text-zinc-500 group-hover:text-rose-200 px-1.5 py-0.5 rounded">
                Rule 5
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">
              Slices random hash digests into the cumulative blockchain array ($L_n$).
            </span>
          </button>

          <button
            onClick={() => onTriggerAttack('clock-drift')}
            className="w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-rose-950/10 hover:border-rose-900/50 transition-all group flex flex-col gap-0.5"
            id="fuzz-clock-drift"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-rose-400 font-mono">
                [V4] Temporal Clock Regression
              </span>
              <span className="text-[9px] font-mono bg-zinc-800 group-hover:bg-rose-900 text-zinc-500 group-hover:text-rose-200 px-1.5 py-0.5 rounded">
                Rule 2
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">
              Stalls or rewinds the monotonic logical clock parameter in recorded history.
            </span>
          </button>

          <button
            onClick={() => onTriggerAttack('index-gap')}
            className="w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-rose-950/10 hover:border-rose-900/50 transition-all group flex flex-col gap-0.5"
            id="fuzz-index-gap"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-rose-400 font-mono">
                [V5] Ledger Index Gap / Out-of-Order
              </span>
              <span className="text-[9px] font-mono bg-zinc-800 group-hover:bg-rose-900 text-zinc-500 group-hover:text-rose-200 px-1.5 py-0.5 rounded">
                Rule 1
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-normal">
              Modifies index sequences of existing blocks to mimic packet loss or out-of-order replay attacks.
            </span>
          </button>
        </div>
      </div>

      {/* 3. Real-time Terminal Log Output */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex-1 min-h-[220px] flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <h3 className="font-mono text-xs font-bold text-zinc-300">Kernel Execution Log</h3>
          </div>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
        <div className="bg-zinc-900/70 border border-zinc-850 rounded-lg p-2 font-mono text-[10.5px] leading-relaxed flex-1 overflow-y-auto max-h-[300px] text-zinc-300">
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic h-full flex items-center justify-center text-center">
              Kernel idle. Execute events or inject anomalies to view execution stream.
            </div>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log, idx) => {
                let textClass = 'text-zinc-400';
                if (log.includes('OK') || log.includes('SUCCESS') || log.includes('VERIFIED')) {
                  textClass = 'text-emerald-400 font-semibold';
                } else if (log.includes('HALT') || log.includes('FAILURE') || log.includes('TAMPERED') || log.includes('CRITICAL')) {
                  textClass = 'text-rose-400 font-semibold';
                } else if (log.includes('ATTACK') || log.includes('FUZZ')) {
                  textClass = 'text-amber-400 font-semibold';
                } else if (log.includes('INIT')) {
                  textClass = 'text-cyan-400';
                }
                return (
                  <div key={idx} className={`${textClass} break-all`}>
                    <span className="text-zinc-600 mr-1.5 select-none">&gt;</span>
                    {log}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
