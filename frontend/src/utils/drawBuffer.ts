function drawBuffer(
    ctx: CanvasRenderingContext2D,
    buffer: number[] | undefined,
    canvasWidth: number,
    canvasHeight: number,
    lastX: number,
    currentX: number,
    stepMs: number,
    elapsedMs: number,
    color: string = 'lime',
    pixelsPerSec: number
  ) {
    if (!buffer || buffer.length < 2) return;
  
    const n = buffer.length;
    const baselineY = canvasHeight * 2 / 3;
    const gain = canvasHeight * 0.4;
  
    const elapsedPx = (currentX - lastX + canvasWidth) % canvasWidth;
    const pixelPerStep = elapsedPx / (n - 1);
    console.log(`stepMs: ${stepMs}, pixelPerStep: ${pixelPerStep}, canvasWidth: ${canvasWidth}, n=${n}`);
  
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
  
    let prevX: number | null = null;
    let prevY: number | null = null;
  
    for (let i = 0; i < n; i++) {
      const x = (lastX + i * pixelPerStep) % canvasWidth;
      const y = baselineY - buffer[i] * gain;
  
      const clearX = Math.floor(x);
      ctx.clearRect(clearX, 0, 1, canvasHeight);
  
      if (prevX !== null && prevY !== null) {
        if ((x < prevX && prevX - x > 10) || x === prevX) {
          // wrap-aroundや重なり時は描画スキップ
          prevX = x;
          prevY = y;
          continue;
        }
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
      }
  
      prevX = x;
      prevY = y;
    }
  
    ctx.stroke();
  }
  
  export default drawBuffer;
  