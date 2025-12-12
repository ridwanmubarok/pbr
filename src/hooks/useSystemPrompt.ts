import { useState } from 'react';

export interface SystemPromptPreset {
  id: string;
  name: string;
  prompt: string;
}

const DEFAULT_PRESETS: SystemPromptPreset[] = [
  {
    id: 'default',
    name: 'Asisten Belajar (Default)',
    prompt: 'Kamu adalah asisten belajar AI yang ramah dan membantu. Jelaskan konsep dengan cara yang mudah dipahami, gunakan contoh yang relevan, dan berikan penjelasan step-by-step jika diperlukan.',
  },
  {
    id: 'teacher',
    name: 'Guru Profesional',
    prompt: 'Kamu adalah guru profesional yang sangat berpengalaman. Berikan penjelasan mendalam, gunakan metode pengajaran yang efektif, dan selalu motivasi siswa untuk belajar lebih dalam.',
  },
  {
    id: 'simple',
    name: 'Penjelasan Sederhana',
    prompt: 'Jelaskan segala sesuatu dengan bahasa yang sangat sederhana seperti menjelaskan kepada anak kecil. Gunakan analogi dan contoh kehidupan sehari-hari.',
  },
  {
    id: 'academic',
    name: 'Akademis Formal',
    prompt: 'Berikan penjelasan dengan gaya akademis yang formal dan mendalam. Sertakan referensi teoritis dan gunakan terminologi ilmiah yang tepat.',
  },
  {
    id: 'creative',
    name: 'Kreatif & Interaktif',
    prompt: 'Berikan penjelasan dengan cara yang kreatif dan menarik. Gunakan cerita, permainan kata, dan pendekatan interaktif untuk membuat pembelajaran lebih menyenangkan.',
  },
];

interface UseSystemPromptReturn {
  selectedPreset: SystemPromptPreset;
  customPrompt: string;
  presets: SystemPromptPreset[];
  selectPreset: (presetId: string) => void;
  setCustomPrompt: (prompt: string) => void;
  getCurrentPrompt: () => string;
  resetToDefault: () => void;
}

export const useSystemPrompt = (): UseSystemPromptReturn => {
  const [selectedPreset, setSelectedPreset] = useState<SystemPromptPreset>(
    DEFAULT_PRESETS[0],
  );
  const [customPrompt, setCustomPrompt] = useState('');

  const selectPreset = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset);
      setCustomPrompt(''); // Clear custom prompt when selecting preset
    }
  };

  const getCurrentPrompt = (): string => {
    return customPrompt || selectedPreset.prompt;
  };

  const resetToDefault = () => {
    setSelectedPreset(DEFAULT_PRESETS[0]);
    setCustomPrompt('');
  };

  return {
    selectedPreset,
    customPrompt,
    presets: DEFAULT_PRESETS,
    selectPreset,
    setCustomPrompt,
    getCurrentPrompt,
    resetToDefault,
  };
};
