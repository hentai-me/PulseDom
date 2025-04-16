//src/utils/sound.ts

export const playBeep = (): void => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
  
    oscillator.type = 'square'; // 音のタイプ（squareが"ピッ"っぽい）
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime); // 1kHz
  
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // 音量小さめ
    oscillator.connect(gainNode).connect(ctx.destination);
  
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.05); // 50msだけ再生
  };

  export function calculateFrequency(spo2: number, mode: 'off' | 'on'): number {
    if (mode === 'off') {
      return 1108; // SPO2音OFF時の固定音
    } else if (spo2 >= 86) {
      // 正常領域：半音刻み
      return 440 * Math.pow(2, (spo2 - 91 + 5.5) / 12);
    } else {
      // 異常領域：より細かい音程
      return 440 * Math.pow(2, (spo2 - 91 + 5.5) / 24);
    }
  }