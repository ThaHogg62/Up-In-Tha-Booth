import React, { useId } from 'react';

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, min, max, step, onChange, disabled }) => {
  const id = useId();
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center text-sm">
        <label htmlFor={id} className="text-gray-300 font-medium">{label}</label>
        <span className="text-blue-400 font-mono bg-gray-700/50 px-2 py-0.5 rounded">
          {value.toFixed(1)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:accent-gray-600 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default ControlSlider;