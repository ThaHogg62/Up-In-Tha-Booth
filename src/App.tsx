
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AudioSettings } from '@/types';
import { generateAudioSettingsFromChat, isValidAudioSettings } from '@/services/geminiService';
import AudioVisualizer from '@/components/AudioVisualizer';
import ControlSlider from '@/components/ControlSlider';
import PresetPrompts from '@/components/PresetPrompts';
import { MicIcon, PhoneIcon, AILoadingSpinner, RecordIcon, CloudUploadIcon, SaveIcon, TrashIcon, ChevronDownIcon, CopyIcon, PasteIcon, SmallSpinnerIcon, SaveAltIcon, FolderOpenIcon, CloseIcon } from '@/components/Icons';
import EQVisualizer from '@/components/EQVisualizer';
import GainReductionMeter from '@/components/GainReductionMeter';
import CollapsibleSection from '@/components/CollapsibleSection';
import PresetManager, { UserPreset } from '@/components/PresetManager';
import WelcomeModal from '@/components/WelcomeModal';
import AppHeader from '@/components/AppHeader';
import { useStripe } from '@stripe/react-stripe-js';


const DEFAULT_SETTINGS: AudioSettings = {
  bassGain: 0,
  midGain: 0,
  trebleGain: 0,
  compressorThreshold: -24,
  compressorRatio: 4,
  reverb: 0.1,
  noiseGateThreshold: -70,
  deesserFrequency: 8000,
  deesserCut: -20,
  saturation: 0,
  stereoWidth: 0,
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const GoPremiumOverlay: React.FC<{ onUpgrade: () => void; isUpgrading: boolean; }> = ({ onUpgrade, isUpgrading }) => (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center rounded-lg z-10 p-4 border border-yellow-500/30">
        <h3 className="text-xl font-bold text-yellow-300">Unlock Creative Effects</h3>
        <p className="text-gray-300 my-2">Upgrade to Premium to access Ambience, Vocal Exciter, and Stereo Width controls.</p>
        <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="mt-2 w-full max-w-xs flex items-center justify-center space-x-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-75 disabled:cursor-wait"
        >
            {isUpgrading ? (
                <>
                    <SmallSpinnerIcon className="animate-spin w-5 h-5" />
                    <span>Redirecting...</span>
                </>
            ) : (
                <span>Upgrade to Premium - $5.00</span>
            )}
        </button>
    </div>
);


interface SaveOptionsProps {
    duration: number;
    onSaveCloud: () => void;
    onSaveDevice: () => void;
    onDiscard: () => void;
    isPaidUser: boolean;
    onUpgrade: () => void;
    isUpgrading: boolean;
}

const SaveOptionsComponent: React.FC<SaveOptionsProps> = React.memo(({ duration, onSaveCloud, onSaveDevice, onDiscard, isPaidUser, onUpgrade, isUpgrading }) => (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6 text-center">
        <h2 className="text-2xl font-bold text-blue-300">Save Recording</h2>
        <p className="text-lg text-gray-300">Duration: {formatTime(duration)}</p>
        <div className="space-y-4 pt-4">
            <button
                onClick={isPaidUser ? onSaveCloud : onUpgrade}
                disabled={isUpgrading && !isPaidUser}
                className={`w-full flex items-center justify-center space-x-3 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-75 disabled:cursor-wait ${isPaidUser ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-yellow-300'}`}
            >
                <CloudUploadIcon className="w-6 h-6" />
                <span>{isPaidUser ? 'Save to Cloud' : 'Save to Cloud (Premium)'}</span>
                 {isUpgrading && !isPaidUser && <SmallSpinnerIcon className="animate-spin w-5 h-5 ml-2" />}
            </button>
            <button
                onClick={onSaveDevice}
                className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                <SaveIcon className="w-6 h-6" />
                <span>Save to Device</span>
            </button>
            <button
                onClick={onDiscard}
                className="w-full flex items-center justify-center space-x-3 bg-gray-600 hover:bg-gray-700 text-white font-normal py-3 px-4 rounded-lg transition-colors"
            >
                <TrashIcon className="w-5 h-5" />
                <span>Discard</span>
            </button>
        </div>
    </div>
));


const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const clampSettings = (s: AudioSettings): AudioSettings => ({
  bassGain: clamp(s.bassGain, -20, 20),
  midGain: clamp(s.midGain, -20, 20),
  trebleGain: clamp(s.trebleGain, -20, 20),
  compressorThreshold: clamp(s.compressorThreshold, -60, 0),
  compressorRatio: clamp(s.compressorRatio, 1, 20),
  reverb: clamp(s.reverb, 0, 1),
  noiseGateThreshold: clamp(s.noiseGateThreshold, -100, 0),
  deesserFrequency: clamp(s.deesserFrequency, 2000, 12000),
  deesserCut: clamp(s.deesserCut, -40, 0),
  saturation: clamp(s.saturation, 0, 1),
  stereoWidth: clamp(s.stereoWidth, 0, 1),
});


const App: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isBypassed, setIsBypassed] = useState<boolean>(false);
    const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
    const [prompt, setPrompt] = useState<string>('Warm podcast voice');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [callDuration, setCallDuration] = useState<number>(0);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [hasRecordingBeenStopped, setHasRecordingBeenStopped] = useState<boolean>(false);
    const [showSaveOptions, setShowSaveOptions] = useState<boolean>(false);
    const [lastCallDuration, setLastCallDuration] = useState<number>(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [gainReduction, setGainReduction] = useState<number>(0);
    const [copyStatus, setCopyStatus] = useState<string>('Copy');
    const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
    const [showWelcome, setShowWelcome] = useState<boolean>(false);
    const [isPaidUser, setIsPaidUser] = useState<boolean>(false);
    const [isUpgrading, setIsUpgrading] = useState<boolean>(false);

    const stripe = useStripe();

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const noiseGateRef = useRef<DynamicsCompressorNode | null>(null);
    const bassFilterRef = useRef<BiquadFilterNode | null>(null);
    const midFilterRef = useRef<BiquadFilterNode | null>(null);
    const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
    const deesserRef = useRef<BiquadFilterNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const saturatorRef = useRef<WaveShaperNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    
    const convolverRef = useRef<ConvolverNode | null>(null);
    const wetGainRef = useRef<GainNode | null>(null);
    const dryGainRef = useRef<GainNode | null>(null);

    const doublerDryGainRef = useRef<GainNode | null>(null);
    const doublerWetGainRef = useRef<GainNode | null>(null);
    const delayLRef = useRef<DelayNode | null>(null);
    const delayRRef = useRef<DelayNode | null>(null);
    const pannerLRef = useRef<StereoPannerNode | null>(null);
    const pannerRRef = useRef<StereoPannerNode | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
      // Check for Stripe redirect status on initial load
      const checkPaymentStatus = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_success')) {
          try {
            localStorage.setItem('tha-booth-is-paid', 'true');
            setIsPaidUser(true);
            alert('Upgrade successful! All premium features are now unlocked.');
          } catch(e) {
            console.error("Failed to save premium status", e);
            setError("Upgrade successful, but failed to save status. Please refresh.");
          }
          window.history.replaceState(null, '', window.location.pathname);
        }
        
        if (urlParams.get('payment_cancel')) {
          setError("Payment was cancelled. You can try again anytime.");
          window.history.replaceState(null, '', window.location.pathname);
        }
      };
      
      checkPaymentStatus();

      // Load existing state from localStorage
      try {
        const storedPresets = localStorage.getItem('tha-booth-presets');
        if (storedPresets) setUserPresets(JSON.parse(storedPresets));
        
        const hasVisited = localStorage.getItem('tha-booth-has-visited');
        if (!hasVisited) setShowWelcome(true);

        const isPaid = localStorage.getItem('tha-booth-is-paid') === 'true';
        if (isPaid) setIsPaidUser(true);
      } catch (e) {
        console.error("Could not access localStorage", e);
      }
    }, []);

    const handleWelcomeClose = () => {
        setShowWelcome(false);
        try {
            localStorage.setItem('tha-booth-has-visited', 'true');
        } catch (e) {
            console.error("Could not set item in localStorage", e);
        }
    };

    const stopAudioProcessing = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        setIsProcessing(false);
        setIsRecording(false);
        mediaRecorderRef.current = null;
    }, []);

    useEffect(() => {
        let timer: number | undefined;
        if (isProcessing) {
            timer = window.setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => window.clearInterval(timer);
    }, [isProcessing]);
    
    const createReverbImpulseResponse = (context: AudioContext) => {
        const sampleRate = context.sampleRate;
        const duration = 2;
        const decay = 3;
        const bufferSize = sampleRate * duration;
        const buffer = context.createBuffer(2, bufferSize, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < bufferSize; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, decay);
            }
        }
        return buffer;
    };

    const createSaturationCurve = (amount: number) => {
        const k = typeof amount === 'number' ? amount * 100 : 50;
        if (k === 0) return null;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    };

    const setupAudioProcessing = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) throw new Error("Screen/Tab Capture API not supported.");
            
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { sampleRate: 48000, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
            });
            streamRef.current = stream;

            stream.getVideoTracks().forEach(track => track.stop());
            if (stream.getAudioTracks().length === 0) {
                 throw new Error("No audio track captured. Please share a source with audio.");
            }

            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
            
            const source = context.createMediaStreamSource(stream);
            const analyser = context.createAnalyser();
            analyser.fftSize = 2048;

            const noiseGate = context.createDynamicsCompressor();
            const bass = context.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 250;
            const mid = context.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1;
            const treble = context.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4000;
            const deesser = context.createBiquadFilter(); deesser.type = 'peaking'; deesser.Q.value = 2.5;
            const compressor = context.createDynamicsCompressor();
            const saturator = context.createWaveShaper();

            const doublerDry = context.createGain();
            const doublerWet = context.createGain();
            const delayL = context.createDelay(); delayL.delayTime.value = 0.015;
            const delayR = context.createDelay(); delayR.delayTime.value = 0.025;
            const pannerL = context.createStereoPanner(); pannerL.pan.value = -0.8;
            const pannerR = context.createStereoPanner(); pannerR.pan.value = 0.8;

            const convolver = context.createConvolver(); convolver.buffer = createReverbImpulseResponse(context);
            const dryGain = context.createGain();
            const wetGain = context.createGain();
            const masterGain = context.createGain();

            sourceNodeRef.current = source; analyserNodeRef.current = analyser;
            noiseGateRef.current = noiseGate; bassFilterRef.current = bass; midFilterRef.current = mid; trebleFilterRef.current = treble;
            deesserRef.current = deesser; compressorRef.current = compressor; saturatorRef.current = saturator;
            doublerDryGainRef.current = doublerDry; doublerWetGainRef.current = doublerWet;
            delayLRef.current = delayL; delayRRef.current = delayR; pannerLRef.current = pannerL; pannerRRef.current = pannerR;
            convolverRef.current = convolver; dryGainRef.current = dryGain; wetGainRef.current = wetGain; gainNodeRef.current = masterGain;

            const recordingDestination = context.createMediaStreamDestination();
            
            const doublerInput = saturator;
            source.connect(noiseGate).connect(bass).connect(mid).connect(treble).connect(deesser).connect(compressor).connect(doublerInput);

            doublerInput.connect(delayL).connect(pannerL).connect(doublerWet);
            doublerInput.connect(delayR).connect(pannerR).connect(doublerWet);
            doublerInput.connect(doublerDry);
            
            const reverbInput = context.createGain();
            doublerDry.connect(reverbInput);
            doublerWet.connect(reverbInput);

            reverbInput.connect(dryGain);
            reverbInput.connect(convolver).connect(wetGain);

            dryGain.connect(masterGain);
            wetGain.connect(masterGain);
            
            masterGain.connect(analyser); 
            analyser.connect(context.destination); 
            masterGain.connect(recordingDestination);
            
            mediaRecorderRef.current = new MediaRecorder(recordingDestination.stream, { mimeType: 'audio/webm' });
            recordedChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                recordedChunksRef.current = [];
            };

            setIsProcessing(true);
            setError(null);
        } catch (err: any) {
            console.error("Error setting up audio:", err);
            setError(`Could not capture audio: ${err.message}`);
            setIsProcessing(false);
        }
    }, []);

    useEffect(() => {
        if (!isProcessing || !audioContextRef.current) return;

        const { bassGain, midGain, trebleGain, compressorThreshold, compressorRatio, reverb, noiseGateThreshold, deesserFrequency, deesserCut, saturation, stereoWidth } = settings;
        const isEffectsActive = !isBypassed;
        const time = audioContextRef.current.currentTime;
        
        noiseGateRef.current!.threshold.setValueAtTime(isEffectsActive ? noiseGateThreshold : -100, time);
        noiseGateRef.current!.knee.setValueAtTime(0, time);
        noiseGateRef.current!.ratio.setValueAtTime(20, time);
        noiseGateRef.current!.attack.setValueAtTime(0, time);
        noiseGateRef.current!.release.setValueAtTime(0.2, time);

        bassFilterRef.current!.gain.setValueAtTime(isEffectsActive ? bassGain : 0, time);
        midFilterRef.current!.gain.setValueAtTime(isEffectsActive ? midGain : 0, time);
        trebleFilterRef.current!.gain.setValueAtTime(isEffectsActive ? trebleGain : 0, time);

        deesserRef.current!.frequency.setValueAtTime(deesserFrequency, time);
        deesserRef.current!.gain.setValueAtTime(isEffectsActive ? deesserCut : 0, time);
        
        compressorRef.current!.threshold.setValueAtTime(isEffectsActive ? compressorThreshold : 0, time);
        compressorRef.current!.ratio.setValueAtTime(isEffectsActive ? compressorRatio : 1, time);
        compressorRef.current!.knee.setValueAtTime(5, time);
        compressorRef.current!.attack.setValueAtTime(0.01, time);
        compressorRef.current!.release.setValueAtTime(0.25, time);

        const isPremiumEffectsActive = isEffectsActive && isPaidUser;
        saturatorRef.current!.curve = isPremiumEffectsActive ? createSaturationCurve(saturation) : null;
        saturatorRef.current!.oversample = '4x';
        
        const effectiveWidth = isPremiumEffectsActive ? stereoWidth : 0;
        doublerWetGainRef.current!.gain.setValueAtTime(effectiveWidth, time);
        doublerDryGainRef.current!.gain.setValueAtTime(1 - effectiveWidth, time); 
        
        const effectiveReverb = isPremiumEffectsActive ? reverb : 0;
        wetGainRef.current!.gain.setValueAtTime(effectiveReverb, time);
        dryGainRef.current!.gain.setValueAtTime(1 - effectiveReverb, time);

    }, [settings, isProcessing, isBypassed, isPaidUser]);
    
    useEffect(() => {
        if (!isProcessing || !compressorRef.current) {
            setGainReduction(0);
            return;
        }
        let animationFrameId: number;
        const compressorNode = compressorRef.current;
        const updateMeter = () => {
            setGainReduction(compressorNode.reduction);
            animationFrameId = requestAnimationFrame(updateMeter);
        };
        animationFrameId = requestAnimationFrame(updateMeter);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isProcessing]);


    useEffect(() => () => stopAudioProcessing(), [stopAudioProcessing]);

    const handleToggleProcessing = useCallback(async () => {
        if (isProcessing) {
            setLastCallDuration(callDuration);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                const stopped = new Promise<void>(resolve => {
                    mediaRecorderRef.current!.addEventListener('stop', () => resolve(), { once: true });
                    mediaRecorderRef.current!.stop();
                });
                await stopped;
            }
            stopAudioProcessing();
        } else {
            setShowSaveOptions(false);
            setRecordedBlob(null);
            setHasRecordingBeenStopped(false);
            recordedChunksRef.current = [];
            setupAudioProcessing();
        }
    }, [isProcessing, callDuration, stopAudioProcessing, setupAudioProcessing]);
    
    const handleToggleRecording = () => {
        if (!isProcessing || !mediaRecorderRef.current || hasRecordingBeenStopped) return;

        if (isRecording) {
            mediaRecorderRef.current.stop();
            setHasRecordingBeenStopped(true);
        } else {
            if (recordedBlob) setRecordedBlob(null);
            recordedChunksRef.current = [];
            mediaRecorderRef.current.start();
        }
        setIsRecording(prev => !prev);
    };

    const handleGenerateClick = useCallback(async (promptToUse: string, presetName: string | null = null) => {
        if (!promptToUse) {
            setError("Please enter a description for the sound you want.");
            return;
        }
        setIsLoading(true);
        if (presetName) setLoadingPreset(presetName);
        setError(null);
        try {
            const newSettings = await generateAudioSettingsFromChat(promptToUse);
            const clampedSettings = clampSettings(newSettings);
            setSettings(clampedSettings);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
            if (presetName) setLoadingPreset(null);
        }
    }, []);

    const handlePresetSelect = (presetPrompt: string) => {
        setPrompt(presetPrompt);
        handleGenerateClick(presetPrompt, presetPrompt);
    };

    const handleSliderChange = (param: keyof AudioSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [param]: parseFloat(e.target.value) }));
    };

    const handleResetSettings = () => setSettings(DEFAULT_SETTINGS);
    
    const handleCopySettings = () => {
        if (!isProcessing || copyStatus !== 'Copy') return;
        const settingsJson = JSON.stringify(settings, null, 2);
        navigator.clipboard.writeText(settingsJson).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy'), 2000);
        }).catch(err => {
            console.error('Failed to copy settings: ', err);
            setError('Failed to copy settings.');
        });
    };

    const handlePasteSettings = useCallback(async () => {
        if (!isProcessing) return;
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) { setError("Clipboard is empty."); return; }
            const parsed = JSON.parse(clipboardText);
            if (isValidAudioSettings(parsed)) {
                setSettings(clampSettings(parsed));
                setError(null);
            } else {
                throw new Error("Invalid settings format in clipboard.");
            }
        } catch (e: any) {
            console.error("Paste failed:", e);
            setError("Failed to paste: Invalid data in clipboard.");
        }
    }, [isProcessing]);

    const handleUpgrade = useCallback(async () => {
      if (isUpgrading || !stripe) {
        if (!stripe) console.error("Stripe.js has not loaded yet.");
        return;
      }
      setIsUpgrading(true);
      setError(null);
      try {
        const res = await fetch('/api/create-payment-intent', { method: 'POST' });
        if (!res.ok) {
            const { error = 'Unknown error' } = await res.json();
            throw new Error(`Failed to create payment session: ${error}`);
        }
        const { sessionId } = await res.json();
        
        if (!sessionId) {
          throw new Error('Could not create payment session.');
        }
        
        await stripe.redirectToCheckout({ sessionId });
      } catch (err: any) {
        setError(err.message || 'Failed to start payment process.');
        setIsUpgrading(false);
      }
    }, [isUpgrading, stripe]);

    const resetToMainScreen = () => {
        setShowSaveOptions(false);
        setRecordedBlob(null);
    };

    const handleSaveCloud = () => {
        if (!isPaidUser) {
            handleUpgrade();
            return;
        }
        if (!recordedBlob) return;
        console.log("Saving to cloud...", recordedBlob);
        alert("Your recording has been 'saved' to the cloud! (This is a demo feature)");
        resetToMainScreen();
    };
    
    const handleSaveDevice = () => {
        if (!recordedBlob) return;
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `tha-booth-recording-${timestamp}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        resetToMainScreen();
    };

    useEffect(() => {
        if (recordedBlob && !isProcessing) {
             setShowSaveOptions(true);
        }
    }, [recordedBlob, isProcessing]);

    const handleSavePreset = (name: string) => {
      const newPreset = { name, settings };
      const newPresets = [...userPresets, newPreset];
      setUserPresets(newPresets);
      try {
        localStorage.setItem('tha-booth-presets', JSON.stringify(newPresets));
      } catch (e) { setError("Could not save preset. Storage might be full."); }
    };

    const handleLoadPreset = (preset: UserPreset) => setSettings(preset.settings);

    const handleDeletePreset = (presetNameToDelete: string) => {
      const newPresets = userPresets.filter(p => p.name !== presetNameToDelete);
      setUserPresets(newPresets);
      try {
        localStorage.setItem('tha-booth-presets', JSON.stringify(newPresets));
      } catch (e) { setError("Could not delete preset."); }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-white flex justify-center p-4">
            <div className="w-full max-w-md mx-auto">
                <WelcomeModal isOpen={showWelcome} onClose={handleWelcomeClose} />
                <AppHeader isPaid={isPaidUser} />
                {showSaveOptions ? (
                    <SaveOptionsComponent 
                        duration={lastCallDuration}
                        onSaveCloud={handleSaveCloud}
                        onSaveDevice={handleSaveDevice}
                        onDiscard={resetToMainScreen}
                        isPaidUser={isPaidUser}
                        onUpgrade={handleUpgrade}
                        isUpgrading={isUpgrading}
                    />
                ) : (
                  <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                  <MicIcon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                  <p className="font-semibold text-lg">{isRecording ? "Recording..." : (isProcessing ? "Processing Live" : "Offline")}</p>
                                  <p className={`text-sm ${isProcessing ? 'text-green-400' : 'text-gray-400'}`}>
                                      {isProcessing ? formatTime(callDuration) : 'Disconnected'}
                                      {isRecording && <span className="ml-2 text-red-500 font-bold animate-pulse">● REC</span>}
                                  </p>
                              </div>
                          </div>
                          <div className="flex items-center space-x-2">
                              <button 
                                onClick={handleToggleRecording}
                                disabled={!isProcessing || hasRecordingBeenStopped}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                              >
                                  <RecordIcon className="w-5 h-5 text-white"/>
                              </button>
                              <button 
                                onClick={handleToggleProcessing}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${isProcessing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                aria-label={isProcessing ? 'Stop Processing' : 'Start Processing'}
                              >
                                <PhoneIcon className={`w-8 h-8 text-white transition-transform duration-300 ${isProcessing ? 'transform rotate-[-135deg]' : ''}`} />
                              </button>
                          </div>
                      </div>

                      <AudioVisualizer analyserNode={analyserNodeRef.current} isProcessing={isProcessing} />
                      
                      {error && (
                        <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm flex justify-between items-center">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-red-500/30 transition-colors">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-center text-blue-300">AI Sound Designer</h2>
                        <PresetPrompts onPresetSelect={handlePresetSelect} loadingPreset={loadingPreset} disabled={isLoading || !isProcessing} />
                        <div className="flex space-x-2 pt-2">
                            <input 
                                type="text"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="e.g., Crisp and clear for a meeting"
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                disabled={isLoading || !isProcessing}
                            />
                            <button
                                onClick={() => handleGenerateClick(prompt)}
                                disabled={isLoading || !isProcessing}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center w-36"
                            >
                                {isLoading && !loadingPreset ? <AILoadingSpinner className="animate-spin w-5 h-5" /> : 'Generate'}
                            </button>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-700/50">
                        <PresetManager
                          presets={userPresets}
                          onSave={handleSavePreset}
                          onLoad={handleLoadPreset}
                          onDelete={handleDeletePreset}
                          disabled={!isProcessing}
                          currentSettings={settings}
                        />
                      </div>

                      <div className="space-y-1 pt-4 border-t border-gray-700/50">
                          <div className="flex justify-between items-center mb-2">
                              <h2 className="text-xl font-semibold text-blue-300">Manual Controls</h2>
                              <div className="flex items-center space-x-4">
                                  <button onClick={handlePasteSettings} disabled={!isProcessing} className="text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 transition-colors flex items-center space-x-1.5">
                                      <PasteIcon className="w-4 h-4" />
                                      <span>Paste</span>
                                  </button>
                                   <button onClick={handleCopySettings} disabled={!isProcessing || copyStatus !== 'Copy'} className="text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 transition-colors flex items-center space-x-1.5">
                                      <CopyIcon className="w-4 h-4" />
                                      <span>{copyStatus}</span>
                                  </button>
                                  <button onClick={handleResetSettings} disabled={!isProcessing} className="text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 transition-colors">Reset</button>
                                  <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-400">Bypass</span>
                                      <button
                                          onClick={() => setIsBypassed(!isBypassed)}
                                          disabled={!isProcessing}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${isBypassed ? 'bg-gray-600' : 'bg-blue-600'}`}
                                      >
                                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBypassed ? 'translate-x-1' : 'translate-x-6'}`} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                          
                          <CollapsibleSection title="Equalizer & Tone">
                              <EQVisualizer bassGain={settings.bassGain} midGain={settings.midGain} trebleGain={settings.trebleGain} />
                              <ControlSlider label="Bass" value={settings.bassGain} min={-20} max={20} step={0.1} onChange={handleSliderChange('bassGain')} disabled={!isProcessing || isBypassed} />
                              <ControlSlider label="Mids" value={settings.midGain} min={-20} max={20} step={0.1} onChange={handleSliderChange('midGain')} disabled={!isProcessing || isBypassed} />
                              <ControlSlider label="Treble" value={settings.trebleGain} min={-20} max={20} step={0.1} onChange={handleSliderChange('trebleGain')} disabled={!isProcessing || isBypassed} />
                          </CollapsibleSection>

                           <CollapsibleSection title="Dynamics">
                              <ControlSlider label="Noise Gate" value={settings.noiseGateThreshold} min={-100} max={0} step={1} onChange={handleSliderChange('noiseGateThreshold')} disabled={!isProcessing || isBypassed} />
                              <ControlSlider label="De-Esser" value={settings.deesserCut} min={-40} max={0} step={1} onChange={handleSliderChange('deesserCut')} disabled={!isProcessing || isBypassed} />
                              <div className="flex items-end space-x-4 pt-2">
                                <div className="flex-grow space-y-4">
                                   <ControlSlider label="Compressor Threshold" value={settings.compressorThreshold} min={-60} max={0} step={1} onChange={handleSliderChange('compressorThreshold')} disabled={!isProcessing || isBypassed} />
                                   <ControlSlider label="Compressor Ratio" value={settings.compressorRatio} min={1} max={20} step={0.5} onChange={handleSliderChange('compressorRatio')} disabled={!isProcessing || isBypassed} />
                                </div>
                                <GainReductionMeter reduction={gainReduction} />
                              </div>
                           </CollapsibleSection>
                          
                           <CollapsibleSection title="Creative Effects">
                                <div className="relative space-y-4">
                                    {!isPaidUser && <GoPremiumOverlay onUpgrade={handleUpgrade} isUpgrading={isUpgrading} />}
                                    <div className={!isPaidUser ? 'blur-sm pointer-events-none' : ''}>
                                        <ControlSlider label="Ambience/Reverb" value={settings.reverb} min={0} max={1} step={0.05} onChange={handleSliderChange('reverb')} disabled={!isProcessing || isBypassed || !isPaidUser} />
                                        <ControlSlider label="Vocal Exciter" value={settings.saturation} min={0} max={1} step={0.05} onChange={handleSliderChange('saturation')} disabled={!isProcessing || isBypassed || !isPaidUser} />
                                        <ControlSlider label="Stereo Width" value={settings.stereoWidth} min={0} max={1} step={0.05} onChange={handleSliderChange('stereoWidth')} disabled={!isProcessing || isBypassed || !isPaidUser} />
                                    </div>
                                </div>
                           </CollapsibleSection>
                      </div>

                  </div>
                )}

                {!isProcessing && !showSaveOptions && (
                    <div className="text-center mt-6 text-gray-400 flex items-center justify-center space-x-2">
                        <PhoneIcon className="w-5 h-5" />
                        <span>Press the green phone to start processing audio.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;