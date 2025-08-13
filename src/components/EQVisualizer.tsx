import React from 'react';

interface EQVisualizerProps {
  bassGain: number;
  midGain: number;
  trebleGain: number;
}

// Constants for the visualizer
const WIDTH = 300;
const HEIGHT = 100;
const FREQ_MIN_LOG = Math.log10(20);
const FREQ_MAX_LOG = Math.log10(20000);
const GAIN_MIN = -20;
const GAIN_MAX = 20;

const freqToX = (freq: number) => {
  const logFreq = Math.log10(freq);
  return ((logFreq - FREQ_MIN_LOG) / (FREQ_MAX_LOG - FREQ_MIN_LOG)) * WIDTH;
};

const gainToY = (gain: number) => {
  return HEIGHT - ((gain - GAIN_MIN) / (GAIN_MAX - GAIN_MIN)) * HEIGHT;
};

const EQVisualizer: React.FC<EQVisualizerProps> = React.memo(({ bassGain, midGain, trebleGain }) => {
  const points: [number, number][] = [];
  const numPoints = 100;

  for (let i = 0; i <= numPoints; i++) {
    const percent = i / numPoints;
    const logFreq = FREQ_MIN_LOG + (FREQ_MAX_LOG - FREQ_MIN_LOG) * percent;
    const freq = Math.pow(10, logFreq);

    // Simplified model of filter combination
    // Bass (low-shelf at 250Hz)
    const bassEffect = (freq <= 250) ? bassGain : bassGain * (1 / (1 + Math.pow(freq/250, 2)));
    
    // Mids (peaking at 1000Hz, Q=1)
    const midEffect = midGain * Math.exp(-0.5 * Math.pow((Math.log(freq / 1000) / Math.log(2)), 2));

    // Treble (high-shelf at 4000Hz)
    const trebleEffect = (freq >= 4000) ? trebleGain : trebleGain * (1 / (1 + Math.pow(4000/freq, 2)));

    const totalGain = bassEffect + midEffect + trebleEffect;
    const clampedGain = Math.max(GAIN_MIN, Math.min(GAIN_MAX, totalGain));

    points.push([freqToX(freq), gainToY(clampedGain)]);
  }

  const pathData = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p[0]},${p[1]}`).join(' ');

  return (
    <div className="bg-gray-700/50 p-2 rounded-lg">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
        {/* Grid lines */}
        <line x1={0} y1={gainToY(0)} x2={WIDTH} y2={gainToY(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={freqToX(100)} y1="0" x2={freqToX(100)} y2={HEIGHT} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={freqToX(1000)} y1="0" x2={freqToX(1000)} y2={HEIGHT} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={freqToX(10000)} y1="0" x2={freqToX(10000)} y2={HEIGHT} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        
        {/* EQ Curve */}
        <path d={pathData} stroke="#3b82f6" fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        
        {/* Frequency Labels */}
        <text x={freqToX(100)} y={HEIGHT - 5} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">100</text>
        <text x={freqToX(1000)} y={HEIGHT - 5} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">1k</text>
        <text x={freqToX(10000)} y={HEIGHT - 5} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">10k</text>
        
        {/* Gain Labels */}
        <text x="5" y={gainToY(18)} fill="rgba(255,255,255,0.3)" fontSize="8">+20</text>
        <text x="5" y={gainToY(-18)} fill="rgba(255,255,255,0.3)" fontSize="8">-20</text>
      </svg>
    </div>
  );
});

export default EQVisualizer;