export function calcFrequency(spo2: number | undefined): number {
  if (spo2 === undefined) return 1108;

  const offset = spo2 - 91 + 5.5;
// 負のべき乗を防ぐ（下限をつける）
  const safeOffset = Math.max(offset, -12); // 例: 下限を -12 に制限

  if (spo2 >= 86) {
    return 440 * Math.pow(2, Math.pow(safeOffset, 1 / 12));
  } else {
    return 440 * Math.pow(2, Math.pow(safeOffset, 1 / 24));
  }
}

export function playBeep(audioCtx: AudioContext, spo2?: number) {
  const freq = calcFrequency(spo2);
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  console.log("🔊 playBeep:", { freq, spo2 });
  
  if (!isFinite(freq)) return;

  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.value = 0.05;

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}