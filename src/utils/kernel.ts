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

export function executeTransaction(
  event: string,
  currentState: State,
  ledger: Block[],
  seed: number
): ExecuteResult {
  const preState = { ...currentState };
  const index = ledger.length;

  const postClock = preState.logical_clock + 1;
  let postValue = preState.value;

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
    postValue = wrappingAdd(postValue, val);
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
    postValue = wrappingSub(postValue, val);
  } else {
    return {
      success: false,
      error: "INVALID_TRANSITION: Command protocol violation. Kernel halted.",
      halted: true
    };
  }

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
      hash: stepHash
    },
    chain_hash: chainHash
  };

  return {
    success: true,
    postState,
    block
  };
}

export function verifyLedger(seed: number, ledger: Block[]): FalsificationReport {
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
    let postValue = virtualState.value;
    const postClock = virtualState.logical_clock + 1;

    if (event.startsWith("ADD:")) {
      const val = parseInt(event.slice(4), 10);
      if (!isNaN(val)) postValue = wrappingAdd(postValue, val);
    } else if (event.startsWith("SUB:")) {
      const val = parseInt(event.slice(4), 10);
      if (!isNaN(val)) postValue = wrappingSub(postValue, val);
    } else {
      return {
        status: 'failed',
        rule: 3,
        message: `FALSIFICATION_FAILURE: Command protocol violation inside step ${i} ("${event}").`,
        index: i
      };
    }

    const replayedPostState: State = { value: postValue, logical_clock: postClock };

    // Falsification Rule 3: Replayed state post-hash drift
    if (step.post_state.value !== replayedPostState.value || step.post_state.logical_clock !== replayedPostState.logical_clock) {
      return {
        status: 'failed',
        rule: 3,
        message: `FALSIFICATION_FAILURE: Transition logic drift at step ${i}. Replayed output (val: ${replayedPostState.value}, clock: ${replayedPostState.logical_clock}) diverges from recorded output (val: ${step.post_state.value}, clock: ${step.post_state.logical_clock}).`,
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
