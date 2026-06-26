/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, ShieldCheck, ShieldAlert, ArrowRight, Edit, Check, RotateCcw, AlertTriangle, Key } from 'lucide-react';
import { Block, FalsificationReport } from '../types';
import { calculateSeedHash } from '../utils/crypto';
import { playClick, playSuccess, playAction } from '../utils/audio';

interface LedgerTimelineProps {
  seed: number;
  ledger: Block[];
  auditReport: FalsificationReport;
  onUpdateBlock: (index: number, updatedBlock: Block) => void;
  onResetBlock: (index: number) => void;
}

export const LedgerTimeline: React.FC<LedgerTimelineProps> = ({
  seed,
  ledger,
  auditReport,
  onUpdateBlock,
  onResetBlock,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Keep a local draft of the block currently being edited
  const [draftBlock, setDraftBlock] = useState<Block | null>(null);

  const startEditing = (index: number, block: Block) => {
    setEditingIndex(index);
    // Deep clone the block for drafting
    setDraftBlock(JSON.parse(JSON.stringify(block)));
  };

  const handleDraftChange = (field: string, value: any) => {
    if (!draftBlock) return;

    const updated = { ...draftBlock };
    if (field === 'event') {
      updated.step.input_event = value;
    } else if (field === 'pre_value') {
      updated.step.pre_state.value = parseInt(value, 10) || 0;
    } else if (field === 'pre_clock') {
      updated.step.pre_state.logical_clock = parseInt(value, 10) || 0;
    } else if (field === 'post_value') {
      updated.step.post_state.value = parseInt(value, 10) || 0;
    } else if (field === 'post_clock') {
      updated.step.post_state.logical_clock = parseInt(value, 10) || 0;
    } else if (field === 'hash') {
      updated.step.hash = value;
    } else if (field === 'chain_hash') {
      updated.chain_hash = value;
    } else if (field === 'index') {
      updated.step.index = parseInt(value, 10) || 0;
    }

    setDraftBlock(updated);
  };

  const saveEdit = (index: number) => {
    if (draftBlock) {
      onUpdateBlock(index, draftBlock);
    }
    setEditingIndex(null);
    setDraftBlock(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftBlock(null);
  };

  // Determine if a block index has been tampered with
  const getBlockVerificationStatus = (index: number) => {
    if (auditReport.status === 'failed' && auditReport.index !== null) {
      if (index === auditReport.index) {
        return 'failed';
      }
      if (index > auditReport.index) {
        return 'unverified'; // standard blocks downstream of a break are unverified
      }
    }
    return 'valid';
  };

  const genesisHash = calculateSeedHash(seed);

  return (
    <div className="flex flex-col gap-4 text-sleek-text" id="ledger-timeline">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sleek-accent" />
          <h2 className="font-display font-bold text-sleek-text text-base">
            Cryptographic Hashchain Trace
          </h2>
        </div>
        <span className="text-xs font-mono text-sleek-text-muted">
          Genesis Link Root Anchor (S₀)
        </span>
      </div>

      {/* Ledger Stream Visualizer */}
      <div className="space-y-4">
        {/* GENESIS ANCHOR NODE */}
        <div className="border border-sleek-border bg-sleek-card rounded-xl p-4 relative" id="genesis-node">
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-sleek-accent rounded-full border-2 border-sleek-bg" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-sleek-accent" />
              <span className="font-mono text-xs font-bold text-sleek-text">Genesis Block (S₀)</span>
            </div>
            <span className="text-[10px] font-mono text-sleek-accent bg-sleek-sidebar border border-sleek-border px-2.5 py-0.5 rounded-full font-semibold">
              ROOT SEED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-sleek-text-muted block mb-1 uppercase text-[10px] tracking-wider">GENESIS SEED PARAMETER</span>
              <span className="text-sleek-accent text-sm font-semibold">0x{seed.toString(16).toUpperCase().padStart(4, '0')} ({seed})</span>
            </div>
            <div>
              <span className="text-sleek-text-muted block mb-1 uppercase text-[10px] tracking-wider">SEED ROOT CRYPTO HASH L₀</span>
              <span className="text-sleek-text-muted text-xs break-all truncate block" title={genesisHash}>
                {genesisHash}
              </span>
            </div>
          </div>
        </div>

        {ledger.length === 0 ? (
          <div className="border border-dashed border-sleek-border bg-sleek-card/30 rounded-xl p-8 text-center text-sleek-text-muted flex flex-col items-center justify-center gap-2">
            <Layers className="w-8 h-8 text-sleek-border" />
            <p className="text-xs font-medium text-sleek-text">No blocks mined on the ledger chain yet.</p>
            <p className="text-[10px] text-sleek-text-muted">
              Run projections on the transaction panel to begin mining chronological blocks.
            </p>
          </div>
        ) : (
          ledger.map((block, i) => {
            const status = getBlockVerificationStatus(i);
            const isEditing = editingIndex === i;
            const currentBlockData = isEditing ? draftBlock! : block;

            // Compute connection link state to the *previous* block
            const isLinkBroken = auditReport.status === 'failed' && auditReport.index !== null && i >= auditReport.index;

            return (
              <React.Fragment key={i}>
                {/* CONNECTIVE HASHCHAIN LINK */}
                <div className="flex items-center justify-center py-1">
                  <div className="w-full flex items-center gap-3 px-4">
                    <div className="flex-1 border-t border-dashed border-sleek-border" />
                    
                    {isLinkBroken ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/40 text-rose-400 text-[10px] font-mono font-semibold animate-pulse">
                        <ShieldAlert className="w-3 h-3" />
                        <span>TAMPERED HASH LINK</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sleek-success-dark/15 border border-sleek-success/40 text-sleek-success text-[10px] font-mono font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>HASHCHAIN LINK VERIFIED</span>
                      </div>
                    )}
                    
                    <div className="flex-1 border-t border-dashed border-sleek-border" />
                  </div>
                </div>

                {/* BLOCK CARD */}
                <div
                  className={`border rounded-xl p-4 relative transition-all ${
                    status === 'failed'
                      ? 'border-rose-500 bg-rose-950/15 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                      : status === 'unverified'
                      ? 'border-sleek-border bg-sleek-sidebar/50 opacity-60'
                      : 'border-sleek-border bg-sleek-card hover:border-sleek-accent/50'
                  }`}
                  id={`block-card-${i}`}
                >
                  {/* Left node anchor visual */}
                  <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-sleek-bg ${
                    status === 'failed' ? 'bg-rose-500 animate-ping' : 'bg-sleek-border'
                  }`} />

                  {/* Block Header */}
                  <div className="flex items-start justify-between mb-3 pb-2 border-b border-sleek-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sleek-text text-sm">
                          Step #{currentBlockData.step.index}
                        </span>
                        {status === 'failed' && (
                          <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase animate-bounce">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Tampered / Failed Replay
                          </span>
                        )}
                        {status === 'unverified' && (
                          <span className="text-[9px] font-mono bg-sleek-sidebar border border-sleek-border text-sleek-text-muted px-2 py-0.5 rounded-full uppercase">
                            Unverified Downstream
                          </span>
                        )}
                        {currentBlockData.step.is_synthetic && (
                          <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-indigo-950/40 border border-indigo-500/40 text-indigo-400 px-2 py-0.5 rounded-full uppercase" title={`Bypassed corrupted sensor input. Projected via linear momentum shadow track: ${currentBlockData.step.shadow_prediction}`}>
                            Synthetic Bypass
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-sleek-text-muted font-mono">
                        Cumulative block chain item
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => { playAction(); saveEdit(i); }}
                            className="p-1.5 text-sleek-success bg-sleek-success-dark/15 border border-sleek-success/40 rounded hover:bg-sleek-success-dark/30 transition-colors cursor-pointer"
                            title="Apply changes to ledger"
                            id={`btn-save-edit-${i}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { playClick(); cancelEdit(); }}
                            className="p-1.5 text-sleek-text-muted bg-sleek-sidebar border border-sleek-border rounded hover:bg-sleek-border transition-colors cursor-pointer"
                            title="Cancel editing"
                            id={`btn-cancel-edit-${i}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { playClick(); startEditing(i, block); }}
                            className="p-1.5 text-sleek-text-muted hover:text-sleek-text bg-sleek-sidebar border border-sleek-border rounded hover:border-sleek-accent/40 transition-colors cursor-pointer"
                            title="Manually alter block variables to inject an anomaly"
                            id={`btn-edit-block-${i}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {(block.step.input_event !== ledger[i]?.step.input_event ||
                            block.step.post_state.value !== ledger[i]?.step.post_state.value ||
                            block.step.pre_state.value !== ledger[i]?.step.pre_state.value) && (
                            <button
                              onClick={() => { playSuccess(); onResetBlock(i); }}
                              className="p-1.5 text-amber-400 hover:text-amber-300 bg-amber-950/15 border border-amber-900/40 rounded hover:bg-amber-900/30 transition-colors cursor-pointer"
                              title="Restore block variables to original truth projection"
                              id={`btn-restore-block-${i}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Error Notification Detail inside block card if it is the failed index */}
                  {status === 'failed' && (
                    <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-500/20 rounded-lg text-[11px] font-mono text-rose-300 leading-relaxed">
                      <div className="font-bold text-rose-400 uppercase mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span>FALSIFICATION ENFORCED (Rule #{auditReport.rule})</span>
                      </div>
                      {auditReport.message}
                    </div>
                  )}

                  {/* Core Content Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs font-mono">
                    {/* Index Override during edit */}
                    {isEditing && (
                      <div className="col-span-12 md:col-span-3">
                        <label className="text-[10px] text-sleek-text-muted block mb-1">INDEX OVERRIDE</label>
                        <input
                          type="number"
                          value={currentBlockData.step.index}
                          onChange={(e) => handleDraftChange('index', e.target.value)}
                          className="w-full bg-sleek-sidebar text-xs px-2 py-1 rounded border border-sleek-border text-sleek-text focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                    )}

                    {/* Input Event String */}
                    <div className={isEditing ? "col-span-12 md:col-span-9" : "col-span-12"}>
                      <span className="text-sleek-text-muted block mb-1 text-[10px] uppercase tracking-wider">INPUT EVENT STRING</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentBlockData.step.input_event}
                          onChange={(e) => handleDraftChange('event', e.target.value)}
                          className="w-full bg-sleek-sidebar text-xs px-2 py-1.5 rounded border border-sleek-border text-sleek-text focus:outline-none focus:border-rose-500 font-mono"
                        />
                      ) : (
                        <span className="text-sleek-accent bg-sleek-sidebar/80 border border-sleek-border px-2.5 py-1 rounded font-semibold text-sm inline-block">
                          {currentBlockData.step.input_event}
                        </span>
                      )}
                    </div>

                    {/* State Transitions Projection */}
                    <div className="col-span-12 md:col-span-6 bg-sleek-sidebar/50 border border-sleek-border p-2.5 rounded-lg">
                      <span className="text-[10px] text-sleek-text-muted block mb-1 uppercase tracking-wider">STATE PROJECTION (σ_pre → σ_post)</span>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-sleek-text-muted uppercase font-semibold">PRE-STATE</span>
                          {isEditing ? (
                            <div className="flex gap-1.5 mt-1">
                              <input
                                type="number"
                                placeholder="val"
                                value={currentBlockData.step.pre_state.value}
                                onChange={(e) => handleDraftChange('pre_value', e.target.value)}
                                className="w-16 bg-sleek-sidebar text-[10px] px-1 py-0.5 rounded border border-sleek-border text-sleek-text font-mono"
                              />
                              <input
                                type="number"
                                placeholder="clk"
                                value={currentBlockData.step.pre_state.logical_clock}
                                onChange={(e) => handleDraftChange('pre_clock', e.target.value)}
                                className="w-12 bg-sleek-sidebar text-[10px] px-1 py-0.5 rounded border border-sleek-border text-sleek-text font-mono"
                              />
                            </div>
                          ) : (
                            <span className="text-sleek-text mt-0.5">
                              v: <strong className="text-sleek-text">{currentBlockData.step.pre_state.value}</strong> 
                              <span className="text-sleek-border mx-1.5">|</span> 
                              c: <strong className="text-sleek-text-muted">{currentBlockData.step.pre_state.logical_clock}</strong>
                            </span>
                          )}
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-sleek-text-muted shrink-0 self-end mb-1" />

                        <div className="flex flex-col">
                          <span className="text-[9px] text-sleek-text-muted uppercase font-semibold">POST-STATE</span>
                          {isEditing ? (
                            <div className="flex gap-1.5 mt-1">
                              <input
                                type="number"
                                placeholder="val"
                                value={currentBlockData.step.post_state.value}
                                onChange={(e) => handleDraftChange('post_value', e.target.value)}
                                className="w-16 bg-sleek-sidebar text-[10px] px-1 py-0.5 rounded border border-sleek-border text-sleek-text font-mono"
                              />
                              <input
                                type="number"
                                placeholder="clk"
                                value={currentBlockData.step.post_state.logical_clock}
                                onChange={(e) => handleDraftChange('post_clock', e.target.value)}
                                className="w-12 bg-sleek-sidebar text-[10px] px-1 py-0.5 rounded border border-sleek-border text-sleek-text font-mono"
                              />
                            </div>
                          ) : (
                            <span className="text-sleek-text mt-0.5">
                              v: <strong className={currentBlockData.step.is_synthetic ? "text-indigo-400 font-bold" : "text-sleek-success"}>
                                {currentBlockData.step.post_state.value}
                                {currentBlockData.step.is_synthetic && " (Ŝ)"}
                              </strong> 
                              <span className="text-sleek-border mx-1.5">|</span> 
                              c: <strong className="text-sleek-text-muted">{currentBlockData.step.post_state.logical_clock}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      {currentBlockData.step.is_synthetic && (
                        <div className="text-[9.5px] text-indigo-400 font-mono mt-1.5 pt-1.5 border-t border-indigo-500/10">
                          Ŝ_n Predicted: {currentBlockData.step.shadow_prediction} (Bypassed Deviation)
                        </div>
                      )}
                    </div>

                    {/* Cryptographic Step Hash (h_n) */}
                    <div className="col-span-12 md:col-span-6 bg-sleek-sidebar/50 border border-sleek-border p-2.5 rounded-lg flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-sleek-text-muted block mb-1 uppercase tracking-wider">STEP HASH h_n = SHA256(...)</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentBlockData.step.hash}
                            onChange={(e) => handleDraftChange('hash', e.target.value)}
                            className="w-full bg-sleek-sidebar text-[10px] px-1.5 py-1 rounded border border-sleek-border text-rose-300 focus:outline-none font-mono"
                          />
                        ) : (
                          <span className="text-sleek-text-muted text-xs break-all truncate block select-all font-mono" title={currentBlockData.step.hash}>
                            {currentBlockData.step.hash}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cumulative Ledger Hash (L_n) */}
                    <div className="col-span-12 bg-sleek-sidebar/20 border border-sleek-border p-2.5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] text-sleek-text-muted block uppercase tracking-wider">CUMULATIVE CHAIN HASH L_n = SHA256(L_n-1 + h_n)</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentBlockData.chain_hash}
                            onChange={(e) => handleDraftChange('chain_hash', e.target.value)}
                            className="w-full bg-sleek-sidebar text-xs px-2 py-1 rounded border border-sleek-border text-rose-300 focus:outline-none mt-1 font-mono"
                          />
                        ) : (
                          <span className="text-sleek-success font-semibold text-xs break-all tracking-tight font-mono">
                            {currentBlockData.chain_hash}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
