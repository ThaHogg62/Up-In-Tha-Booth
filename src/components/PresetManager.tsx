import React, { useState } from 'react';
import { AudioSettings } from '@/types';
import { SaveAltIcon, TrashIcon, FolderOpenIcon } from '@/components/Icons';

export interface UserPreset {
  name: string;
  settings: AudioSettings;
}

interface PresetManagerProps {
  presets: UserPreset[];
  onSave: (name: string) => void;
  onLoad: (preset: UserPreset) => void;
  onDelete: (name: string) => void;
  disabled: boolean;
  currentSettings: AudioSettings;
}

const PresetManager: React.FC<PresetManagerProps> = ({ presets, onSave, onLoad, onDelete, disabled }) => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [error, setError] = useState('');

  const handleSaveClick = () => {
    if (!presetName.trim()) {
      setError('Preset name cannot be empty.');
      return;
    }
    if (presets.some(p => p.name.toLowerCase() === presetName.trim().toLowerCase())) {
      setError('A preset with this name already exists.');
      return;
    }
    onSave(presetName.trim());
    setPresetName('');
    setError('');
    setIsSaveModalOpen(false);
  };

  const handleLoadPreset = (preset: UserPreset) => {
    onLoad(preset);
    setIsLoadModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsLoadModalOpen(true)}
          disabled={disabled || presets.length === 0}
          className="flex-grow bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <FolderOpenIcon className="w-5 h-5" />
          <span>Load Preset</span>
        </button>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          disabled={disabled}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center space-x-2"
          aria-label="Save current settings as a new preset"
        >
          <SaveAltIcon className="w-5 h-5" />
          <span>Save</span>
        </button>
      </div>

      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-4 w-full max-w-sm" role="dialog" aria-modal="true">
            <h3 className="text-xl font-bold text-blue-300">Save Preset</h3>
            <p className="text-sm text-gray-400">Enter a name for your current audio settings.</p>
            <input
              type="text"
              value={presetName}
              onChange={(e) => {
                setPresetName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., My Podcast Voice"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveClick} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isLoadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md" role="dialog" aria-modal="true">
                <h3 className="text-xl font-bold text-blue-300 mb-4">Load Preset</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {presets.length > 0 ? presets.map(p => (
                        <div key={p.name} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                           <span className="text-white font-medium truncate pr-2">{p.name}</span>
                           <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => onDelete(p.name)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" aria-label={`Delete ${p.name}`}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleLoadPreset(p)} className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 transition-colors">
                                    Load
                                </button>
                           </div>
                        </div>
                    )) : <p className="text-gray-400 text-center py-4">No saved presets.</p>}
                </div>
                 <div className="flex justify-end pt-4 mt-2 border-t border-gray-700">
                     <button onClick={() => setIsLoadModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default PresetManager;