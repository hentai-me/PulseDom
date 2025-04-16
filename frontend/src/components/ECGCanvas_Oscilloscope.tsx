// src/components/ECGCanvas_Oscilloscope.tsx
import React, { useEffect, useRef } from 'react';
import { ECG_CONFIG } from '../constants';

interface Props {
  latestValueRef: React.MutableRefObject<{ ecg?: number }>;
}

const ECGCanvas_Oscilloscope: React.FC<Props> = ({ latestValueRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(performance.now());
  const prevXRef = useRef<number | null>(null);
  const prevYRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('[ECGCanvas] useEffect called');
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const baseline = height * 2 / 3;
    const gain = height * 0.4;
    const pxPerSec = 200; // ← 時間基準の描画速度 (200px/sec)

    const draw = () => {
      const now = performance.now();
      const elapsedSec = (now - startTimeRef.current) / 1000;
      const x = Math.floor(elapsedSec * pxPerSec) % width;
      const val = latestValueRef.current.ecg ?? 0;
      const y = baseline - val * gain;

      // 消すライン
      ctx.clearRect(x, 0, 1, height);

      // 線を描く
      ctx.beginPath();
      ctx.strokeStyle = 'lime';
      if (prevXRef.current !== null && prevYRef.current !== null) {
        ctx.moveTo(prevXRef.current, prevYRef.current);
        ctx.lineTo(x, y);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      prevXRef.current = x;
      prevYRef.current = y;

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }, [latestValueRef]);

  return (
    <div ref={containerRef} className="bg-red-500 text-white p-2">
      <p>ここにいます！（Canvasデバッグ中）</p>
      <canvas ref={canvasRef} className="bg-black w-full h-[100px]" />
    </div>
  );
};

export default ECGCanvas_Oscilloscope;
