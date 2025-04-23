// src/models/VitalParameter.ts

export interface AlarmLimits {
    warnLow: number;
    warnHigh: number;
    critLow: number;
    critHigh: number;
  }
  
  export class VitalParameter {
    label: string;
    unit: string;
    min: number;
    max: number;
    decimals: number;
    sensitivity: number; 
    alarm: AlarmLimits;
    color: string = 'text-white'; // デフォルト色（必要に応じて拡張）
  
    constructor({
        label,
        unit,
        min,
        max,
        decimals = 0,
        sensitivity = 1,  // ← ★コレ！！
        alarm,
        color,
    }: {
        label: string;
        unit: string;
        min: number;
        max: number;
        decimals?: number;
        sensitivity?: number; // ← ★コレ！！
        alarm: AlarmLimits;
        color?: string;
    }) {
        this.label = label;
        this.unit = unit;
        this.min = min;
        this.max = max;
        this.decimals = decimals;
        this.sensitivity = sensitivity; // ← ★コレ！！
        this.alarm = alarm;
        this.color = color || 'text-white'; // デフォルト色
    }
  
    clamp(value: number): number {
      return Math.min(this.max, Math.max(this.min, value));
    }
  
    format(value: unknown): string {
      if (typeof value !== 'number' || !isFinite(value) || value < 0) {
        return '--'; // 未決定や不正値は "--" にする（明示的）
      }
      return value.toFixed(this.decimals);
    }
  
    getStatus(value: number): 'normal' | 'warn' | 'critical' {
      if (value <= this.alarm.critLow || value >= this.alarm.critHigh) return 'critical';
      if (value <= this.alarm.warnLow || value >= this.alarm.warnHigh) return 'warn';
      return 'normal';
    }

    isCritical(value: number): boolean {
        return value <= this.alarm.critLow || value >= this.alarm.critHigh;
    }
    isWarning(value: number): boolean {
    return (
        (value <= this.alarm.warnLow && value > this.alarm.critLow) ||
        (value >= this.alarm.warnHigh && value < this.alarm.critHigh)
    );
    }

    getColor(): string {
    return 'text-white'; // デフォルト色（必要に応じて拡張）
    }

  }
  
  export const HR_PARAM = new VitalParameter({
    label: 'HR',
    unit: '',
    min: 5,
    max: 250,
    decimals: 0,
    sensitivity: 2, // 👈
    color: 'text-green-500',

    alarm: {
      warnLow: 50,
      warnHigh: 120,
      critLow: 30,
      critHigh: 180,
    },
  });
  
  export const SPO2_PARAM = new VitalParameter({
    label: 'SpO2',
    unit: '',
    min: 0,
    max: 100,
    decimals: 0,
    sensitivity: 10, // 👈
    color: 'text-cyan-400',

    alarm: {
      warnLow: 89,
      warnHigh: 110,
      critLow: 79,
      critHigh: 120,
    },
  });
  export const NIBP_SYS_PARAM = new VitalParameter({
    label: 'NIBP_SYS',
    unit: '',
    min: 30,
    max: 250,
    decimals: 0,
    sensitivity: 5,
    alarm: {
      warnLow: 80,
      warnHigh: 140,
      critLow: 60,
      critHigh: 180,
    },
    color: 'text-orange-600', // ← ★これ追加（型にないので要拡張）
  });

  export const NIBP_DIA_PARAM = new VitalParameter({
    label: 'NIBP_DIA',
    unit: '',
    min: 20,
    max: 250,
    decimals: 0,
    sensitivity: 5,
    alarm: {
      warnLow: 40,
      warnHigh: 250,
      critLow: 20,
      critHigh: 250,
    },
    color: 'text-orange-600', // ← ★これ追加（型にないので要拡張）
  });
  
