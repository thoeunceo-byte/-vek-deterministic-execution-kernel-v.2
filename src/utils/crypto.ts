/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { State } from '../types';

/**
 * Pure TypeScript synchronous implementation of SHA-256
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  const asciiBytes: number[] = [];
  for (i = 0; i < ascii[lengthProperty]; i++) {
    asciiBytes.push(ascii.charCodeAt(i));
  }
  
  asciiBytes.push(0x80);
  while (asciiBytes[lengthProperty] % 64 !== 56) {
    asciiBytes.push(0);
  }
  
  const bitsHex = asciiLength.toString(16);
  const bitsBytes = new Array(8).fill(0);
  for (i = 0; i < bitsHex.length; i += 2) {
    const start = Math.max(0, bitsHex.length - i - 2);
    const end = bitsHex.length - i;
    bitsBytes[7 - Math.floor(i / 2)] = parseInt(bitsHex.slice(start, end), 16) || 0;
  }
  asciiBytes.push(...bitsBytes);

  for (i = 0; i < asciiBytes[lengthProperty]; i += 4) {
    words.push(
      (asciiBytes[i] << 24) |
      (asciiBytes[i + 1] << 16) |
      (asciiBytes[i + 2] << 8) |
      asciiBytes[i + 3]
    );
  }

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = new Array(64);
    for (j = 0; j < 16; j++) {
      w[j] = words[i + j];
    }
    for (j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, hVar] = hash;

    for (j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hVar + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      hVar = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + hVar) | 0;
  }

  for (i = 0; i < 8; i++) {
    let word = hash[i];
    if (word < 0) {
      word += 0x100000000;
    }
    const hex = word.toString(16);
    result += hex.padStart(8, '0');
  }

  return result;
}

export function calculateStepHash(index: number, event: string, pre: State, post: State): string {
  // Mimic Rust serde serialization format deterministically
  const payload = JSON.stringify([
    index,
    event,
    { value: pre.value, logical_clock: pre.logical_clock },
    { value: post.value, logical_clock: post.logical_clock }
  ]);
  return sha256(payload);
}

export function calculateLedgerHash(prevLedgerHash: string, stepHash: string): string {
  return sha256(`${prevLedgerHash}+${stepHash}`);
}

export function calculateSeedHash(seed: number): string {
  return sha256(`SEED:${seed}`);
}
