/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { State, Block, FalsificationReport } from './types';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { LedgerTimeline } from './components/LedgerTimeline';
import { AuditorPanel } from './components/AuditorPanel';
import { SpecPanel } from './components/SpecPanel';
import { executeTransaction, verifyLedger, wrappingAdd, wrappingSub, getShadowPrediction } from './utils/kernel';
import { calculateSeedHash, calculateStepHash, calculateLedgerHash } from './utils/crypto';

export default function App() {
  // 1. Core State variables of the Verifiable Execution Kernel
  const [seed, setSeed] = useState<number>(42);
  const [currentState, setCurrentState] = useState<State>({ value: 42, logical_clock: 0 });
  const [ledger, setLedger] = useState<Block[]>([]);
  const [halted, setHalted] = useState<boolean>(false);
  const [haltReason, setHaltReason] = useState<string>('');
  
  // Shadow Track Adaptive state
  const [threshold, setThreshold] = useState<number>(120);
  const [shadowTrackEnabled, setShadowTrackEnabled] = useState<boolean>(true);

  const shadowPrediction = useMemo(() => {
    return getShadowPrediction(ledger, seed);
  }, [ledger, seed]);
  
  // Terminal Logs
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Verifiable Execution Kernel booted with seed: 42.',
    '[INIT] Replay engine active and monitoring sequence integrity.',
  ]);

  // Track the original un-fuzzed ledger to allow selective restorations
  const [backupLedger, setBackupLedger] = useState<Block[]>([]);

  // 2. Load Demo Ledger (Matches official Rust test case)
  const handleLoadDemo = () => {
    const demoSeed = 42;
    setSeed(demoSeed);
    setHalted(false);
    setHaltReason('');

    const events = ['ADD:100', 'SUB:30', 'ADD:5'];
    let state: State = { value: demoSeed, logical_clock: 0 };
    const tempLedger: Block[] = [];

    events.forEach((event, i) => {
      const res = executeTransaction(event, state, tempLedger, demoSeed, threshold, shadowTrackEnabled);
      if (res.success && res.postState && res.block) {
        tempLedger.push(res.block);
        state = res.postState;
      }
    });

    setLedger(tempLedger);
    setBackupLedger(JSON.parse(JSON.stringify(tempLedger)));
    setCurrentState(state);
    
    setLogs([
      `[INIT] Loaded demo ledger containing 3 chronological steps.`,
      `  -> Step #0: "ADD:100" (Clock: 1, Value: 142)`,
      `  -> Step #1: "SUB:30" (Clock: 2, Value: 112)`,
      `  -> Step #2: "ADD:5" (Clock: 3, Value: 117)`,
      `[INIT] Zero-Trust ReplayEngine evaluated chain. Status: VERIFIED.`,
    ]);
  };

  // Load demo ledger on initial mount for rich first-time UI experience
  useEffect(() => {
    handleLoadDemo();
  }, []);

  // 3. Compute real-time Replay Audit report whenever ledger, seed or state changes
  const auditReport = useMemo<FalsificationReport>(() => {
    return verifyLedger(seed, ledger, threshold, shadowTrackEnabled);
  }, [ledger, seed, threshold, shadowTrackEnabled]);

  // 4. Reset Kernel back to initial genesis seed
  const handleReset = () => {
    setHalted(false);
    setHaltReason('');
    setCurrentState({ value: seed, logical_clock: 0 });
    setLedger([]);
    setBackupLedger([]);
    setLogs([
      `[RESET] Kernel reset back to genesis seed S₀: ${seed}.`,
      `[RESET] Ledger database purged. Logical Clock σ_t reset to 0.`,
    ]);
  };

  // 5. Reseed with a random security u64 value
  const handleReseed = () => {
    const randomSeed = Math.floor(Math.random() * 900) + 100;
    setSeed(randomSeed);
    setHalted(false);
    setHaltReason('');
    setCurrentState({ value: randomSeed, logical_clock: 0 });
    setLedger([]);
    setBackupLedger([]);
    setLogs([
      `[RESEED] Core reseeded with custom value S₀: ${randomSeed}.`,
      `[RESEED] Ledger state space reset. Cryptographic genesis hash L₀ re-calculated.`,
    ]);
  };

  // 6. Execute a state mutation transaction
  const handleExecute = (event: string) => {
    if (halted) return;

    const res = executeTransaction(event, currentState, ledger, seed, threshold, shadowTrackEnabled);
    
    if (res.success && res.postState && res.block) {
      const updatedLedger = [...ledger, res.block];
      setLedger(updatedLedger);
      setBackupLedger(JSON.parse(JSON.stringify(updatedLedger)));
      setCurrentState(res.postState);
      
      const isBlockSynthetic = res.block.step.is_synthetic;
      
      setLogs((prev) => [
        `[EXEC] Successful state transition: "${event}"${isBlockSynthetic ? ' [SYNTHETIC BYPASS ACTIVE]' : ''}`,
        `  -> State projected: value = ${res.postState!.value}, clock = ${res.postState!.logical_clock}`,
        isBlockSynthetic ? `  -> [SHADOW OVERRIDE] Input deviated too far from prediction ŝ_n: ${res.block!.step.shadow_prediction}` : '',
        `  -> Step Hash h_${ledger.length}: ${res.block!.step.hash.slice(0, 16)}...`,
        `  -> Cumulative Hash L_${ledger.length}: ${res.block!.chain_hash.slice(0, 16)}...`,
        ...prev.filter(Boolean),
      ].filter(Boolean));
    } else {
      // Emergency Active Halt triggered
      setHalted(true);
      const reason = res.error || "INVALID_TRANSITION: Command protocol violation. Kernel halted.";
      setHaltReason(reason);
      setLogs((prev) => [
        `[CRITICAL] PROTOCOL VIOLATION DETECTED! active_emergency_halt executed!`,
        `  -> Violation: Invalid instruction or parameter format ("${event}").`,
        `  -> Active Halt: Locking state machine. Block mutations permanently suspended.`,
        ...prev,
      ]);
    }
  };

  // 7. Inject Anomaly (Adversarial Threat Fuzzer)
  const handleTriggerAttack = (type: 'tamper-event' | 'value-hijack' | 'hash-splice' | 'clock-drift' | 'index-gap') => {
    if (ledger.length === 0) {
      setLogs((prev) => [
        `[ATTACK BLOCKED] Ledger empty. Please execute some transactions first to build a chain.`,
        ...prev,
      ]);
      return;
    }

    // Select random block to compromise
    const targetIdx = Math.floor(Math.random() * ledger.length);
    const updatedLedger = [...ledger];
    const targetBlock = JSON.parse(JSON.stringify(updatedLedger[targetIdx])) as Block;
    let attackDesc = '';

    switch (type) {
      case 'tamper-event': {
        const oldEvent = targetBlock.step.input_event;
        const parsed = parseInt(oldEvent.slice(4), 10) || 10;
        targetBlock.step.input_event = `ADD:${parsed + 5}`;
        attackDesc = `Altered Input Event of Block #${targetIdx} from "${oldEvent}" to "${targetBlock.step.input_event}" (Rule 4 Violation)`;
        break;
      }
      case 'value-hijack': {
        const oldVal = targetBlock.step.post_state.value;
        targetBlock.step.post_state.value = oldVal + 9999;
        attackDesc = `Hijacked State Memory value of Block #${targetIdx} from ${oldVal} to ${targetBlock.step.post_state.value} (Rule 2 / 3 Violation)`;
        break;
      }
      case 'hash-splice': {
        targetBlock.chain_hash = 'e0f49a8f7c9e1d5a8b2c6d7e0f49a8f7c9e1d5a8b2c6d7e0f49a8f7c9e1d5a8b';
        attackDesc = `Spliced fraudulent Cumulative Chain Hash L_${targetIdx} (Rule 5 Violation)`;
        break;
      }
      case 'clock-drift': {
        const oldClock = targetBlock.step.pre_state.logical_clock;
        targetBlock.step.pre_state.logical_clock = oldClock === 0 ? 0 : oldClock - 1;
        attackDesc = `Injected Temporal Clock Regression on Block #${targetIdx}. Clock stalled at ${targetBlock.step.pre_state.logical_clock} (Rule 2 Violation)`;
        break;
      }
      case 'index-gap': {
        targetBlock.step.index = targetIdx + 13;
        attackDesc = `Corrupted Block Index Sequence at step #${targetIdx}. Set index to ${targetIdx + 13} (Rule 1 Violation)`;
        break;
      }
    }

    updatedLedger[targetIdx] = targetBlock;
    setLedger(updatedLedger);
    
    setLogs((prev) => [
      `[ATTACK INJECTED] Threat: ${attackDesc}`,
      `  -> ReplayEngine status: COMPROMISED. Running real-time invariant falsification checks...`,
      ...prev,
    ]);
  };

  // 8. Manual parameters update from timeline
  const handleUpdateBlock = (index: number, updatedBlock: Block) => {
    const updatedLedger = [...ledger];
    updatedLedger[index] = updatedBlock;
    setLedger(updatedLedger);
    setLogs((prev) => [
      `[MANUAL EDIT] Modified Block #${index} parameters directly in timeline.`,
      `  -> ReplayEngine evaluating changes...`,
      ...prev,
    ]);
  };

  // 9. Restore specific block to original uncompromised truth
  const handleResetBlock = (index: number) => {
    if (backupLedger[index]) {
      const updatedLedger = [...ledger];
      updatedLedger[index] = JSON.parse(JSON.stringify(backupLedger[index]));
      setLedger(updatedLedger);
      setLogs((prev) => [
        `[RESTORE] Reverted Block #${index} parameters to original uncompromised truth projection.`,
        ...prev,
      ]);
    }
  };

  // 10. Heal Ledger (Compute correct hashes and values sequentially to make chain valid again)
  const handleHealLedger = () => {
    let virtualState: State = { value: seed, logical_clock: 0 };
    let prevChainHash = calculateSeedHash(seed);
    const healedLedger: Block[] = [];

    ledger.forEach((block, i) => {
      const event = block.step.input_event;
      let proposedValue = virtualState.value;
      const postClock = virtualState.logical_clock + 1;

      // Deterministic arithmetic logic
      if (event.startsWith("ADD:")) {
        const val = parseInt(event.slice(4), 10) || 0;
        proposedValue = wrappingAdd(proposedValue, val);
      } else if (event.startsWith("SUB:")) {
        const val = parseInt(event.slice(4), 10) || 0;
        proposedValue = wrappingSub(proposedValue, val);
      }

      const stepShadowPrediction = getShadowPrediction(healedLedger, seed);
      const deviation = Math.abs(proposedValue - stepShadowPrediction);
      const isSynthetic = shadowTrackEnabled && (deviation > threshold);
      const postValue = isSynthetic ? stepShadowPrediction : proposedValue;

      const postState: State = { value: postValue, logical_clock: postClock };
      const stepHash = calculateStepHash(i, event, virtualState, postState);
      const chainHash = calculateLedgerHash(prevChainHash, stepHash);

      const healedBlock: Block = {
        step: {
          index: i,
          input_event: event,
          pre_state: { ...virtualState },
          post_state: postState,
          hash: stepHash,
          is_synthetic: isSynthetic,
          shadow_prediction: stepShadowPrediction
        },
        chain_hash: chainHash,
      };

      healedLedger.push(healedBlock);
      virtualState = postState;
      prevChainHash = chainHash;
    });

    setLedger(healedLedger);
    setBackupLedger(JSON.parse(JSON.stringify(healedLedger)));
    setCurrentState(virtualState);
    setHalted(false);
    setHaltReason('');

    setLogs((prev) => [
      `[HEALING] Ledger Healing Protocol completed successfully!`,
      `  -> Sequentially re-calculated pre-states, post-states, and cryptographic hashes for ${healedLedger.length} blocks using Shadow Track predictions.`,
      `  -> Chain re-signed. Current Integrity: SECURED.`,
      ...prev,
    ]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-sleek-bg sleek-grid-bg text-sleek-text font-sans flex flex-col selection:bg-sleek-accent/20 selection:text-sleek-accent" id="vek-root">
      {/* 1. Header component */}
      <Header
        seed={seed}
        currentState={currentState}
        ledgerLength={ledger.length}
        halted={halted}
        haltReason={haltReason}
        onReset={handleReset}
        onReseed={handleReseed}
        onAddSampleLedger={handleLoadDemo}
      />

      {/* 2. Primary layout bento container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: Operations Controls, Threats, Console (5/12 grid span) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <ControlPanel
            onExecute={handleExecute}
            onTriggerAttack={handleTriggerAttack}
            halted={halted}
            logs={logs}
            onClearLogs={handleClearLogs}
            threshold={threshold}
            setThreshold={setThreshold}
            shadowTrackEnabled={shadowTrackEnabled}
            setShadowTrackEnabled={setShadowTrackEnabled}
            shadowPrediction={shadowPrediction}
            currentStateValue={currentState.value}
          />
        </div>

        {/* Center column: Interactive visual timeline (4/12 grid span) */}
        <div className="lg:col-span-4 bg-sleek-sidebar border border-sleek-border rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
          <LedgerTimeline
            seed={seed}
            ledger={ledger}
            auditReport={auditReport}
            onUpdateBlock={handleUpdateBlock}
            onResetBlock={handleResetBlock}
          />
        </div>

        {/* Right column: Zero-trust monitor and formal specs (3/12 grid span) */}
        <div className="lg:col-span-3 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
          {/* Real-time Replay Monitor */}
          <AuditorPanel
            auditReport={auditReport}
            ledger={ledger}
            onHealLedger={handleHealLedger}
          />

          {/* Mathematical equations and Rust code spec panel */}
          <SpecPanel />
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-sleek-border p-3 bg-sleek-sidebar text-center text-[11px] text-sleek-text-muted font-mono flex items-center justify-center gap-4 shrink-0" id="vek-footer">
        <span>VEK-Core Specification: v0.1-Release</span>
        <span className="text-sleek-border">•</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sleek-success" />
          Deterministic Cryptographic Chaining
        </span>
      </footer>
    </div>
  );
}
