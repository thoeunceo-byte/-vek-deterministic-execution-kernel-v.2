/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { State, Block, FalsificationReport } from '../types';
import { calculateStepHash, calculateLedgerHash, calculateSeedHash } from './crypto';

const MAX_U64 = 18446744073709551615n;

export function wrappingAdd(a: number, b: number): number {
  try {
    const sum = BigInt(a) + BigInt(b);
    return Number(sum & MAX_U64);
  } catch {
    return (a + b) >>> 0;
  }
}

export function wrappingSub(a: number, b: number): number {
  try {
    let diff = BigInt(a) - BigInt(b);
    if (diff < 0n) {
      diff = (diff + (MAX_U64 + 1n));
    }
    return Number(diff & MAX_U64);
  } catch {
    return (a - b) >>> 0;
  }
}

export interface ExecuteResult {
  success: boolean;
  error?: string;
  halted?: boolean;
  postState?: State;
  block?: Block;
}

export function getShadowPrediction(ledger: Block[], seed: number): number {
  const len = ledger.length;
  if (len === 0) {
    return seed;
  }
  if (len === 1) {
    return ledger[0].step.post_state.value;
  }
  // Linear extrapolation from the last two states
  const val1 = ledger[len - 1].step.post_state.value;
  const val2 = ledger[len - 2].step.post_state.value;
  const delta = val1 - val2;
  return val1 + delta;
}

export function executeTransaction(
  event: string,
  currentState: State,
  ledger: Block[],
  seed: number,
  threshold: number = 50,
  shadowTrackEnabled: boolean = true
): ExecuteResult {
  const preState = { ...currentState };
  const index = ledger.length;

  const postClock = preState.logical_clock + 1;
  let proposedValue = preState.value;

  if (event.startsWith("ADD:")) {
    const valStr = event.slice(4);
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) {
      return {
        success: false,
        error: "INVALID_TRANSITION: Non-integer parameter. Kernel halted.",
        halted: true
      };
    }
    proposedValue = wrappingAdd(proposedValue, val);
  } else if (event.startsWith("SUB:")) {
    const valStr = event.slice(4);
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) {
      return {
        success: false,
        error: "INVALID_TRANSITION: Non-integer parameter. Kernel halted.",
        halted: true
      };
    }
    proposedValue = wrappingSub(proposedValue, val);
  } else {
    return {
      success: false,
      error: "INVALID_TRANSITION: Command protocol violation. Kernel halted.",
      halted: true
    };
  }

  // Calculate Shadow Track Prediction & Check Trust Threshold Deviation
  const shadowPrediction = getShadowPrediction(ledger, seed);
  const deviation = Math.abs(proposedValue - shadowPrediction);
  const isSynthetic = shadowTrackEnabled && (deviation > threshold);

  // If deviation exceeds trust threshold, gracefully degrade by using Shadow Track projection
  const postValue = isSynthetic ? shadowPrediction : proposedValue;

  const postState: State = { value: postValue, logical_clock: postClock };
  const stepHash = calculateStepHash(index, event, preState, postState);

  const prevChainHash = ledger.length > 0
    ? ledger[ledger.length - 1].chain_hash
    : calculateSeedHash(seed);

  const chainHash = calculateLedgerHash(prevChainHash, stepHash);

  const block: Block = {
    step: {
      index,
      input_event: event,
      pre_state: preState,
      post_state: postState,
      hash: stepHash,
      is_synthetic: isSynthetic,
      shadow_prediction: shadowPrediction
    },
    chain_hash: chainHash
  };

  return {
    success: true,
    postState,
    block
  };
}

