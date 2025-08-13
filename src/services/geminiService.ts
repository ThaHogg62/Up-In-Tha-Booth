import { AudioSettings } from '@/types';

export const isValidAudioSettings = (obj: any): obj is AudioSettings => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.bassGain === 'number' &&
        typeof obj.midGain === 'number' &&
        typeof obj.trebleGain === 'number' &&
        typeof obj.compressorThreshold === 'number' &&
        typeof obj.compressorRatio === 'number' &&
        typeof obj.reverb === 'number' &&
        typeof obj.noiseGateThreshold === 'number' &&
        typeof obj.deesserFrequency === 'number' &&
        typeof obj.deesserCut === 'number' &&
        typeof obj.saturation === 'number' &&
        typeof obj.stereoWidth === 'number'
    );
};

export const generateAudioSettingsFromChat = async (prompt: string): Promise<AudioSettings> => {
  try {
    const response = await fetch('/api/generate-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        // Try to parse error message from backend, otherwise use status text
        let errorMessage = `Request failed with status ${response.status}. Is the backend server running?`;
        try {
            const errorBody = await response.json();
            if(errorBody.error) errorMessage = errorBody.error;
        } catch (e) {
            // response body is not json or empty
        }
        throw new Error(errorMessage);
    }
    
    const parsedSettings = await response.json();
    
    // Robust validation to ensure the server returned the correct object.
    if (!isValidAudioSettings(parsedSettings)) {
        console.error("Invalid response format from server:", parsedSettings);
        throw new Error("Server returned an invalid or incomplete response format.");
    }

    return parsedSettings;
  } catch (error) {
    console.error("Error generating audio settings:", error);
    // Re-throw custom errors or a generic one
    throw error instanceof Error ? error : new Error("Failed to get audio settings from the server.");
  }
};