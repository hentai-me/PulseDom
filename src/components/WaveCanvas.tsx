// src/components/WaveCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { PX_SCALE } from '../constants/constants';
import { waveMetaMap } from '../constants/waveMetaMap';

interface WaveCanvasProps {
  bufferRef: React.MutableRefObject<Record<string, { getArray: () => number[]; size: () => number }>>;
  signalKey: string;
  label?: string;
}

const WaveCanvas: React.FC<WaveCanvasProps> = ({ bufferRef, signalKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const meta = waveMetaMap[signalKey];
  const gain = meta?.gain ?? PX_SCALE.pxPerMv;
  const baselineRatio = meta?.baselineRatio ?? 0.66;
  const strokeStyle = meta?.color ?? 'lime';
  const labelText = meta?.label ?? signalKey;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || size.width === 0 || size.height === 0) return;

    const draw = () => {
      const buffer = bufferRef.current[signalKey]?.getArray?.() ?? [];
      const visibleSec = size.width / PX_SCALE.pxPerSec;
      const visibleSamples = Math.floor(visibleSec * 1000 / 5); // STEP_MS = 5ms
      const wave = buffer.slice(-visibleSamples);

      const baseline = size.height * baselineRatio;

      ctx.clearRect(0, 0, size.width, size.height);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let i = 0; i < wave.length; i++) {
        const timeOffsetSec = (wave.length - i) * 5 / 1000; // STEP_MS = 5ms
        const x = size.width - timeOffsetSec * PX_SCALE.pxPerSec;
        const y = baseline - wave[i] * gain;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      ctx.stroke();

      // 1mVスケール
      const scaleX = 10;
      const scaleHeight = gain * 1;  // 1mVスケール
      const scaleTop = baseline - scaleHeight;
      const scaleBottom = baseline;

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scaleX, scaleBottom);
      ctx.lineTo(scaleX, scaleTop);
      ctx.lineTo(scaleX + 10, scaleTop);
      ctx.moveTo(scaleX, scaleBottom);
      ctx.lineTo(scaleX + 10, scaleBottom);
      ctx.stroke();

      // スケールラベル
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.fillText('1 mV', scaleX + 15, scaleTop + 5);

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }, [size, signalKey, gain, baselineRatio, strokeStyle]);

  return (
    <div ref={containerRef} className="w-full h-[100px] sm:h-[120px] md:h-[140px] lg:h-[160px] relative">
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="bg-black rounded-2xl"
      />
      <div className="absolute top-1 left-2 text-xs text-white opacity-80">{labelText}</div>
    </div>
  );
};

export default WaveCanvas;
