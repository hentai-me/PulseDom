// src/constants.ts

// リアルタイム波形評価のステップ間隔（ms単位）
export const STEP_MS = 5;

// Canvas描画フレーム間に必要な補完点数＋α
// → 60fps (16.6ms) の半分 ≒ 8.3ms を安全にカバー
export const LATEST_BUFFER_SIZE = 200;

// 1秒あたりのピクセル数（Canvas描画用）
export const SCALE = {
  mmPerSec: 25,     // 横：25mm/s
  mmPerMv: 10,      // 縦：1mV = 10mm
  pxPerMm: 8,       // 1mmあたり4px（=10mm→40px）
};

// Canvas描画用の基本定数群
export const PX_SCALE = {
  pxPerSec: SCALE.mmPerSec * SCALE.pxPerMm,   // 25mm/s * 4px/mm = 100px/s
  pxPerMv: SCALE.mmPerMv * SCALE.pxPerMm,     // 10mm/mV * 4px/mm = 40px/mV
};

// ECGシミュレーション用の基本定数群
export const ECG_CONFIG = {
  samplingRate: 1000, // not used yet, but useful if we synthesize wave buffers later
  stepMs: STEP_MS,
};