export function verifyLedger(
  seed: number,
  ledger: Block[],
  threshold: number = 50,
  shadowTrackEnabled: boolean = true
): FalsificationReport {
  let virtualState: State = { value: seed, logical_clock: 0 };
  let expectedPrevHash = calculateSeedHash(seed);

  for (let i = 0; i < ledger.length; i++) {
    const block = ledger[i];
    const step = block.step;

    // Falsification Rule 1: Index progression mismatch
    if (step.index !== i) {
      return {
        status: 'failed',
        rule: 1,
        message: `FALSIFICATION_FAILURE: Sequence gap at index ${i}. Expected step index ${i}, but found ${step.index}.`,
        index: i
      };
    }

    // Falsification Rule 2: Pre-state replay divergence
    if (step.pre_state.value !== virtualState.value || step.pre_state.logical_clock !== virtualState.logical_clock) {
      return {
        status: 'failed',
        rule: 2,
        message: `FALSIFICATION_FAILURE: Input state drift at step ${i}. Replay expected pre-state (val: ${virtualState.value}, clock: ${virtualState.logical_clock}), but block specified (val: ${step.pre_state.value}, clock: ${step.pre_state.logical_clock}).`,
        index: i
      };
    }

    const event = step.input_event;
    let proposedValue = virtualState.value;
    const postClock = virtualState.logical_clock + 1;

    if (event.startsWith("ADD:")) {
      const val = parseInt(event.slice(4), 10);
      if (!isNaN(val)) proposedValue = wrappingAdd(proposedValue, val);
    } else if (event.startsWith("SUB:")) {
      const val = parseInt(event.slice(4), 10);
      if (!isNaN(val)) proposedValue = wrappingSub(proposedValue, val);
    } else {
      return {
        status: 'failed',
        rule: 3,
        message: `FALSIFICATION_FAILURE: Command protocol violation inside step ${i} ("${event}").`,
        index: i
      };
    }

    // Check Shadow Track Prediction and Trust Threshold Deviation for Replay
    const prefixLedger = ledger.slice(0, i);
    const shadowPrediction = getShadowPrediction(prefixLedger, seed);
    const deviation = Math.abs(proposedValue - shadowPrediction);
    const expectedSynthetic = shadowTrackEnabled && (deviation > threshold);
    const expectedValue = expectedSynthetic ? shadowPrediction : proposedValue;

    const replayedPostState: State = { value: expectedValue, logical_clock: postClock };

    // Falsification Rule 3: Replayed state post-hash drift (which now checks shadow prediction correctness)
    if (step.post_state.value !== replayedPostState.value || step.post_state.logical_clock !== replayedPostState.logical_clock) {
      return {
        status: 'failed',
        rule: 3,
        message: `FALSIFICATION_FAILURE: Transition logic drift at step ${i}. Replayed output (val: ${replayedPostState.value}, clock: ${replayedPostState.logical_clock}) diverges from recorded output (val: ${step.post_state.value}, clock: ${step.post_state.logical_clock}).`,
        index: i
      };
    }

    // Verify synthetic metadata flag matches replayed expectations
    const blockSynthetic = !!step.is_synthetic;
    if (blockSynthetic !== expectedSynthetic) {
      return {
        status: 'failed',
        rule: 3,
        message: `FALSIFICATION_FAILURE: Synthetic flag mismatch at step ${i}. Expected ${expectedSynthetic} (deviation ${deviation} vs threshold ${threshold}), but block recorded is_synthetic: ${blockSynthetic}.`,
        index: i
      };
    }

    // Falsification Rule 4: Trace step hash mutation
    const recalculatedStepHash = calculateStepHash(i, event, step.pre_state, step.post_state);
    if (step.hash !== recalculatedStepHash) {
      return {
        status: 'failed',
        rule: 4,
        message: `FALSIFICATION_FAILURE: Cryptographic mutation at step ${i}. Step payload SHA-256 does not match recorded step hash. Recalculated: ${recalculatedStepHash.slice(0, 8)}... vs Recorded: ${step.hash.slice(0, 8)}...`,
        index: i
      };
    }

    // Falsification Rule 5: Cumulative Hashchain breakage
    const expectedChainHash = calculateLedgerHash(expectedPrevHash, step.hash);
    if (block.chain_hash !== expectedChainHash) {
      return {
        status: 'failed',
        rule: 5,
        message: `FALSIFICATION_FAILURE: Chain link broken at step ${i}. Cumulative chain hash does not link to previous chain hash. Expected: ${expectedChainHash.slice(0, 8)}... but found: ${block.chain_hash.slice(0, 8)}...`,
        index: i
      };
    }

    virtualState = replayedPostState;
    expectedPrevHash = block.chain_hash;
  }

  return {
    status: 'valid',
    rule: null,
    message: "HASHCHAIN VERIFIED: The replay execution exactly matches the cryptographic trace. 0 anomalies detected.",
    index: null
  };
}
