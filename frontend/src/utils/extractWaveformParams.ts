export function extractWaveformParams(sim: SimOptions): WaveformParams {
  const { hr, rr, sinus, waveform = {} as NonNullable<SimOptions['waveform']> } = sim;
  
  return {
    mgnfy: waveform.mgnfy ?? 1.0,
    baseline: waveform.baseline ?? 0.0,
    Pvoltage: waveform.Pvoltage ?? 0.1,
    Pduration: waveform.Pduration ?? (hr > 120 ? 0.06 : hr > 80 ? 0.07 : 0.08),
    PleftOffset: sinus.status === 'LAE'
      ? ((waveform.Pduration ?? 0.08) * 0.1)
      : ((waveform.Pduration ?? 0.08) * 0.25),
    Qvoltage: waveform.Qvoltage ?? -0.1,
    Rvoltage: waveform.Rvoltage ?? 1.0,
    Svoltage: waveform.Svoltage ?? -0.25,
    QRSduration: waveform.QRSduration ?? 0.1,
    STheight: waveform.STheight ?? 0.0,
    Tvoltage: waveform.Tvoltage ?? 0.3,
    Tduration: waveform.Tduration ?? 0.16,
    hr: hr ?? 80, // ← ✅ これを追加！！
    rr: rr ?? 750, // ← 直前の1拍周期（ms）を追加！！
  };
}
