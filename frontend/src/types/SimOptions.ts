//src/types/SimOptions.ts

export type SimOptions = {
    hr: number; // 実効HR（波形合成・次ビート判定に使用）
    spo2: number; // 表示用SpO2（パルス音の周波数などにも応用可）
  
    sinus: {
      rate: number;
      status?: 'normal' | 'Af' | 'AFL' | 'SSS1' | 'SSS2' | 'SSS3' | 'stop' | 'LAE' | 'RAE';
      options?: ('PAC1' | 'PAC3' | 'SSS3')[];
    }      
      
    junction: {
      rate: number;
      status?: 'normal' | 'WB block' | 'M2 block' | 'CAV block' | 'AVNRT' | 'short' | 'WPW';
      options?: ('PAC1' | 'PAC3' | 'SSS3')[];
      conductionRate?: '1:1' | '2:1' | '3:1' | '4:1' | '5:1';
    }      
      
    ventricle: {
      rate: number;
      status?: 'normal' | 'VF' | 'VT';
      ST_change?: 'normal' | 'depression' | 'elevation' | 'T_inversion' | 'T_flat' | 'T_biphasic' | 'T_bifid' | 'T_steep' | 'T_flat2' | 'T_bifid2';
      options?: ('PVC1' | 'PVC2' | 'PVC3' | 'PVC4a' | 'PVC4b' | 'PVC5')[];
    }        
    
    pacing?: {
      mode: 'OFF' | 'AOO' | 'VOO' | 'VVI' | 'DDD';
      lowerRateLimit: number;
      upperRateLimit: number;
      avDelay: number; // ms
    };
    
    waveform?: {
      mgnfy: number; // 全体倍率
      Pheight?: number;
      Pwidth?: number;
      Qdepth?: number;
      Rheight?: number;
      Sdepth?: number;
      Swidth?: number;
      Theight?: number;
      Twidth?: number;
      STheight?: number; // STの高さ
      QRSwidth?: number; // QRSTの全体幅
      baseline?: number; // 基線の高さ};
  };
}