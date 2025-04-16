import { generatePWaveFn, generateQRSTFn } from './waveforms/generateWaveFn';
import { generatePulseWaveFn } from './waveforms/generatePulseWaveFn'; // ← 名前ミスってたら修正
import { SimOptions } from './../types/SimOptions';
import { GraphEngine } from './GraphEngine';
import { playBeep } from '../audio/playBeep';

interface LatestValue {
  ecg?: number;
  spo2?: number;
  pulse?: number;
}

export class RhythmEngine {
  private simOptions: SimOptions;
  private graph: GraphEngine;
  private audioCtx: AudioContext | null = null;
  private isBeepOnRef?: React.MutableRefObject<boolean>;
  private latestValueRef: React.MutableRefObject<LatestValue>;
  private pWaveFn: (t: number) => number = () => 0;
  private qrsFn: (t: number) => number = () => 0;
  private pulseFn: (t: number) => number = () => 0;

  constructor({
    simOptions,
    graph,
    audioCtx,
    isBeepOnRef,
    latestValueRef,
  }: {
    simOptions: SimOptions;
    graph: GraphEngine;
    audioCtx?: AudioContext;
    isBeepOnRef?: React.MutableRefObject<boolean>;
    latestValueRef: React.MutableRefObject<LatestValue>;
  }) {
    this.simOptions = simOptions;
    this.graph = graph;
    this.audioCtx = audioCtx ?? null;
    this.isBeepOnRef = isBeepOnRef;
    this.latestValueRef = latestValueRef;
  }

  public setHr(newHr: number) {
    this.simOptions.hr = newHr;
  }

  /** 毎フレーム呼び出し。currentTimeは秒単位 */
  public step(currentTime: number) {
    const firing = this.graph.tick(currentTime * 1000); // ← tick()はms

    const lastFireSA = this.graph.getLastFireTime('SA') / 1000;
    const lastFireV = this.graph.getLastFireTime('V') / 1000;

    this.pWaveFn = generatePWaveFn(this.simOptions);
    this.qrsFn = generateQRSTFn(this.simOptions);
    this.pulseFn = generatePulseWaveFn(this.simOptions);

    const elapsedSA = currentTime - lastFireSA;
    const elapsedV = currentTime - lastFireV;

    const ecg =
      this.pWaveFn(elapsedSA) +
      this.qrsFn(elapsedV);
    console.log('currentTime', currentTime, 'elapsedSA:', elapsedSA, 'elapsedV:', elapsedV, 'ecg:', ecg);

    const pulse = this.pulseFn(elapsedV);

    this.latestValueRef.current.ecg = ecg;
    this.latestValueRef.current.pulse = pulse;
    this.latestValueRef.current.spo2 = 30;

    if (firing.includes('V')) {
      console.log('V fired!');
      if (this.audioCtx && this.isBeepOnRef?.current) {
        playBeep(this.audioCtx, this.simOptions.spo2);
      }
    }
  }
}
