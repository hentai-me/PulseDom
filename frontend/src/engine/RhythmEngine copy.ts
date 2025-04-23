// src/engine/RhythmEngine.ts
import { generatePWaveFn, generateQRSTFn } from './waveforms/generateECGWave';
import { generatePulseWaveFn } from './waveforms/generatePulseWave';
import { SimOptions } from '../types/SimOptions';
import { GraphEngine } from './GraphEngine';
import { playBeep } from '../audio/playBeep';
import { ECG_CONFIG } from '../constants';
import { WaveBuffer } from './WaveBuffer';
import { extractWaveformParams } from '../utils/extractWaveformParams';
import { createPresetParams } from './waveforms/generateECGWave';


interface WaveformBuffer {
  ecg: WaveBuffer;
  spo2?: WaveBuffer;
  pulse?: WaveBuffer;
}

export class RhythmEngine {
  private simOptions: SimOptions;
  private graph: GraphEngine;
  private audioCtx: AudioContext | null;
  private isBeepOnRef?: React.MutableRefObject<boolean>;
  private bufferRef: React.MutableRefObject<WaveformBuffer>;
  private pWaveFn: (t: number) => number = () => 0;
  private qrsFn: (t: number) => number = () => 0;
  private rvWaveFn: (t: number) => number = () => 0;
  private lvWaveFn: (t: number) => number = () => 0;
  private pulseFn: (t: number) => number = () => 0;
  private lastStepTime = 0;

  constructor({
    simOptions,
    graph,
    audioCtx,
    isBeepOnRef,
    bufferRef,
  }: {
    simOptions: SimOptions;
    graph: GraphEngine;
    audioCtx?: AudioContext;
    isBeepOnRef?: React.MutableRefObject<boolean>;
    bufferRef: React.MutableRefObject<WaveformBuffer>;
  }) {
    this.simOptions = simOptions;
    this.graph = graph;
    this.audioCtx = audioCtx ?? null;
    this.isBeepOnRef = isBeepOnRef;
    this.bufferRef = bufferRef;

  }

  public updateSimOptions(next: SimOptions) {
    this.simOptions = next;
  }
  public setHr(newHr: number) {
    this.simOptions.hr = newHr;
    this.onHrUpdate?.(newHr);       // ← UI用にstateも更新
  }

  public setGraph(graph: GraphEngine) {
    console.log("🔁 [RhythmEngine] Graph updated!");
    this.graph = graph;
  }

  private vFireTimes: number[] = [];
  private onHrUpdate?: (hr: number) => void;

  public setOnHrUpdate(callback: (hr: number) => void) {
    this.onHrUpdate = callback;
  }
  private onSpo2Update?: (spo2: number) => void;

  public setOnSpo2Update(callback: (spo2: number) => void) {
    this.onSpo2Update = callback;
  }

  // 直近のRR間隔から心拍数を計算する（中央値法）
  private calculateHrFromMedian(times: number[]): number {
    if (times.length < 2) return -1;

    const recent = times.slice(-6); // 6発火 → 5間隔
    const intervals = [];

    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i] - recent[i - 1]);
    }

    if (intervals.length === 0) return -1;

    const sorted = intervals.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const hr = Math.round(60000 / median);
    return hr;
  }

  // 直近のRR間隔を計算する（デフォルトは1秒周期）
  private calculateLastRR(times: number[]): number {
    if (times.length < 2) return 1000; // デフォルト1秒周期
    const last = times[times.length - 1];
    const prev = times[times.length - 2];
    return last - prev;
  }

  public step(currentTime: number) {
    while (currentTime - this.lastStepTime >= ECG_CONFIG.stepMs / 1000) {
      this.lastStepTime += ECG_CONFIG.stepMs / 1000;

      const t = this.lastStepTime;
      const firing = this.graph.tick(t * 1000);
      const elapsedSA = t - this.graph.getLastFireTime('A') / 1000;
      const elapsedV = t - this.graph.getLastFireTime('V') / 1000;

      const ecg = this.pWaveFn(elapsedSA) + this.qrsFn(elapsedV);
      const pulse = this.pulseFn(elapsedV);

      //noise生成
      const noise = (Math.random() - 0.5) * 0.02; // ±0.01mVくらいの微細ノイズ
      const rsaOffset = 0.02 * Math.sin(2 * Math.PI * t * 0.2); // 0.2Hz 揺れ（5%振幅）
      const driftFreq = 0.05; // Hz（=20秒周期）
      const driftAmp = 0.05;   // mV（±0.1mV）      
      const driftOffset = driftAmp * Math.sin(2 * Math.PI * driftFreq * this.lastStepTime);

      this.pushBuffer('ecg', ecg + noise + rsaOffset + driftOffset);
      this.pushBuffer('pulse', pulse);
      this.pushBuffer('spo2', 0.3);

      if (firing.includes('A')) {
        const waveformParams = extractWaveformParams(this.simOptions);
        this.pWaveFn = generatePWaveFn(waveformParams);
      }
      this.rvWaveFn = generateQRSTFn(createPresetParams('RV_PVC'));
      this.lvWaveFn = generateQRSTFn(createPresetParams('LV_PVC'));

      const waveformParams = extractWaveformParams(this.simOptions);
      this.qrsFn = generateQRSTFn(waveformParams);
      if (firing.includes('V')) {
        this.pulseFn = generatePulseWaveFn(this.simOptions); // ← これは今のままでOK

        const now = t * 1000;
        this.vFireTimes.push(now);
        const threshold = now - 5000;
        this.vFireTimes = this.vFireTimes.filter(ts => ts >= threshold);

        const spo2 = this.simOptions.spo2 ?? -1;
        if (this.onSpo2Update) this.onSpo2Update(spo2);

        const hr = this.calculateHrFromMedian(this.vFireTimes);
        this.setHr(hr); // ここで simOptions.hr を更新

        const rr = this.calculateLastRR(this.vFireTimes);
        this.simOptions.rr = rr; // ← ここで simOptions.rr に周期（ms）を記録

        if (this.audioCtx && this.isBeepOnRef?.current) {
          playBeep(this.audioCtx, this.simOptions.spo2);
        }
      }
    }
  }

  private pushBuffer(key: keyof WaveformBuffer, val: number) {
    this.bufferRef.current[key]?.push(val);
  }

  public setAudioContext(ctx: AudioContext) {
    this.audioCtx = ctx;
  }
}
