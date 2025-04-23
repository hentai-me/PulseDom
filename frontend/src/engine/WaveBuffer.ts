// src/engine/WaveBuffer.ts
export class WaveBuffer {
    private buffer: number[];
    private sizeLimit: number;
  
    constructor({ size = 2000 }: { size: number }) {
      this.buffer = [];
      this.sizeLimit = size;
    }
  
    push(val: number) {
      this.buffer.push(val);
      if (this.buffer.length > this.sizeLimit) {
        this.buffer.shift();
      }
    }
  
    getArray() {
      return this.buffer;
    }
  
    size() {
      return this.buffer.length;
    }
  }
  