// src/engine/WaveBuffer.ts

export class WaveBuffer {
  private buffer: number[];
  private writeIndex: number = 0;

  constructor({ size }: { size: number }) {
    this.buffer = new Array(size).fill(0);
  }

  push(val: number) {
    this.buffer[this.writeIndex] = val;
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
  }

  getArray(): number[] {
    return this.buffer.slice(this.writeIndex).concat(this.buffer.slice(0, this.writeIndex));
  }

  getWriteIndex(): number {
    return this.writeIndex;
  }

  getBuffer(): number[] {
    return this.buffer;
  }
} 
