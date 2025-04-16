// engine/waveforms/generateWaveforms.ts

import { ECG_CONFIG } from '../../constants';
import { SimOptions } from '../../types/SimOptions';

export function generatePWave(simOptions: SimOptions): number[] {
  const { hr, sinus, waveform } = simOptions;
  const { samplingRate, stepMs: dt } = ECG_CONFIG;

  const duration = hr > 120 ? 0.06 : hr>80 ? 0.07 : 0.08;
  
  const leftOffset = sinus.status === 'LAE' ? duration*0.1 :  duration*0.25 ;

  const stdDev = waveform?.Pwidth ?? 0.012;
  const rightAmp = waveform?.Pheight ?? 0.1;
  const leftAmp = sinus.status === 'LAE' ? -0.18 : sinus.status === 'RAE' ? 0.1 : rightAmp;

  const numSamples = Math.floor(duration * samplingRate);
  const rightCenter = duration / 2;
  const leftCenter = leftOffset + duration / 2;

  const wave: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i * dt / 1000;
    const right = gaussian(rightAmp, t, rightCenter, stdDev/2);
    const left = gaussian(leftAmp, t, leftCenter, stdDev/2);
    const amp = waveform?.mgnfy ?? 1;
    wave.push((right + left) * amp * 0.5);
  }
  return wave;
}

export function generateQRST(simOptions: SimOptions): number[] {
  const { hr, sinus, ventricle, waveform } = simOptions;
  const { samplingRate, stepMs: dt } = ECG_CONFIG;

  const qt_time = hr > 50 ? 0.35 * Math.pow(60 / hr, 0.75) : 0.38;
  const qrsDur = 0.1;

  const q = waveform?.Qdepth ?? -0.1;
  const r = waveform?.Rheight ?? 1.0;
  const s = waveform?.Swidth ?? -0.25;
  const tHeight = waveform?.Theight ?? 0.3;
  const tWidth = waveform?.Twidth ?? 0.16;
  const amp = waveform?.mgnfy ?? 1;
  const baseline = waveform?.baseline ?? 0;

  const mu_q = qrsDur / 8;
  const mu_r = mu_q + qrsDur / 6;
  const mu_s = mu_r + qrsDur / 6;

  const sigma_q = qrsDur / 18;
  const sigma_r = qrsDur / 24;
  const sigma_s = qrsDur / 18;

  const mu_t = qt_time;
  const sigma_t = qt_time / 5;
  const sigma_t_r = qt_time / 8;

  const n = Math.floor((mu_t + 0.4) * samplingRate);
  const waveformArray: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * dt / 1000;

    const qrs = q * Math.exp(-((t - mu_q) ** 2) / (2 * sigma_q ** 2)) +
                r * Math.exp(-((t - mu_r) ** 2) / (2 * sigma_r ** 2)) +
                s * Math.exp(-((t - mu_s) ** 2) / (2 * sigma_s ** 2));

    const st = (t >= mu_r && t <= mu_t) ? 0.02 : 0;

    const twave = t <= mu_t
      ? tHeight * Math.exp(-((t - mu_t) ** 2) / (2 * sigma_t ** 2))
      : tHeight * Math.exp(-((t - mu_t) ** 2) / (2 * sigma_t_r ** 2));

    const y = (qrs + st + twave) * amp + baseline;
    waveformArray.push(Math.round(y * 100) / 100);
  }

  return waveformArray;
}

function gaussian(amplitude: number, t: number, center: number, stdDev: number): number {
  if (t < center - 0.1 || t > center + 0.1) return 0;
  return amplitude * Math.exp(-((t - center) ** 2) / (2 * stdDev ** 2));
}
