/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface State {
  value: number;
  logical_clock: number;
}

export interface TraceStep {
  index: number;
  input_event: string;
  pre_state: State;
  post_state: State;
  hash: string; // Step Hash: h_n = SHA256(index + event + pre_state + post_state)
  is_synthetic?: boolean;
  shadow_prediction?: number;
}

export interface Block {
  step: TraceStep;
  chain_hash: string; // Cumulative Ledger Hash: L_n = SHA256(L_n-1 + h_n)
}

export interface FalsificationReport {
  status: 'valid' | 'failed';
  rule: number | null; // 1 to 5
  message: string | null;
  index: number | null; // index of the block that triggered the failure
}
