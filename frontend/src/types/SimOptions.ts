export type SimOptions = {
  hr: number;       // 現在の心拍数（bpm）
  rr: number;       // 直前の1拍周期（ms）←★追加！
  
  spo2: number;

  sinus: {
    rate: number;
    status?: 'normal' | 'Af' | 'AFL' | 'SSS1' | 'SSS2' | 'SSS3' | 'stop' | 'LAE' | 'RAE';
    options?: ('PAC1' | 'PAC3' | 'SSS3')[];
  };

  junction: {
    rate: number;
    status?: 'normal' | 'WB block' | 'M2 block' | 'CAV block' | 'AVNRT' | 'short' | 'WPW';
    options?: ('PAC1' | 'PAC3' | 'SSS3')[];
    conductionRate?: '1:1' | '2:1' | '3:1' | '4:1' | '5:1';
  };

  ventricle: {
    rate: number;
    status?: 'normal' | 'VF' | 'VT';
    ST_change?: 'normal' | 'depression' | 'elevation' | 'T_inversion' | 'T_flat' | 'T_biphasic' | 'T_bifid' | 'T_steep' | 'T_flat2' | 'T_bifid2';
    options?: ('PVC1' | 'PVC2' | 'PVC3' | 'PVC4a' | 'PVC4b' | 'PVC5')[];
  };

  pacing?: {
    mode: 'OFF' | 'AOO' | 'VOO' | 'VVI' | 'DDD';
    lowerRateLimit: number;
    upperRateLimit: number;
    avDelay: number;
  };

  waveform?: {
    mgnfy: number;
    baseline?: number;

    // 電圧 (Amplitude)
    Pvoltage?: number;
    Qvoltage?: number;
    Rvoltage?: number;
    Svoltage?: number;
    Tvoltage?: number;
    STheight?: number;

    // 時間 (Duration)
    Pduration?: number;     // ms or sec
    QRSduration?: number;
    Tduration?: number;
  };
};
