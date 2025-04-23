import { SimOptions } from "../types/SimOptions";
import WaveformSlider from "@/components/WaveformSlider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AccordionUIMockProps {
  simOptions: SimOptions;
  onSimOptionsChange: (next: SimOptions) => void;
  isBeepOn: boolean;
  onToggleBeep: () => void;
}

export function AccordionUIMock({
  simOptions,
  onSimOptionsChange,
  isBeepOn,
  onToggleBeep,
}: AccordionUIMockProps) {
  const updateRate = (section: keyof SimOptions, value: number) => {
    const updated = {
      ...simOptions,
      [section]: { ...simOptions[section], rate: value },
    };
    onSimOptionsChange(updated);
  };

  const updateWaveform = (
    key: keyof NonNullable<SimOptions['waveform']>,
    value: number
  ) => {
    const updated = {
      ...simOptions,
      waveform: { ...simOptions.waveform, [key]: value },
    };
    onSimOptionsChange(updated);
  };

  const waveformParams = [
    //    { key: 'Pvoltage', label: 'P wave voltage', min: -0.3, max: 0.3, step: 0.01, unit: 'mV' },
        { key: 'mgnfy', label: 'Scale ', min: 0.1, max: 2, step: 0.05, unit: '' },
    //    { key: 'Pduration', label: 'P duration', min: 0.02, max: 0.12, step: 0.01, unit: 's' },
    { key: 'Qvoltage', label: 'Q wave voltage', min: -1.5, max: 1.5, step: 0.05, unit: 'mV' },
    { key: 'Rvoltage', label: 'R wave voltage', min: -1.5, max: 1.5, step: 0.05, unit: 'mV' },
    { key: 'Svoltage', label: 'S wave voltage', min: -1.5, max: 1.5, step: 0.05, unit: 'mV' },
    { key: 'QRSduration', label: 'QRS duration', min: 0.04, max: 0.4, step: 0.01, unit: 's' },
    { key: 'Tvoltage', label: 'T wave voltage', min: -1.5, max: 1.5, step: 0.05, unit: 'mV' },
    //    { key: 'Tduration', label: 'T duration', min: 0.08, max: 0.3, step: 0.01, unit: 's' },
    { key: 'STheight', label: 'ST height', min: -0.5, max: 0.5, step: 0.05, unit: 'mV' },
  ];

  return (
    <div className="space-y-2">
      {/* 🎛️ 上部固定ボタン群 */}
      <div className="flex justify-between items-center gap-2 px-1">
        <button
          className={`text-xs font-medium tracking-wide px-3 py-1 rounded border border-zinc-400 transition ${isBeepOn ? 'bg-zinc-300 text-green-700' : 'hover:bg-zinc-200'
            }`}
          onClick={onToggleBeep}
        >
          {isBeepOn ? '🔔 SYNC BEEP ON' : '🔕 SYNC BEEP'}
        </button>
      </div>

      {/* 🫁 SpO2 スライダー */}
      <WaveformSlider
        label="SpO₂ (%)"
        value={simOptions.spo2}
        min={50}
        max={100}
        step={1}
        digits={0}
        unit="%"
        onChange={(v) =>
          onSimOptionsChange({ ...simOptions, spo2: v })
        }
      />

      {/* 📦 アコーディオン各種 */}
      <Accordion type="multiple" className="w-full space-y-2">
        <AccordionItem value="sinus">
          <AccordionTrigger>Sinus Node</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <WaveformSlider
              label="Sinus Rate (bpm)"
              value={simOptions.sinus.rate}
              min={0}
              max={200}
              step={1}
              digits={0}
              unit="bpm"
              onChange={(v) => updateRate('sinus', v)}
            />

            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded border text-xs ${simOptions.sinus.status === 'normal'
                  ? 'bg-zinc-300 text-black'
                  : 'bg-white border-zinc-400'
                  }`}
                onClick={() =>
                  onSimOptionsChange({
                    ...simOptions,
                    sinus: { ...simOptions.sinus, status: 'normal' },
                  })
                }
              >
                Normal
              </button>
              <button
                className={`px-3 py-1 rounded border text-xs ${simOptions.sinus.status === 'stop'
                  ? 'bg-red-500 text-white'
                  : 'bg-white border-zinc-400'
                  }`}
                onClick={() =>
                  onSimOptionsChange({
                    ...simOptions,
                    sinus: { ...simOptions.sinus, status: 'stop' },
                  })
                }
              >
                Stop
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="junction">
          <AccordionTrigger>Junction Node</AccordionTrigger>
          <AccordionContent className="space-y-1">
            <WaveformSlider
              label="Junction Rate (bpm)"
              value={simOptions.junction.rate}
              min={0}
              max={200}
              step={1}
              digits={0}
              unit="bpm"
              onChange={(v) => updateRate('junction', v)}
            />
            {/* 🔻 AV Block Type Dropdown */}
            {/* 👇 ラベルとセレクトを横並び */}
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap">AV conduction</label>
              <select
                value={simOptions.junction?.blockType ?? 'normal'}
                onChange={(e) =>
                  onSimOptionsChange({
                    ...simOptions,
                    junction: {
                      ...simOptions.junction,
                      blockType: e.target.value,
                    },
                  })
                }
                className="text-xs px-2 py-1 border border-zinc-400 rounded w-fit"
              >
                <option value="normal">Normal</option>
                <option value="idblock">Id block</option>
                <option value="m2block">M2 Block</option>
                <option value="wbblock">WB Block</option>
                <option value="cavb">CAVB</option>
              </select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ventricle">
          <AccordionTrigger>Ventricle Node</AccordionTrigger>
          <AccordionContent className="space-y-1">
            <WaveformSlider
              label="Ventricle Rate (bpm)"
              value={simOptions.ventricle.rate}
              min={0}
              max={200}
              step={1}
              digits={0}
              unit="bpm"
              onChange={(v) => updateRate('ventricle', v)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="waveform">
          <AccordionTrigger>📉 Waveform Parameters</AccordionTrigger>
          <AccordionContent className="space-y-1">
            {waveformParams.map(({ key, label, min, max, step, unit }) => (
              <WaveformSlider
                key={key}
                label={label}
                value={simOptions.waveform?.[key] ?? 0}
                min={min}
                max={max}
                step={step}
                digits={2}
                unit={unit}
                onChange={(v) =>
                  updateWaveform(key as keyof NonNullable<SimOptions['waveform']>, v)
                }
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

    </div>
  );
}
