/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Flame, Terminal, Trash2, ArrowRightLeft, ShieldAlert, Sliders, Eye } from 'lucide-react';
import { playAction, playAlarm, playClick } from '../utils/audio';

interface ControlPanelProps {
  onExecute: (event: string) => void;
  onTriggerAttack: (type: 'tamper-event' | 'value-hijack' | 'hash-splice' | 'clock-drift' | 'index-gap') => void;
  halted: boolean;
  logs: string[];
  onClearLogs: () => void;
  
  // Shadow Track state
  threshold: number;
  setThreshold: (val: number) => void;
  shadowTrackEnabled: boolean;
  setShadowTrackEnabled: (val: boolean) => void;
  shadowPrediction: number;
  currentStateValue: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onExecute,
  onTriggerAttack,
  halted,
  logs,
  onClearLogs,
  threshold,
  setThreshold,
  shadowTrackEnabled,
  setShadowTrackEnabled,
  shadowPrediction,
  currentStateValue,
}) => {
  const [customCmd, setCustomCmd] = useState('');
  const [addVal, setAddVal] = useState('50');
  const [subVal, setSubVal] = useState('20');

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    playAction();
    onExecute(customCmd.trim());
    setCustomCmd('');
  };

  return (
    <div className="flex flex-col gap-5 text-sleek-text" id="control-panel">
      {/* 1. Transaction & State Projection Controller */}
      <div className="bg-sleek-card border border-sleek-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4.5 h-4.5 text-sleek-accent" />
          <h2 className="font-display font-semibold text-sleek-text text-sm tracking-tight">
            Transaction Execution Panel
          </h2>
        </div>
        <p className="text-sleek-text-muted text-xs mb-4 leading-relaxed">
          Project mathematical transformations on the active kernel. Commands must adhere strictly to the custom prefix protocol.
        </p>

        {/* Preset Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="border border-sleek-border bg-sleek-sidebar/50 p-3 rounded-lg flex flex-col gap-2">
            <span className="text-[11px] font-mono text-sleek-text-muted uppercase tracking-wider font-semibold">ADD Projector</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={addVal}
                onChange={(e) => setAddVal(e.target.value)}
                disabled={halted}
                className="w-full bg-sleek-sidebar text-xs px-2 py-1 rounded border border-sleek-border text-sleek-text focus:outline-none focus:border-sleek-accent font-mono disabled:opacity-50"
              />
              <button
                onClick={() => { playAction(); onExecute(`ADD:${addVal}`); }}
                disabled={halted || !addVal}
                className="px-2.5 py-1 bg-sleek-success-dark hover:bg-sleek-success disabled:bg-sleek-sidebar disabled:text-sleek-text-muted text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Run</span>
              </button>
            </div>
          </div>

          <div className="border border-sleek-border bg-sleek-sidebar/50 p-3 rounded-lg flex flex-col gap-2">
            <span className="text-[11px] font-mono text-sleek-text-muted uppercase tracking-wider font-semibold">SUB Projector</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={subVal}
                onChange={(e) => setSubVal(e.target.value)}
                disabled={halted}
                className="w-full bg-sleek-sidebar text-xs px-2 py-1 rounded border border-sleek-border text-sleek-text focus:outline-none focus:border-sleek-accent font-mono disabled:opacity-50"
              />
              <button
                onClick={() => { playAction(); onExecute(`SUB:${subVal}`); }}
                disabled={halted || !subVal}
                className="px-2.5 py-1 bg-sleek-success-dark hover:bg-sleek-success disabled:bg-sleek-sidebar disabled:text-sleek-text-muted text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
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
            className="w-full bg-sleek-sidebar border border-sleek-border rounded-md px-3 py-2 text-xs font-mono text-sleek-text placeholder-sleek-text-muted focus:outline-none focus:border-sleek-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={halted || !customCmd.trim()}
            className="px-4 py-2 bg-sleek-sidebar text-sleek-text border border-sleek-border hover:bg-sleek-border/80 disabled:bg-sleek-sidebar disabled:text-sleek-text-muted disabled:border-sleek-border rounded-md text-xs font-semibold transition-colors shrink-0"
          >
            Execute
          </button>
        </form>

        <div className="mt-3 flex justify-between items-center bg-rose-950/15 border border-rose-500/30 p-2.5 rounded-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-[10.5px] font-mono text-rose-300 font-semibold">Test Security Halt Protocols</span>
          </div>
          <button
            onClick={() => { playAlarm(); onExecute("CORRUPT_ACTION"); }}
            disabled={halted}
            className="px-2.5 py-1 bg-rose-900/40 border border-rose-500/40 hover:bg-rose-900 text-rose-200 text-[10px] font-mono rounded font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            Trigger Protocol Violation
          </button>
        </div>
      </div>

      {/* Shadow Track Adaptive Guardian Card */}
      <div className="bg-sleek-card border border-sleek-border rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-indigo-400" />
            <h2 className="font-display font-semibold text-sleek-text text-sm tracking-tight">
              Adaptive Shadow Track
            </h2>
          </div>
          <button
            onClick={() => { playClick(); setShadowTrackEnabled(!shadowTrackEnabled); }}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer ${
              shadowTrackEnabled
                ? 'bg-indigo-950/30 text-indigo-400 border-indigo-500/40 hover:bg-indigo-900/40'
                : 'bg-sleek-sidebar text-sleek-text-muted border-sleek-border hover:bg-sleek-border'
            }`}
          >
            {shadowTrackEnabled ? 'GUARD ARMED' : 'GUARD MUTED'}
          </button>
        </div>

        <p className="text-sleek-text-muted text-xs leading-relaxed">
          Runs a parallel, deterministic prediction loop. If a state transition deviates from the projected value beyond the trust threshold, the kernel replaces the deviant input with the synthetic estimate.
        </p>

        {shadowTrackEnabled ? (
          <div className="flex flex-col gap-3 mt-1">
            {/* Slider control */}
            <div className="flex flex-col gap-1.5 bg-sleek-sidebar/40 p-3 rounded-lg border border-sleek-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sleek-text-muted font-mono">Trust Tolerance:</span>
                <span className="text-indigo-400 font-mono font-semibold">± {threshold} units</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={threshold}
                onChange={(e) => { setThreshold(Number(e.target.value)); }}
                className="w-full accent-indigo-500 h-1.5 bg-sleek-sidebar rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-sleek-text-muted leading-relaxed">
                Determines the maximum allowed drift before activating the autonomous bypass mechanism.
              </span>
            </div>

            {/* Dynamic Status / Interval Calculations */}
            <div className="border border-indigo-500/10 bg-indigo-950/5 rounded-lg p-3 flex flex-col gap-2 font-mono text-[10.5px]">
              <div className="flex justify-between items-center border-b border-indigo-500/5 pb-1.5">
                <span className="text-sleek-text-muted">Extrapolated Shadow Projection (Ŝ_n):</span>
                <span className="text-indigo-300 font-semibold">{shadowPrediction}</span>
              </div>
              <div className="flex justify-between items-center border-b border-indigo-500/5 pb-1.5">
                <span className="text-sleek-text-muted">Active Safe Bound Interval:</span>
                <span className="text-indigo-400 font-bold">
                  [{shadowPrediction - threshold}, {shadowPrediction + threshold}]
                </span>
              </div>
              <div className="flex items-start gap-2 text-indigo-400/80 leading-normal mt-0.5">
                <Eye className="w-3.5 h-3.5 shrink-0 text-indigo-400 mt-0.5" />
                <span>
                  Any event projecting a state value outside of this interval triggers a <strong className="text-indigo-300 font-bold">Synthetic Override</strong>.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-sleek-sidebar/30 border border-sleek-border/40 rounded-lg p-3 text-center text-xs text-sleek-text-muted italic">
            Shadow Track Guardian offline. Incoming transaction inputs are verified without safety boundary checks.
          </div>
        )}
      </div>

      {/* 2. Adversarial Chaos Fuzzer (Threat Injector) */}
      <div className="bg-sleek-card border border-sleek-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
          <h2 className="font-display font-semibold text-sleek-text text-sm tracking-tight">
            Adversarial Chaos Fuzzer
          </h2>
        </div>
        <p className="text-sleek-text-muted text-xs mb-4 leading-relaxed">
          Inject cryptographic anomalies or state mutations directly into the ledger to simulate state corruption, clock tampering, or data hijack threats.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => { playAlarm(); onTriggerAttack('tamper-event'); }}
            className="w-full text-left p-2.5 rounded-lg border border-sleek-border bg-sleek-sidebar/30 hover:bg-rose-950/15 hover:border-rose-500/40 transition-all group flex flex-col gap-0.5 cursor-pointer"
            id="fuzz-tamper-event"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sleek-text group-hover:text-rose-400 font-mono">
                [V1] Input Event Mutation
              </span>
              <span className="text-[10px] font-mono bg-sleek-sidebar group-hover:bg-rose-950 text-sleek-accent group-hover:text-rose-300 border border-sleek-border px-1.5 py-0.5 rounded">
                Rule 4
              </span>
            </div>
            <span className="text-[10px] text-sleek-text-muted leading-normal mt-0.5">
              Alters input_event string inside a random block without regenerating hashes.
            </span>
          </button>

          <button
            onClick={() => { playAlarm(); onTriggerAttack('value-hijack'); }}
            className="w-full text-left p-2.5 rounded-lg border border-sleek-border bg-sleek-sidebar/30 hover:bg-rose-950/15 hover:border-rose-500/40 transition-all group flex flex-col gap-0.5 cursor-pointer"
            id="fuzz-value-hijack"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sleek-text group-hover:text-rose-400 font-mono">
                [V2] Memory / State Value Hijack
              </span>
              <span className="text-[10px] font-mono bg-sleek-sidebar group-hover:bg-rose-950 text-sleek-accent group-hover:text-rose-300 border border-sleek-border px-1.5 py-0.5 rounded">
                Rule 2 / 3
              </span>
            </div>
            <span className="text-[10px] text-sleek-text-muted leading-normal mt-0.5">
              Injects arbitrary u64 values into pre-state or post-state parameters.
            </span>
          </button>

          <button
            onClick={() => { playAlarm(); onTriggerAttack('hash-splice'); }}
            className="w-full text-left p-2.5 rounded-lg border border-sleek-border bg-sleek-sidebar/30 hover:bg-rose-950/15 hover:border-rose-500/40 transition-all group flex flex-col gap-0.5 cursor-pointer"
            id="fuzz-hash-splice"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sleek-text group-hover:text-rose-400 font-mono">
                [V3] Ledger Hash Splice
              </span>
              <span className="text-[10px] font-mono bg-sleek-sidebar group-hover:bg-rose-950 text-sleek-accent group-hover:text-rose-300 border border-sleek-border px-1.5 py-0.5 rounded">
                Rule 5
              </span>
            </div>
            <span className="text-[10px] text-sleek-text-muted leading-normal mt-0.5">
              Slices random hash digests into the cumulative blockchain array ($L_n$).
            </span>
          </button>

          <button
            onClick={() => { playAlarm(); onTriggerAttack('clock-drift'); }}
            className="w-full text-left p-2.5 rounded-lg border border-sleek-border bg-sleek-sidebar/30 hover:bg-rose-950/15 hover:border-rose-500/40 transition-all group flex flex-col gap-0.5 cursor-pointer"
            id="fuzz-clock-drift"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sleek-text group-hover:text-rose-400 font-mono">
                [V4] Temporal Clock Regression
              </span>
              <span className="text-[10px] font-mono bg-sleek-sidebar group-hover:bg-rose-950 text-sleek-accent group-hover:text-rose-300 border border-sleek-border px-1.5 py-0.5 rounded">
                Rule 2
              </span>
            </div>
            <span className="text-[10px] text-sleek-text-muted leading-normal mt-0.5">
              Stalls or rewinds the monotonic logical clock parameter in recorded history.
            </span>
          </button>

          <button
            onClick={() => { playAlarm(); onTriggerAttack('index-gap'); }}
            className="w-full text-left p-2.5 rounded-lg border border-sleek-border bg-sleek-sidebar/30 hover:bg-rose-950/15 hover:border-rose-500/40 transition-all group flex flex-col gap-0.5 cursor-pointer"
            id="fuzz-index-gap"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sleek-text group-hover:text-rose-400 font-mono">
                [V5] Ledger Index Gap / Out-of-Order
              </span>
              <span className="text-[10px] font-mono bg-sleek-sidebar group-hover:bg-rose-950 text-sleek-accent group-hover:text-rose-300 border border-sleek-border px-1.5 py-0.5 rounded">
                Rule 1
              </span>
            </div>
            <span className="text-[10px] text-sleek-text-muted leading-normal mt-0.5">
              Modifies index sequences of existing blocks to mimic packet loss or out-of-order replay attacks.
            </span>
          </button>
        </div>
      </div>

      {/* 3. Real-time Terminal Log Output */}
      <div className="bg-sleek-card border border-sleek-border rounded-xl p-4 flex-1 min-h-[220px] flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sleek-text-muted" />
            <h3 className="font-mono text-xs font-bold text-sleek-text">Kernel Execution Log</h3>
          </div>
          {logs.length > 0 && (
            <button
              onClick={() => { playClick(); onClearLogs(); }}
              className="text-[10px] font-mono text-sleek-text-muted hover:text-sleek-text flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
        <div className="bg-sleek-sidebar/70 border border-sleek-border rounded-lg p-2.5 font-mono text-[10.5px] leading-relaxed flex-1 overflow-y-auto max-h-[300px] text-sleek-text">
          {logs.length === 0 ? (
            <div className="text-sleek-text-muted italic h-full flex items-center justify-center text-center">
              Kernel idle. Execute events or inject anomalies to view execution stream.
            </div>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log, idx) => {
                let textClass = 'text-sleek-text-muted';
                if (log.includes('OK') || log.includes('SUCCESS') || log.includes('VERIFIED')) {
                  textClass = 'text-sleek-success font-semibold';
                } else if (log.includes('HALT') || log.includes('FAILURE') || log.includes('TAMPERED') || log.includes('CRITICAL')) {
                  textClass = 'text-rose-400 font-semibold';
                } else if (log.includes('ATTACK') || log.includes('FUZZ')) {
                  textClass = 'text-amber-400 font-semibold';
                } else if (log.includes('INIT')) {
                  textClass = 'text-sleek-accent';
                }
                return (
                  <div key={idx} className={`${textClass} break-all`}>
                    <span className="text-sleek-text-muted mr-1.5 select-none">&gt;</span>
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
