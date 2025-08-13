import React from 'react';
import { SmallSpinnerIcon } from '@/components/Icons';

interface PresetPromptsProps {
  onPresetSelect: (prompt: string) => void;
  loadingPreset: string | null;
  disabled: boolean;
}

const presets = [
  'Warm Podcast Voice',
  'Clear & Bright',
  'Radio DJ',
  'Intimate ASMR',
];

const PresetPrompts: React.FC<PresetPromptsProps> = React.memo(({ onPresetSelect, loadingPreset, disabled }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {presets.map((preset) => {
        const isLoadingThis = loadingPreset === preset;
        return (
            <button
              key={preset}
              onClick={() => onPresetSelect(preset)}
              disabled={disabled || !!loadingPreset}
              className="px-3 py-1 bg-gray-700 text-blue-300 text-sm font-medium rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] h-[30px]"
            >
              {isLoadingThis ? <SmallSpinnerIcon className="animate-spin w-4 h-4" /> : preset}
            </button>
        );
    })}
    </div>
  );
});

export default PresetPrompts;