// src/AppFn.tsx
import React, { useEffect, useRef, useState } from 'react';
import ECGCanvas_Oscilloscope from './components/ECGCanvas_Oscilloscope';
import SPO2Canvas from './components/SPO2Canvas';
import { RhythmEngine } from './engine/RhythmEngine_Fn';
import { GraphEngine } from './engine/GraphEngine';
import { unlockAudio } from './audio/unlockAudio';
import VitalDisplay from './components/VitalDisplay';
import { ECG_CONFIG } from './constants';
import { createDefaultSimOptions } from './types/createDefaultSimOptions';
import {
  HR_PARAM,
  SPO2_PARAM,
  NIBP_SYS_PARAM,
  NIBP_DIA_PARAM,
} from './models/VitalParameter';

function App() {
  const [hr, setHr] = useState(60);
  const [spo2, setSpo2] = useState(100);
  const [sysBp, setSysBp] = useState(120);
  const [diaBp, setDiaBp] = useState(70);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isBeepOn, setIsBeepOn] = useState(false);
  const [engine, setEngine] = useState<RhythmEngine | null>(null);

  const simOptionsRef = useRef(createDefaultSimOptions());
  const graphRef = useRef(GraphEngine.createDefaultEngine());
  const isBeepOnRef = useRef(false);
  const latestValueRef = useRef<{ ecg?: number }>({ ecg: 0 });

  const sysBpRef = useRef(sysBp);
  const diaBpRef = useRef(diaBp);

  const handleBeepToggle = () => {
    const next = !isBeepOn;
    if (next && !audioCtx) {
      const ctx = unlockAudio();
      setAudioCtx(ctx);
      engine?.setAudioContext(ctx);
    }
    isBeepOnRef.current = next;
    setIsBeepOn(next);
  };

  useEffect(() => {
    const engine = new RhythmEngine({
      simOptions: simOptionsRef.current,
      graph: graphRef.current,
      audioCtx,
      isBeepOnRef,
      latestValueRef,
    });
    setEngine(engine);
  
    const STEP_MS = ECG_CONFIG.stepMs;
    
    const timerId = setInterval(() => {
      const now = performance.now() / 1000;
      engine.step(now);
    }, STEP_MS);
  
    return () => clearInterval(timerId); // 🔚 Cleanup
  }, []);

  useEffect(() => {
    sysBpRef.current = sysBp;
  }, [sysBp]);

  useEffect(() => {
    diaBpRef.current = diaBp;
  }, [diaBp]);

  const handleHrChange = (v: number) => {
    simOptionsRef.current.hr = v;
    setHr(v);
  };

  const handleSpo2Change = (v: number) => {
    simOptionsRef.current.spo2 = v;
    setSpo2(v);
  };

  const handleSysBpChange = (newSys: number) => {
    if (newSys === sysBp) return;
    setSysBp(newSys);
    let next = Math.round(Math.min(diaBpRef.current + (newSys - sysBp) / 2, newSys * 0.8));
    if (next < 20) next = 20;
    setDiaBp(next);
  };

  const handleDiaBpChange = (newDia: number) => {
    let next = Math.min(sysBp, newDia);
    setDiaBp(next);
  };

  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-screen-xl mx-auto grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="col-span-2 md:col-span-4 lg:col-span-6 text-left text-white text-lg font-semibold mb-1">
          PULSEDOM SIMULATOR BETA
          <div className="text-right mb-2">
            <button
              className={`px-4 py-1 rounded ${isBeepOn ? 'bg-red-600' : 'bg-gray-700'} hover:bg-green-600 text-white`}
              onClick={handleBeepToggle}
            >
              {isBeepOn ? '同期音 停止' : '同期音 開始'}
            </button>
          </div>
        </div>
        <div className="col-span-2 md:col-span-4 lg:col-span-4 order-1 lg:order-1">
          <p className="text-red-500">
            {engine ? '✔ ECGCanvas マウントするよ！' : '❌ engine = null'}
          </p>
          <ECGCanvas_Oscilloscope latestValueRef={latestValueRef} />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1 order-3 lg:order-2">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-green-500 text-lg">HR</span>
          </div>
          <VitalDisplay param={HR_PARAM} value={hr} setValue={handleHrChange} />
        </div>
        <div className="col-span-2 md:col-span-4 lg:col-span-4 order-2 lg:order-3">
          <SPO2Canvas hr={hr} bufferRef={{ current: { getArray: () => [] } }} />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1 order-4 lg:order-4">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-cyan-400 text-lg">SpO₂</span>
          </div>
          <VitalDisplay param={SPO2_PARAM} value={spo2} setValue={handleSpo2Change} />
        </div>
        <div className="hidden md:block col-span-2 md:col-span-4 lg:col-span-4 order-5 lg:order-5 text-sm text-left opacity-60">
          ART
        </div>
        <div className="col-span-2 order-6 md:order-4 md:col-span-2 lg:col-span-2 lg:order-6">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-orange-500 text-lg">NIBP</span>
          </div>
          <div className="flex items-baseline space-x-2 w-full justify-between bg-black rounded-2xl">
            <VitalDisplay param={NIBP_SYS_PARAM} value={sysBp} setValue={handleSysBpChange} />
            <span className="text-orange-600 text-4xl font-bold">/</span>
            <VitalDisplay param={NIBP_DIA_PARAM} value={diaBp} setValue={handleDiaBpChange} />
            <div className="hidden md:block text-orange-600 text-xl font-mono font-bold text-right">
              ({Math.round(sysBp / 3 + (diaBp * 2) / 3)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
