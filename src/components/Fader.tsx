import React from 'react';

interface FaderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  accentClass?: string;
  formatValue?: (val: number) => string;
}

export const Fader: React.FC<FaderProps> = ({
  label, value, min, max, step, onChange,
  accentClass = 'accent-trace1', formatValue = (v) => v.toFixed(2)
}) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-0.5">
        <label className="text-[9px] font-mono text-muted uppercase tracking-widest">{label}</label>
        <span className="text-[10px] font-mono text-primary bg-panelSolid/60 px-1 py-px rounded border border-border/25">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full ${accentClass}`}
      />
    </div>
  );
};
