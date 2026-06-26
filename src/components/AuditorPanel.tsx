/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, Copy, Download, HeartPulse, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Block, FalsificationReport } from '../types';

interface AuditorPanelProps {
  auditReport: FalsificationReport;
  ledger: Block[];
  onHealLedger: () => void;
}

export const AuditorPanel: React.FC<AuditorPanelProps> = ({
  auditReport,
  ledger,
  onHealLedger,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(ledger, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLedger = () => {
    const jsonStr = JSON.stringify(ledger, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vek_ledger_clock_${ledger.length}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isValid = auditReport.status === 'valid';

  return (
    <div className="flex flex-col gap-5" id="auditor-panel">
      {/* 1. Replay Engine Validation Monitor */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
          <h2 className="font-display font-semibold text-zinc-200 text-sm tracking-tight">
            Zero-Trust Replay Auditor
          </h2>
        </div>

        {isValid ? (
          /* VERIFIED STATUS */
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-emerald-900/40 text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-emerald-400 font-bold font-mono text-xs uppercase tracking-wider">
                  KERNEL INTEGRITY SECURED
                </h3>
                <p className="text-zinc-300 text-xs mt-1 leading-normal font-mono">
                  {auditReport.message}
                </p>
              </div>
            </div>

            {/* Invariant Verification Checklist */}
            <div className="border-t border-emerald-900/30 pt-3 mt-1 space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-500 block uppercase tracking-wider">
                Invariant Checklist
              </span>
              <ul className="font-mono text-[10.5px] text-zinc-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Rule 1: Monotonic index sequences</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Rule 2: Temporal state progression</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Rule 3: Deterministic projection logic</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Rule 4: Step payload signature match</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Rule 5: Cumulative Hashchain links</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* COMPROMISED STATUS */
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-900/40 text-rose-400 shrink-0 mt-0.5 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-rose-400 font-bold font-mono text-xs uppercase tracking-wider">
                  FALSIFICATION DETECTED
                </h3>
                <p className="text-zinc-200 text-xs mt-1 leading-normal font-mono font-semibold">
                  Rule #{auditReport.rule} Violation: Trace Compromised!
                </p>
                <p className="text-zinc-400 text-xs mt-1 leading-normal font-mono">
                  The ReplayEngine instantly falsified verification at Block Index {auditReport.index}.
                </p>
              </div>
            </div>

            <div className="border-t border-rose-900/30 pt-3 mt-1 space-y-2">
              <span className="text-[10px] font-mono font-bold text-rose-400 block uppercase tracking-wider">
                Reasoning & Forensic Context
              </span>
              <p className="text-[11px] text-zinc-300 font-mono leading-relaxed bg-zinc-900/60 p-2 rounded border border-rose-950/50">
                {auditReport.message}
              </p>

              <div className="flex justify-between items-center bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-semibold font-mono">Heal Ledger?</span>
                  <span className="text-[9px] text-zinc-500 font-mono">Recalculates all sequential hashes to restore validity.</span>
                </div>
                <button
                  onClick={onHealLedger}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold rounded flex items-center gap-1.5 transition-colors"
                  id="btn-heal-ledger"
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Heal & Re-sign</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive JSON Exporter */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full flex items-center justify-between text-zinc-300 hover:text-zinc-100 transition-colors"
          id="toggle-json-exporter"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-zinc-400" />
            <h3 className="font-display font-semibold text-sm tracking-tight">Ledger Exporter (JSON)</h3>
          </div>
          {showJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showJson && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-zinc-500 text-xs">
              Export the complete blockchain ledger representation containing transition records, step hashes, and chain signatures.
            </p>
            <div className="relative">
              <pre className="bg-zinc-900 p-3 rounded-lg text-[10px] font-mono text-zinc-400 overflow-x-auto max-h-[180px] border border-zinc-850">
                {JSON.stringify(ledger, null, 2)}
              </pre>
              <button
                onClick={handleCopyJson}
                className="absolute right-2 top-2 p-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Copy JSON to clipboard"
                id="btn-copy-json"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyJson}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs font-mono font-medium transition-colors"
              >
                Copy Clipboard
              </button>
              <button
                onClick={handleDownloadLedger}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
