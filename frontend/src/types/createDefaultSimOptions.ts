import { SimOptions } from './SimOptions';

export function createDefaultSimOptions(): SimOptions {
  return {
    hr: 80,
    rr: 750, // 直前の1拍周期（ms）

    spo2: 98,

    sinus: {
      rate: 80,
      status: 'normal',
      options: [],
    },

    junction: {
      rate: 40,
      status: 'normal',
      options: [],
      conductionRate: '1:1',
    },

    ventricle: {
      rate: 30,
      status: 'normal',
      ST_change: 'normal',
      options: [],
    },

    pacing: {
      mode: 'OFF',
      lowerRateLimit: 50,
      upperRateLimit: 120,
      avDelay: 120,
    },

    waveform: {
      mgnfy: 0.9,
      baseline: 0.0,

      // amplitude
      Pvoltage: 0.12,
      Qvoltage: -0.2,
      Rvoltage: 1.0,
      Svoltage: -0.2,
      Tvoltage: 0.3,
      STheight: 0.0,

      // duration
      Pduration: 0.1,
      QRSduration: 0.12,
      Tduration: 0.15,
    },
  };
}
export default createDefaultSimOptions;