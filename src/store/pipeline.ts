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

interface PipelineState {
  steps: PipelineStep[];
  currentStep: number;
  mode: PipelineMode;
  isRunning: boolean;
  articleContent: string;
  setStepStatus: (id: number, status: StepStatus, data?: unknown, error?: string) => void;
  setCurrentStep: (id: number) => void;
  setMode: (mode: PipelineMode) => void;
  setRunning: (running: boolean) => void;
  setArticleContent: (content: string) => void;
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

  reset: () =>
    set({
      steps: initialSteps.map((s) => ({ ...s, status: "pending", data: undefined })),
      currentStep: 1,
      isRunning: false,
      articleContent: "",
    }),
}));
