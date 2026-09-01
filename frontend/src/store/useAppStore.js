import { create } from 'zustand';

const initialTheme = (typeof window !== 'undefined' && localStorage.getItem('DATACLEAN_THEME')) || 'sage';
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialTheme);
}

const useAppStore = create((set) => ({
  currentDataset: null,
  analysisResult: null,
  recommendations: [],
  appliedPipeline: [],
  cleaningHistory: [],
  qualityScore: 0,
  isLoading: false,
  activeTab: 'home',
  sidebarCollapsed: false,
  theme: initialTheme,

  setTheme: (theme) => {
    localStorage.setItem('DATACLEAN_THEME', theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },

  setDataset: (dataset) => set({ currentDataset: dataset }),
  setAnalysis: (analysis) => set({ analysisResult: analysis }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  setAppliedPipeline: (ops) => set({ appliedPipeline: ops }),
  addAppliedOp: (op) => set((state) => ({ appliedPipeline: [...state.appliedPipeline, op] })),
  clearAppliedPipeline: () => set({ appliedPipeline: [] }),
  pushCleaningOp: (op) => set((state) => ({ cleaningHistory: [...state.cleaningHistory, op] })),
  undoCleaningOp: () => set((state) => {
    const newHistory = [...state.cleaningHistory];
    newHistory.pop();
    return { cleaningHistory: newHistory };
  }),
  redoCleaningOp: () => {}, // placeholder
  setLoading: (loading) => set({ isLoading: loading }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

export default useAppStore;
