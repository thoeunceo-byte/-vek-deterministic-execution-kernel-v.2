/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, Copy, Download, HeartPulse, FileText, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { Block, FalsificationReport } from '../types';
import { playClick, playSuccess } from '../utils/audio';
import { VarianceChart } from './VarianceChart';

interface AuditorPanelProps {
  auditReport: FalsificationReport;
  ledger: Block[];
  onHealLedger: () => void;
  threshold: number;
  shadowTrackEnabled: boolean;
}

export const AuditorPanel: React.FC<AuditorPanelProps> = ({
  auditReport,
  ledger,
  onHealLedger,
  threshold,
  shadowTrackEnabled,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(ledger, null, 2);
    navigator.clipboard.writeText(jsonStr);
    playSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLedger = () => {
    const jsonStr = JSON.stringify(ledger, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    playSuccess();
    const link = document.createElement('a');
    link.href = url;
    link.download = `vek_ledger_clock_${ledger.length}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isValid = auditReport.status === 'valid';

  return (
    <div className="flex flex-col gap-5 text-sleek-text" id="auditor-panel">
      {/* 1. Replay Engine Validation Monitor */}
      <div className="bg-sleek-card border border-sleek-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4.5 h-4.5 text-sleek-accent" />
          <h2 className="font-display font-semibold text-sleek-text text-sm tracking-tight">
            Zero-Trust Replay Auditor
          </h2>
        </div>

        {isValid ? (
          /* VERIFIED STATUS */
          <div className="bg-sleek-success-dark/10 border border-sleek-success/30 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-sleek-success-dark/15 text-sleek-success shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sleek-success font-bold font-mono text-xs uppercase tracking-wider">
                  KERNEL INTEGRITY SECURED
                </h3>
                <p className="text-sleek-text text-xs mt-1 leading-normal font-mono">
                  {auditReport.message}
                </p>
              </div>
            </div>

            {/* Invariant Verification Checklist */}
            <div className="border-t border-sleek-success/20 pt-3 mt-1 space-y-2">
              <span className="text-[10px] font-mono font-bold text-sleek-success block uppercase tracking-wider">
                Invariant Checklist
              </span>
              <ul className="font-mono text-[10.5px] text-sleek-text-muted space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-sleek-success">✔</span>
                  <span>Rule 1: Monotonic index sequences</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sleek-success">✔</span>
                  <span>Rule 2: Temporal state progression</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sleek-success">✔</span>
                  <span>Rule 3: Deterministic projection logic</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sleek-success">✔</span>
                  <span>Rule 4: Step payload signature match</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sleek-success">✔</span>
                  <span>Rule 5: Cumulative Hashchain links</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* COMPROMISED STATUS */
          <div className="bg-rose-950/15 border border-rose-500/30 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-900/20 text-rose-400 shrink-0 mt-0.5 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-rose-400 font-bold font-mono text-xs uppercase tracking-wider">
                  FALSIFICATION DETECTED
                </h3>
                <p className="text-rose-200 text-xs mt-1 leading-normal font-mono font-semibold">
                  Rule #{auditReport.rule} Violation: Trace Compromised!
                </p>
                <p className="text-sleek-text-muted text-xs mt-1 leading-normal font-mono">
                  The ReplayEngine instantly falsified verification at Block Index {auditReport.index}.
                </p>
              </div>
            </div>

            <div className="border-t border-rose-900/20 pt-3 mt-1 space-y-2">
              <span className="text-[10px] font-mono font-bold text-rose-400 block uppercase tracking-wider">
                Reasoning & Forensic Context
              </span>
              <p className="text-[11px] text-rose-200 font-mono leading-relaxed bg-sleek-sidebar/80 p-2.5 rounded border border-rose-950/50">
                {auditReport.message}
              </p>

              <div className="flex justify-between items-center bg-sleek-sidebar p-2.5 rounded-lg border border-sleek-border mt-2">
                <div className="flex flex-col">
                  <span className="text-[10.5px] text-sleek-text font-semibold font-mono">Heal Ledger?</span>
                  <span className="text-[9.5px] text-sleek-text-muted font-mono leading-relaxed">Recalculates all sequential hashes to restore validity.</span>
                </div>
                <button
                  onClick={() => { playSuccess(); onHealLedger(); }}
                  className="px-2.5 py-1.5 bg-sleek-success-dark hover:bg-sleek-success text-white font-mono text-[10px] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* 2. Real-time Trust Decay & Variance Chart */}
      <div className="bg-sleek-card border border-sleek-border rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-indigo-400" />
            <h3 className="font-display font-semibold text-sleek-text text-sm tracking-tight">
              Trust Decay Monitor
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold bg-indigo-950/40 border border-indigo-500/40 text-indigo-400 px-2 py-0.5 rounded-full uppercase">
            Last 20 Blocks
          </span>
        </div>
        <p className="text-sleek-text-muted text-[11px] leading-relaxed">
          Plots the absolute variance between primary inputs (cyan <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#06b6d4]"></span>) and shadow track predictions (indigo <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#818cf8]"></span>).
        </p>
        <VarianceChart
          ledger={ledger}
          threshold={threshold}
          shadowTrackEnabled={shadowTrackEnabled}
        />
      </div>

      {/* 3. Interactive JSON Exporter */}
      <div className="bg-sleek-card border border-sleek-border rounded-xl p-4">
        <button
          onClick={() => { playClick(); setShowJson(!showJson); }}
          className="w-full flex items-center justify-between text-sleek-text hover:text-white transition-colors cursor-pointer"
          id="toggle-json-exporter"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-sleek-text-muted" />
            <h3 className="font-display font-semibold text-sm tracking-tight">Ledger Exporter (JSON)</h3>
          </div>
          {showJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showJson && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sleek-text-muted text-xs leading-relaxed">
              Export the complete blockchain ledger representation containing transition records, step hashes, and chain signatures.
            </p>
            <div className="relative">
              <pre className="bg-sleek-sidebar p-3 rounded-lg text-[10px] font-mono text-sleek-text-muted overflow-x-auto max-h-[180px] border border-sleek-border">
                {JSON.stringify(ledger, null, 2)}
              </pre>
              <button
                onClick={handleCopyJson}
                className="absolute right-2 top-2 p-1.5 bg-sleek-card hover:bg-sleek-border border border-sleek-border rounded text-sleek-text-muted hover:text-sleek-text transition-colors cursor-pointer"
                title="Copy JSON to clipboard"
                id="btn-copy-json"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-sleek-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyJson}
                className="flex-1 py-1.5 bg-sleek-sidebar hover:bg-sleek-border border border-sleek-border text-sleek-text rounded text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                Copy Clipboard
              </button>
              <button
                onClick={handleDownloadLedger}
                className="flex-1 py-1.5 bg-sleek-sidebar hover:bg-sleek-border border border-sleek-border text-sleek-text rounded text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
