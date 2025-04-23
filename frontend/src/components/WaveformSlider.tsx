// src/components/WaveformSlider.tsx
import React from 'react';

interface WaveformSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  digits?: number;
  onChange: (v: number) => void;
}

const WaveformSlider: React.FC<WaveformSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  digits = 2,
  onChange,
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">
          {Number.isFinite(value) ? value.toFixed(digits) : '-'} {unit}
        </span>
      </div>
      <input
        type="range"
        className="w-full"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};

export default WaveformSlider;
