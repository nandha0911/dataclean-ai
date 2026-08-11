import { create } from 'zustand';

const useAppStore = create((set) => ({
  currentDataset: null,
  analysisResult: null,
  recommendations: [],
  cleaningHistory: [],
  qualityScore: 0,
  isLoading: false,
  activeTab: 'home',
  sidebarCollapsed: false,
  theme: 'green',
  
  setDataset: (dataset) => set({ currentDataset: dataset }),
  setAnalysis: (analysis) => set({ analysisResult: analysis }),
  setRecommendations: (recs) => set({ recommendations: recs }),
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
