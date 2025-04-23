//src/engine/waveforms/generatePulseWave.ts
//     const pulseWave = generatePulseWave(this.simOptions);

import { SimOptions } from '../../types/SimOptions';

export function generatePulseWaveFn(simOptions: SimOptions): (t: number) => number {
  const { hr, waveform } = simOptions;

  const beatSec = 60 / hr;
  const peakRatio = 0.25;
  const systolicEndRatio = 0.45;

  const peakT = beatSec * peakRatio;
  const systolicEndT = beatSec * systolicEndRatio;
  const decayDuration = beatSec - systolicEndT;
  const tau = decayDuration / 4;

  const a = 1 / (peakT ** 2);
  const systolicEndValue = -a * (systolicEndT - peakT) ** 2 + 1;

  const mgnfy = waveform?.mgnfy ?? 1;
  const baseline = waveform?.baseline ?? 0;

  return function (t: number): number {
    if (t < 0 || t >= beatSec) return 0;

    let value = 0;

    if (t <= systolicEndT) {
      value = -a * (t - peakT) ** 2 + 1;
    } else {
      const x = t - systolicEndT;
      value = systolicEndValue * Math.exp(-x / tau);
    }

    return Math.max(0, value * mgnfy + baseline);
  };
}
