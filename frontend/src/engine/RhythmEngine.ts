// src/engine/RhythmEngine.ts

import { GraphEngine } from './GraphEngine';
import { WaveBuffer } from './WaveBuffer';
import { generatePWave, generateQRST } from './waveforms/generateWaveforms';
import { generatePulseWave } from './waveforms/generatePulseWave';
import { ECG_CONFIG } from '../constants';
import { SimOptions } from '../types/SimOptions';
import { playBeep } from '../audio/playBeep';

export class RhythmEngine {
  private buffers: Record<string, WaveBuffer>;
  private simOptions: SimOptions;
  private graph: GraphEngine;
  private timeMs = 0;
  private nextBeatMs = 0;
  private spo2Queue: number[][] = [];
  private audioCtx: AudioContext | null = null;
  private isBeepOnRef?: React.MutableRefObject<boolean>;

  constructor({
    buffers,
    simOptions,
    graph,
    audioCtx,
    isBeepOnRef,
  }: {
    buffers: Record<string, WaveBuffer>;
    simOptions: SimOptions;
    graph: GraphEngine;
    audioCtx?: AudioContext;
    isBeepOnRef?: React.MutableRefObject<boolean>;
  }) {
    this.buffers = buffers;
    this.simOptions = simOptions;
    this.graph = graph;
    this.audioCtx = audioCtx ?? null;
    this.isBeepOnRef = isBeepOnRef;
  }

  public setHr(newHr: number) {
    this.simOptions.hr = newHr;
    this.nextBeatMs = this.timeMs + 60000 / this.simOptions.hr;
  }

  public setAudioContext(ctx: AudioContext) {
    this.audioCtx = ctx;
  }

  public step(deltaMs: number) {
    const { samplingRate } = ECG_CONFIG;
    const samplesPerStep = Math.max(1, Math.floor((samplingRate * deltaMs) / 1000));

    for (let i = 0; i < samplesPerStep; i++) {
      this.timeMs += 1000 / samplingRate;

      const firing = this.graph.tick(this.timeMs);
      const ecg = this.buffers['ecg'];
      const spo2 = this.buffers['spo2'];

      if (firing.includes('SA')) {
        const p = generatePWave(this.simOptions);
        for (const v of p) ecg.push(v);
      }

      if (firing.includes('V')) {
        const qrs = generateQRST(this.simOptions);
        for (const v of qrs) ecg.push(v);

        this.spo2Queue.push(generatePulseWave(this.simOptions));

        if (this.audioCtx && this.isBeepOnRef?.current) {
          playBeep(this.audioCtx, this.simOptions.spo2);
        }
      }

      if (!firing.includes('SA') && !firing.includes('V')) {
        ecg.push(0);
      }

      const spo2Wave = this.spo2Queue[0];
      if (spo2Wave) {
        const val = spo2Wave.shift() ?? 0;
        spo2.push(val);
        if (spo2Wave.length === 0) this.spo2Queue.shift();
      } else {
        spo2.push(0);
      }

      if (this.timeMs >= this.nextBeatMs) {
        this.nextBeatMs = this.timeMs + 60000 / this.simOptions.hr;
      }
    }
  }
}