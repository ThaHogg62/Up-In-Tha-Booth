
import React from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4 border border-blue-500/30">
        <h2 className="text-2xl font-bold text-blue-300">Welcome to your AI Audio Enhancer!</h2>
        <p className="text-gray-300">
          Enhance any audio in real-time. The free version gives you full access to core EQ and Dynamics tools.
        </p>
        
        <div className="text-left space-y-3 text-gray-400 pt-2">
             <h3 className="font-semibold text-gray-200 text-lg mb-2">How it Works:</h3>
            <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold text-sm mr-3 mt-1">1</div>
                <div>
                    <h4 className="font-semibold text-gray-200">Play Your Audio</h4>
                    <p>Start a call (e.g., Google Meet, Zoom) or play any audio in another browser tab or application.</p>
                </div>
            </div>
            <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold text-sm mr-3 mt-1">2</div>
                <div>
                    <h4 className="font-semibold text-gray-200">Start Processing</h4>
                    <p>Return here and press the green <span className="font-bold text-green-400">phone icon</span>. You'll be prompted to select the tab or window with your audio source.</p>
                </div>
            </div>
        </div>

        <div className="pt-4 border-t border-gray-700/50">
            <h3 className="text-lg font-bold text-yellow-300">Upgrade to Premium</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
                <li>Unlock all <span className="font-semibold text-gray-200">Creative Effects</span>: Ambience, Vocal Exciter, and Stereo Width.</li>
                <li>Enable <span className="font-semibold text-gray-200">Save to Cloud</span> for your recordings.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">Upgrade anytime from inside the app for a one-time payment of $5.00.</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
