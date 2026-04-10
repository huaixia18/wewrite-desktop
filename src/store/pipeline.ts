import { create } from "zustand";

export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";
export type PipelineMode = "auto" | "interactive" | "stepwise";

export interface PipelineStep {
  id: number;
  title: string;
  status: StepStatus;
  data?: unknown;
  error?: string;
}

const STEP_TITLES = [
  "环境检查",
  "选题",
  "框架+素材",
  "写作",
  "去AI化",
  "SEO+验证",
  "配图",
  "排版+发布",
  "收尾",
];

export interface SeoData {
  selectedTitle: string;
  digest: string;
  tags: string[];
}

export interface MaterialResult {
  title: string;
  snippet: string;
  url: string;
}

export interface HotspotData {
  title: string;
  hot?: number;
  source?: string;
  url?: string;
}

interface PipelineState {
  steps: PipelineStep[];
  currentStep: number;
  mode: PipelineMode;
  isRunning: boolean;
  articleContent: string;
  selectedTopic: { title: string; framework: string; keywords?: string[] } | null;
  selectedFramework: string | null;
  savedFilePath: string | null;
  seoData: SeoData | null;
  hotspots: HotspotData[];
  collectedMaterials: MaterialResult[];
  compositeScore: number | null;
  writingPersona: string;
  enhanceStrategy: string;
  setStepStatus: (id: number, status: StepStatus, data?: unknown, error?: string) => void;
  setCurrentStep: (id: number) => void;
  setMode: (mode: PipelineMode) => void;
  setRunning: (running: boolean) => void;
  setArticleContent: (content: string) => void;
  setSelectedTopic: (topic: { title: string; framework: string; keywords?: string[] }) => void;
  setSelectedFramework: (framework: string | null) => void;
  setSavedFilePath: (path: string) => void;
  setSeoData: (data: SeoData) => void;
  setHotspots: (hotspots: HotspotData[]) => void;
  setCollectedMaterials: (materials: MaterialResult[]) => void;
  setCompositeScore: (score: number | null) => void;
  setWritingPersona: (persona: string) => void;
  setEnhanceStrategy: (strategy: string) => void;
  reset: () => void;
}

const initialSteps: PipelineStep[] = STEP_TITLES.map((title, i) => ({
  id: i + 1,
  title,
  status: "pending",
}));

export const usePipelineStore = create<PipelineState>((set) => ({
  steps: initialSteps,
  currentStep: 1,
  mode: "interactive",
  isRunning: false,
  articleContent: "",
  selectedTopic: null,
  savedFilePath: null,
  selectedFramework: null,
  seoData: null,
  hotspots: [],
  collectedMaterials: [],
  compositeScore: null,
  writingPersona: "midnight-friend",
  enhanceStrategy: "",

  setStepStatus: (id, status, data, error) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === id ? { ...s, status, data, error } : s
      ),
    })),

  setCurrentStep: (id) => set({ currentStep: id }),
  setMode: (mode) => set({ mode }),
  setRunning: (isRunning) => set({ isRunning }),
  setArticleContent: (articleContent) => set({ articleContent }),
  setSelectedTopic: (selectedTopic) => set({ selectedTopic }),
  setSelectedFramework: (selectedFramework) => set({ selectedFramework }),
  setSavedFilePath: (savedFilePath) => set({ savedFilePath }),
  setSeoData: (seoData) => set({ seoData }),
  setHotspots: (hotspots) => set({ hotspots }),
  setCollectedMaterials: (materials) => set({ collectedMaterials: materials }),
  setCompositeScore: (compositeScore) => set({ compositeScore }),
  setWritingPersona: (writingPersona) => set({ writingPersona }),
  setEnhanceStrategy: (enhanceStrategy) => set({ enhanceStrategy }),

  reset: () =>
    set({
      steps: initialSteps.map((s) => ({ ...s, status: "pending", data: undefined })),
      currentStep: 1,
      isRunning: false,
      articleContent: "",
      selectedTopic: null,
      savedFilePath: null,
      selectedFramework: null,
      seoData: null,
      hotspots: [],
      collectedMaterials: [],
      compositeScore: null,
      writingPersona: "midnight-friend",
      enhanceStrategy: "",
    }),
}));
