// src/components/ECGCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { PX_SCALE } from '../constants';

interface ECGCanvasProps {
  bufferRef: React.MutableRefObject<{ getArray: () => number[]; size: () => number }>;
}

const ECGCanvas_Debug: React.FC<ECGCanvasProps> = ({ bufferRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const buffer = bufferRef.current.ecg.getArray();
      const visibleSec = size.width / PX_SCALE.pxPerSec;
      const visibleSamples = Math.floor(visibleSec * 1000 / 5); // STEP_MS = 5ms
      const wave = buffer.slice(-visibleSamples);

      const baseline = size.height * 2 / 3;
      const gain = PX_SCALE.pxPerMv;

      ctx.clearRect(0, 0, size.width, size.height);
      ctx.beginPath();
      ctx.strokeStyle = 'lime';

      for (let i = 0; i < wave.length; i++) {
        const timeOffsetSec = (wave.length - i) * 5 / 1000; // STEP_MS = 5
        const x = size.width - timeOffsetSec * PX_SCALE.pxPerSec;
        const y = baseline - wave[i] * gain;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      ctx.stroke();
      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }, [size]);

  return (
    <div ref={containerRef} className="w-full h-[100px] sm:h-[120px] md:h-[140px] lg:h-[160px]">
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="bg-black rounded-2xl"
      />
    </div>
  );
};

export default ECGCanvas_Debug;
