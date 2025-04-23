// src/components/ECGCanvas_Debug.tsx
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
        console.log(`📐 ResizeObserver: width=${width}, height=${height}`);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || size.width === 0 || size.height === 0) {
      console.warn('🚫 draw skipped: missing ctx or size 0');
      return;
    }

    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || size.width === 0 || size.height === 0) return;

      const buffer = bufferRef.current.ecg.getArray();
      const wave = buffer.slice(-size.width);
      const baseline = size.height * 2 / 3;
      const gain = PX_SCALE.pxPerMv; // ← 1mV = 40px の固定スケーリング

      ctx.clearRect(0, 0, size.width, size.height);
      ctx.beginPath();
      ctx.strokeStyle = 'lime';

      const len = wave.length;
      for (let i = 0; i < len; i++) {
        const x = size.width - len + i; // 右端を現在時刻として描画
        const y = baseline - wave[i] * gain;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    console.log('🧩 Canvas mounted');
  }, [size]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[100px] sm:h-[120px] md:h-[140px] lg:h-[160px]"
    >
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
