import { create } from 'zustand';

interface ScriptOptions {
  audience: { value: number; options: string[] };
  age: { value: number; options: string[] };
  style: { value: number; options: string[] };
  language: { value: number; options: string[] };
  duration: { value: number; options: string[] };
  memes: { value: number; options: string[] };
  platform: { value: number; options: string[] };
}

interface ScriptState {
  topic: string;
  script: string;
  loading: boolean;
  error: string;
  showOptions: boolean;
  scriptOptions: ScriptOptions;
  setTopic: (topic: string) => void;
  setScript: (script: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setShowOptions: (show: boolean) => void;
  updateScriptOption: (key: string, value: number) => void;
}

export const useScriptStore = create<ScriptState>((set) => ({
  topic: '',
  script: '',
  loading: false,
  error: '',
  showOptions: false,
  scriptOptions: {
    audience: {
      value: 0,
      options: ['General', 'Beginners', 'Professionals', 'Students', 'Entrepreneurs'],
    },
    age: {
      value: 0,
      options: ['All', 'Kids', 'Teens', 'Adults', 'Seniors', 'Parents'],
    },
    style: {
      value: 0,
      options: ['Casual', 'Professional', 'Informal', 'Humorous', 'Serious', 'Funny'],
    },
    language: {
      value: 0,
      options: [
        'English',
        'Spanish',
        'French',
        'German',
        'Italian',
        'Portuguese',
        'Russian',
        'Turkish',
        'Hindi',
        'Hinglish',
        'Arabic',
        'Japanese',
        'Korean',
        'Chinese',
        'Other',
      ],
    },
    duration: {
      value: 0,
      options: ['1-5', '5-10', '10-15'],
    },
    memes: {
      value: 0,
      options: ['Yes', 'No'],
    },
    platform: {
      value: 0,
      options: ['YouTube', 'YouTube Shorts'],
    },
  },
  setTopic: (topic) => set({ topic }),
  setScript: (script) => set({ script }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setShowOptions: (show) => set({ showOptions: show }),
  updateScriptOption: (key, value) =>
    set((state) => ({
      scriptOptions: {
        ...state.scriptOptions,
        [key]: { ...state.scriptOptions[key as keyof ScriptOptions], value },
      },
    })),
})); 