export interface AudioSettings {
  bassGain: number;
  midGain: number;
  trebleGain: number;
  compressorThreshold: number;
  compressorRatio: number;
  reverb: number; // Simplified reverb as a wet/dry mix from 0 to 1
  noiseGateThreshold: number; // Threshold in dB for the noise gate. Range: -100 to 0.
  deesserFrequency: number; // Frequency for the de-esser, typically high (e.g., 8000Hz)
  deesserCut: number; // Gain reduction in dB for the de-esser. Range -40 to 0.
  saturation: number; // Amount of harmonic saturation/excitement. Range 0 to 1.
  stereoWidth: number; // Amount of stereo widening effect. Range 0 (mono) to 1 (wide).
}