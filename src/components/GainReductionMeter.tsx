import React from 'react';

interface GainReductionMeterProps {
  reduction: number; // The gain reduction in dB (a negative value or 0)
}

// A typical max reduction viewable on meters is around -30dB
const MAX_REDUCTION_DB = 30;

const GainReductionMeter: React.FC<GainReductionMeterProps> = React.memo(({ reduction }) => {
  const reductionAmount = Math.max(0, Math.min(MAX_REDUCTION_DB, -reduction));
  const percentage = (reductionAmount / MAX_REDUCTION_DB) * 100;

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="w-4 h-32 bg-gray-700 rounded-full overflow-hidden transform rotate-180">
        <div
          className="bg-yellow-400 w-full transition-all duration-50"
          style={{ height: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-xs font-mono text-gray-400">GR</span>
    </div>
  );
});

export default GainReductionMeter;