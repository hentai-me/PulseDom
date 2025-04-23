//src/engine/waveforms/generateECGWave.ts

export type WaveformParams = {
  preset?: 'LV_PVC' | 'RV_PVC' | 'normal';
  mgnfy: number;
  baseline: number;
  Pvoltage: number;
  Pduration: number;
  PleftOffset: number;
  Qvoltage: number;
  Rvoltage: number;
  Svoltage: number;
  QRSduration: number;
  STheight: number;
  Tvoltage: number;
  Tduration: number;
  QTinterval: number;
  hr: number;
  rr: number; // 直前の1拍周期（ms）
};

export function createPresetParams(preset: 'LV_PVC' | 'RV_PVC'): WaveformParams {
  const base = {
    mgnfy: 1.0,
    baseline: 0.0,
    Pvoltage: 0.0,
    Pduration: 0.0,
    PleftOffset: 0.0,
    Qvoltage: -0.1,
    STheight: 0.0,
    Tvoltage: 0.3,
    Tduration: 0.16,
    QTinterval: 0.42,
    hr: 80,
    rr: 750,
  };

  switch (preset) {
    case 'LV_PVC':
      return {
        ...base,
        preset: 'LV_PVC',
        Qvoltage: 0,
        Rvoltage: -0.9,
        Svoltage: -0.05,
        Tvoltage: 1.1,
        QRSduration: 0.35,
        Tduration: 0.15,
      };
    case 'RV_PVC':
      return {
        ...base,
        preset: 'RV_PVC',
        Qvoltage: 0,
        Rvoltage: 1.3,
        Svoltage: -0.05,
        Tvoltage: -0.3,
        QRSduration: 0.21,
        STheight: -0.05,
        Tduration: 0.23,
      };
  }
}

export function generatePWaveFn(params: WaveformParams): (t: number) => number {
  const { Pduration, Pvoltage, PleftOffset, mgnfy } = params;

  const stdDev = Pduration / 6;
  const rightAmp = Pvoltage;
  const leftAmp = Pvoltage;

  const rightCenter = Pduration / 3;
  const leftCenter = PleftOffset + Pduration / 3;

  return (t: number): number => {
    if (t < 0 || t > Pduration) return 0;
    const right = gaussian(rightAmp, t, rightCenter, stdDev / 2);
    const left = gaussian(leftAmp, t, leftCenter, stdDev / 2);
    return (right + left) * mgnfy * 0.5;
  };
}

export function generateQRSTFn(params: WaveformParams): (t: number) => number {
  const {
    Qvoltage, Rvoltage, Svoltage, QRSduration,
    Tvoltage, Tduration, STheight,
    mgnfy, baseline, rr
  } = params;

  const qtc = 0.4; // s, 固定ベースQTcとする  
  const QTtime = qtc * Math.cbrt(rr / 1000);// ← RR依存QT

  const mu_q = QRSduration * 0.20;
  const mu_r = QRSduration * 0.40;
  const mu_s = QRSduration * 0.65;
  const sigma_q = QRSduration / 20;
  const sigma_r = QRSduration / 16;
  const sigma_s = QRSduration / 16;

  const mu_t = QTtime - Tduration / 2;

  return function (t: number): number {
    if (t < 0 || t > mu_t + 0.4) return 0;

    const qrs =
      Qvoltage * Math.exp(-((t - mu_q) ** 2) / (2 * sigma_q ** 2)) +
      Rvoltage * Math.exp(-((t - mu_r) ** 2) / (2 * sigma_r ** 2)) +
      Svoltage * Math.exp(-((t - mu_s) ** 2) / (2 * sigma_s ** 2));

    const stSegment = t >= mu_r && t <= mu_t ? STheight : 0;
    const sigma_t_left = Tduration / 3;
    const sigma_t_right = Tduration / 5;

    const tWave = t <= mu_t
      ? Math.exp(-((t - mu_t) ** 2) / (2 * sigma_t_left ** 2))
      : Math.exp(-((t - mu_t) ** 2) / (2 * sigma_t_right ** 2));

    return (qrs + stSegment + Tvoltage * tWave) * mgnfy + baseline;
  };
}

function gaussian(amplitude: number, t: number, center: number, stdDev: number): number {
  return amplitude * Math.exp(-((t - center) ** 2) / (2 * stdDev ** 2));
}
