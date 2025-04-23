// src/AppFn.tsx
import React, { useEffect, useRef, useState } from 'react';
import ECGCanvas from './components/ECGCanvas';
//import ECGCanvas_Oscilloscope from './components/ECGCanvas_Oscilloscope';
import SPO2Canvas from './components/SPO2Canvas';
import { RhythmEngine } from './engine/RhythmEngine';
import { GraphEngine } from './engine/GraphEngine';
import { unlockAudio } from './audio/unlockAudio';
import VitalDisplay from './components/VitalDisplay';
import { ECG_CONFIG } from './constants';
import { createDefaultSimOptions } from './types/createDefaultSimOptions';
import { WaveBuffer } from './engine/WaveBuffer';
import { AccordionUIMock } from '@/components/AccordionUIMock';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SimOptions } from './types/SimOptions';
import {
  HR_PARAM,
  SPO2_PARAM,
  NIBP_SYS_PARAM,
  NIBP_DIA_PARAM,
} from './models/VitalParameter';

function App() {
  const [simOptionsState, setSimOptionsState] = useState(createDefaultSimOptions());
  const [hr, setHr] = useState(-1);
  const [spo2, setSpo2] = useState(-1);
  const [sysBp, setSysBp] = useState(120);
  const [diaBp, setDiaBp] = useState(80);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isBeepOn, setIsBeepOn] = useState(false);
  const [isEditorVisible, setEditorVisible] = useState(true);

  const simOptionsRef = useRef(simOptionsState);
  const graphRef = useRef(GraphEngine.createDefaultEngine());
  const isBeepOnRef = useRef(false);
  const bufferRef = useRef({
    ecg: new WaveBuffer({ size: 2000 }),
    spo2: new WaveBuffer({ size: 2000 }),
    pulse: new WaveBuffer({ size: 2000 }),
  });

  const sysBpRef = useRef(sysBp);
  const diaBpRef = useRef(diaBp);
  const [engine, setEngine] = useState<RhythmEngine | null>(null);

  useEffect(() => {
    const rhythmEngine = new RhythmEngine({
      simOptions: simOptionsRef.current,
      graph: graphRef.current,
      audioCtx,
      isBeepOnRef,
      bufferRef,
    });
    setEngine(rhythmEngine);

    rhythmEngine.setOnHrUpdate(setHr); // ← ★ココでちゃんとバインド
    rhythmEngine.setOnSpo2Update(setSpo2); // ← これ！

    let animationId: number;
    const loop = (now: number) => {
      rhythmEngine.step(now / 1000);
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleSimOptionsChange = (next: SimOptions) => {
    simOptionsRef.current = next;
    setSimOptionsState({ ...next });
    graphRef.current.updateRatesFromSim(next); // こっちも必要
    engine?.updateSimOptions(next); // ← ここ！！！★
    // 🔥 Sinus停止ボタンからの伝導遮断処理
    if (next.sinus.status === 'stop') {
      graphRef.current.setNodeAutofire('SA', false);
    } else {
      graphRef.current.setNodeAutofire('SA', true);
    }
  };

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
    sysBpRef.current = sysBp;
  }, [sysBp]);

  useEffect(() => {
    diaBpRef.current = diaBp;
  }, [diaBp]);

  return (
    <div className="relative min-h-screen bg-gray-50">
      <button
        onClick={() => setEditorVisible(!isEditorVisible)}
        className={`fixed top-4 z-50 bg-white border border-zinc-400 px-2 py-1 rounded-l transition-all duration-300 ${isEditorVisible ? 'right-[250px]' : 'right-0'}`}
      >
        {isEditorVisible ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="flex min-h-screen">
        <div className="flex-1 bg-gray-900 text-white p-4">
          <div className="max-w-screen-xl mx-auto grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="col-span-2 md:col-span-4 lg:col-span-6 text-left text-white text-lg font-semibold mb-1">
              PULSEDOM SIMULATOR BETA
            </div>
            <div className="col-span-2 md:col-span-4 lg:col-span-4 order-1 lg:order-1">
              <ECGCanvas bufferRef={bufferRef} />
            </div>
            <div className="col-span-1 md:col-span-1 lg:col-span-1 order-3 lg:order-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-green-500 text-lg">HR</span>
              </div>
              <VitalDisplay param={HR_PARAM} value={hr < 0 ? '--' : hr} setValue={setHr} />
            </div>
            <div className="col-span-2 md:col-span-4 lg:col-span-4 order-2 lg:order-3">
              <SPO2Canvas bufferRef={bufferRef} />
            </div>
            <div className="col-span-1 md:col-span-1 lg:col-span-1 order-4 lg:order-4">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-cyan-400 text-lg">SpO₂</span>
              </div>
              <VitalDisplay param={SPO2_PARAM} value={spo2 < 0 ? '--' : spo2} setValue={setSpo2} />
            </div>
            <div className="hidden md:block col-span-2 md:col-span-4 lg:col-span-4 order-5 lg:order-5 text-sm text-left opacity-60">
              ART
            </div>
            <div className="col-span-2 order-6 md:order-4 md:col-span-2 lg:col-span-2 lg:order-6">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-orange-500 text-lg">NIBP</span>
              </div>
              <div className="flex items-baseline space-x-2 w-full bg-black rounded-2xl">
                <VitalDisplay param={NIBP_SYS_PARAM} value={sysBp < 0 ? '--' : sysBp} setValue={setSysBp} />
                <span className="text-orange-600 text-4xl font-bold">/</span>
                <VitalDisplay param={NIBP_DIA_PARAM} value={diaBp < 0 ? '--' : diaBp} setValue={setDiaBp} />
                <div className="hidden md:block text-orange-600 text-xl font-mono font-bold text-right">
                  ({Math.round(sysBp / 3 + (diaBp * 2) / 3)})
                </div>
              </div>
            </div>
          </div>
        </div>

        {isEditorVisible && (
          <div className="md:relative w-[250px] h-full max-h-screen overflow-y-auto bg-white text-black border-l border-zinc-300 p-4 transition-all duration-300">
            <AccordionUIMock
              simOptions={simOptionsState}
              onSimOptionsChange={handleSimOptionsChange}
              isBeepOn={isBeepOn}
              onToggleBeep={handleBeepToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
