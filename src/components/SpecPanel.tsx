/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, FileCode, Check, Copy } from 'lucide-react';

export const SpecPanel: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'spec' | 'rust'>('spec');

  const rustCode = `use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use std::sync::{Arc, Mutex};

// =========================================================================
// 1. CANONICAL SCHEMAS & DETERMINISTIC SERIALIZATION
// =========================================================================

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct State {
    pub value: u64,
    pub logical_clock: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct TraceStep {
    pub index: usize,
    pub input_event: String,
    pub pre_state: State,
    pub post_state: State,
    pub hash: String, // h_n = SHA255(index + event + pre_state + post_state)
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Block {
    pub step: TraceStep,
    pub chain_hash: String, // L_n = SHA256(L_n-1 + h_n)
}

// =========================================================================
// 2. CRYPTOGRAPHIC PRIMITIVES
// =========================================================================

pub fn calculate_step_hash(index: usize, event: &str, pre: &State, post: &State) -> String {
    let payload = serde_json::to_string(&(index, event, pre, post)).unwrap();
    let mut hasher = Sha256::new();
    hasher.update(payload.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn calculate_ledger_hash(prev_ledger_hash: &str, step_hash: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{}+{}", prev_ledger_hash, step_hash).as_bytes());
    format!("{:x}", hasher.finalize())
}

// =========================================================================
// 3. THE DETERMINISTIC KERNEL (State Machine & Active Halt)
// =========================================================================

pub struct Kernel {
    pub seed: u64,
    pub state: State,
    pub ledger: Vec<Block>,
    pub halted: bool,
}

impl Kernel {
    pub fn new(seed: u64) -> Self {
        Kernel {
            seed,
            state: State { value: seed, logical_clock: 0 },
            ledger: vec![],
            halted: false,
        }
    }

    /// The Deterministic Execution Equation: f(σ, e) -> (σ', h)
    pub fn execute(&mut self, event: &str) -> Result<String, String> {
        if self.halted {
            return Err("KERNEL_HALTED: Write rejected on a compromised kernel.".to_string());
        }

        let pre_state = self.state.clone();
        let index = self.ledger.len();

        let post_clock = pre_state.logical_clock + 1;
        let mut post_value = pre_state.value;

        if event.starts_with("ADD:") {
            if let Ok(val) = event["ADD:".len()..].parse::<u64>() {
                post_value = post_value.wrapping_add(val);
            }
        } else if event.starts_with("SUB:") {
            if let Ok(val) = event["SUB:".len()..].parse::<u64>() {
                post_value = post_value.wrapping_sub(val);
            }
        } else {
            self.halted = true;
            return Err("INVALID_TRANSITION: Command protocol violation. Kernel halted.".to_string());
        }

        let post_state = State { value: post_value, logical_clock: post_clock };
        let step_hash = calculate_step_hash(index, event, &pre_state, &post_state);
        let trace_step = TraceStep {
            index,
            input_event: event.to_string(),
            pre_state,
            post_state: post_state.clone(),
            hash: step_hash.clone(),
        };

        let prev_chain_hash = self.ledger.last()
            .map(|b| b.chain_hash.clone())
            .unwrap_or_else(|| format!("{:x}", Sha256::digest(format!("SEED:{}", self.seed).as_bytes())));
        
        let chain_hash = calculate_ledger_hash(&prev_chain_hash, &step_hash);

        self.state = post_state;
        self.ledger.push(Block { step: trace_step, chain_hash: chain_hash.clone() });

        Ok(chain_hash)
    }
}

// =========================================================================
// 4. THE ZERO-TRUST REPLAY & VALIDATION ENGINE
// =========================================================================

pub struct ReplayEngine;

impl ReplayEngine {
    pub fn verify_replay(seed: u64, ledger: &[Block]) -> Result<(), String> {
        let mut virtual_kernel = Kernel::new(seed);
        let mut expected_prev_hash = format!("{:x}", Sha256::digest(format!("SEED:{}", seed).as_bytes()));

        for (i, block) in ledger.iter().enumerate() {
            let step = &block.step;

            if step.index != i {
                return Err(format!("FALSIFICATION_FAILURE: Sequence gap at index {}", i));
            }
            if step.pre_state != virtual_kernel.state {
                return Err(format!("FALSIFICATION_FAILURE: Input state drift at step {}", i));
            }

            let replayed_chain_hash = virtual_kernel.execute(&step.input_event)?;
            let current_block = &virtual_kernel.ledger[i];

            if step.post_state != current_block.step.post_state {
                return Err(format!("FALSIFICATION_FAILURE: Transition logic drift at step {}", i));
            }
            if step.hash != current_block.step.hash {
                return Err(format!("FALSIFICATION_FAILURE: Cryptographic mutation at step {}", i));
            }

            let expected_chain_hash = calculate_ledger_hash(&expected_prev_hash, &step.hash);
            if block.chain_hash != expected_chain_hash {
                return Err(format!("FALSIFICATION_FAILURE: Chain link broken at step {}", i));
            }

            expected_prev_hash = block.chain_hash.clone();
        }

        Ok(())
    }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rustCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden" id="spec-panel">
      {/* Tabs */}
      <div className="flex border-b border-zinc-900 bg-zinc-950 px-2 pt-2">
        <button
          onClick={() => setActiveTab('spec')}
          className={`px-4 py-2 text-xs font-medium border-b-2 font-display flex items-center gap-1.5 transition-all ${
            activeTab === 'spec'
              ? 'border-emerald-500 text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          id="tab-spec-math"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Equation Specification</span>
        </button>
        <button
          onClick={() => setActiveTab('rust')}
          className={`px-4 py-2 text-xs font-medium border-b-2 font-display flex items-center gap-1.5 transition-all ${
            activeTab === 'rust'
              ? 'border-emerald-500 text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          id="tab-spec-rust"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Rust Kernel Core</span>
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'spec' ? (
          /* MATHEMATICAL SPEC VIEW */
          <div className="space-y-4">
            <div>
              <h3 className="text-zinc-100 text-sm font-bold font-display">The Irreducible Execution Equation</h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                VEK-Core v0.1 reduces ledger state correctness guarantees into a single mathematical equation of deterministic state projections and hash chain chaining.
              </p>
            </div>

            {/* Formula Cards */}
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                  1. State Transition Projection Law
                </span>
                <div className="text-emerald-400 text-sm py-1 border-b border-zinc-850">
                  f(σ, e) → (σ', h_n)
                </div>
                <div className="text-zinc-400 text-[11px] leading-relaxed mt-1">
                  Given the pre-state <code className="text-zinc-200">σ = (value, clock)</code> and incoming event <code className="text-zinc-200">e</code>, the kernel deterministically projects the post-state <code className="text-zinc-200">σ'</code> and generates a distinct step signature <code className="text-zinc-200">h_n</code>.
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                  2. Step Hash Equation
                </span>
                <div className="text-emerald-400 text-sm py-1 border-b border-zinc-850">
                  h_n = SHA256(index ∥ event ∥ σ_pre ∥ σ_post)
                </div>
                <div className="text-zinc-400 text-[11px] leading-relaxed mt-1">
                  The step signature <code className="text-zinc-200">h_n</code> mathematically freezes the transition context. Any modifications to the indices, commands, input states, or projected outcomes instantly alters <code className="text-zinc-200">h_n</code>.
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                  3. Ledger Chain Cumulative Law
                </span>
                <div className="text-emerald-400 text-sm py-1 border-b border-zinc-850">
                  L_n = SHA256(L_n-1 + h_n)
                </div>
                <div className="text-zinc-400 text-[11px] leading-relaxed mt-1">
                  The cumulative signature <code className="text-zinc-200">L_n</code> hashes the previous block's signature <code className="text-zinc-200">L_n-1</code> with the current step's signature. This establishes an unbreakable tamper-proof cryptographic timeline.
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-3">
              <h4 className="text-zinc-300 font-display font-semibold text-xs mb-1">
                Zero-Trust Audit Proof
              </h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed font-sans">
                A verification replay evaluates the chronological ledger. If any intermediate value is memory-altered, the re-computed <code className="text-zinc-200">L_n</code> signature breaks instantly. Security audits can verify complete ledger integrity in $O(N)$ operations.
              </p>
            </div>
          </div>
        ) : (
          /* RUST KERNEL VIEW */
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10.5px] font-mono text-zinc-400">vek_core_v01.rs (240 lines)</span>
              <button
                onClick={handleCopyCode}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                id="btn-copy-rust-code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Code</span>
              </button>
            </div>
            <pre className="bg-zinc-900 p-3.5 rounded-lg text-[10.5px] font-mono text-zinc-300 overflow-x-auto max-h-[380px] border border-zinc-850 select-all leading-relaxed whitespace-pre">
              {rustCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
