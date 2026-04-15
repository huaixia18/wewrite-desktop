"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── 步骤定义 ────────────────────────────────────────────────────────────
export const PIPELINE_STEPS = [
  { id: 1, name: "热点抓取", description: "获取实时热点" },
  { id: 2, name: "选题", description: "选择并分析热点" },
  { id: 3, name: "框架", description: "确定文章结构" },
  { id: 4, name: "内容增强", description: "素材采集与增强" },
  { id: 5, name: "写作", description: "AI 生成正文" },
  { id: 6, name: "去AI化", description: "Humanizer 29规则" },
  { id: 7, name: "SEO + 配图", description: "标题摘要与封面" },
  { id: 8, name: "排版发布", description: "预览并推送" },
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export type RunMode = "auto" | "interactive" | "step";
export type RuntimeMode = "unknown" | "live" | "mock" | "fallback";

// ─── 热点数据 ─────────────────────────────────────────────────────────────
export interface Hotspot {
  id: string;
  platform: "weibo" | "toutiao" | "baidu";
  title: string;
  score: number;
  url: string;
  keywords: string[];
  trend: "rising" | "stable" | "fading";
}

// ─── 选题数据 ─────────────────────────────────────────────────────────────
export interface Topic {
  id: string;
  title: string;
  score: number;
  clickPotential: number;
  seoScore: number;
  framework: string;
  keywords: string[];
  reason: string;
}

// ─── 文章数据 ─────────────────────────────────────────────────────────────
export interface Article {
  id?: string;
  title: string;
  content: string;
  htmlContent?: string;
  topic?: Topic;
  framework?: string;
  enhanceStrategy?: string;
  keywords?: string[];
  wordCount?: number;
  compositeScore?: number;
  coverImageUrl?: string;
  coverPrompt?: string;
  seoTitle?: string;
  seoAbstract?: string;
  seoTags?: string[];
  humanizerReport?: HumanizerReport;
  mediaId?: string;
}

// ─── Humanizer 报告 ───────────────────────────────────────────────────────
export interface HumanizerReport {
  hits: HumanizerHit[];
  fixes: number;
  score: number;
  layers: {
    content: number;
    language: number;
    style: number;
  };
}

export interface HumanizerHit {
  ruleId: number;
  name: string;
  layer: "content" | "language" | "style" | "communication" | "filler";
  severity: "high" | "medium" | "low";
  locations: Array<{
    paragraph: number;
    text: string;
    suggested: string;
  }>;
}

// ─── Store ────────────────────────────────────────────────────────────────
interface PipelineState {
  currentStep: number;
  runMode: RunMode;
  isRunning: boolean;

  hotspots: Hotspot[];
  selectedHotspots: Hotspot[];
  hotspotsLoading: boolean;

  topics: Topic[];
  selectedTopic: Topic | null;

  selectedFramework: string | null;
  selectedStrategy: string | null;

  materials: Array<{ title: string; source: string; url: string }>;

  article: Article;

  progressText: string;
  stepDone: boolean;
  runtime: {
    aiMode: RuntimeMode;
    aiProvider: string;
    hotspotMode: RuntimeMode;
    materialsMode: RuntimeMode;
    publishMode: RuntimeMode;
  };
  cloudSyncAt: string | null;

  setCurrentStep: (step: number) => void;
  setRunMode: (mode: RunMode) => void;
  setHotspots: (hotspots: Hotspot[]) => void;
  setHotspotsLoading: (loading: boolean) => void;
  toggleHotspot: (hotspot: Hotspot) => void;
  selectAllHotspots: () => void;
  clearSelectedHotspots: () => void;
  setTopics: (topics: Topic[]) => void;
  setSelectedTopic: (topic: Topic | null) => void;
  setFramework: (framework: string | null) => void;
  setStrategy: (strategy: string | null) => void;
  setMaterials: (materials: PipelineState["materials"]) => void;
  setArticle: (article: Partial<Article>) => void;
  setProgressText: (text: string) => void;
  setRuntime: (runtime: Partial<PipelineState["runtime"]>) => void;
  setCloudSyncAt: (isoTime: string | null) => void;
  markStepDone: () => void;
  startRun: () => void;
  stopRun: () => void;
  resetPipeline: () => void;
  nextStep: () => void;
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      runMode: "auto",
      isRunning: false,
      hotspots: [],
      selectedHotspots: [],
      hotspotsLoading: false,
      topics: [],
      selectedTopic: null,
      selectedFramework: null,
      selectedStrategy: null,
      materials: [],
      article: { title: "", content: "" },
      stepDone: false,
      progressText: "就绪",
      runtime: {
        aiMode: "unknown",
        aiProvider: "未检测",
        hotspotMode: "unknown",
        materialsMode: "unknown",
        publishMode: "unknown",
      },
      cloudSyncAt: null,

      setCurrentStep: (step) => set({ currentStep: step, stepDone: false }),
      setRunMode: (mode) => set({ runMode: mode }),
      setHotspots: (hotspots) => set({ hotspots }),
      setHotspotsLoading: (loading) => set({ hotspotsLoading: loading }),
      toggleHotspot: (hotspot) =>
        set((state) => {
          const exists = state.selectedHotspots.find((h) => h.id === hotspot.id);
          return {
            selectedHotspots: exists
              ? state.selectedHotspots.filter((h) => h.id !== hotspot.id)
              : [...state.selectedHotspots, hotspot],
          };
        }),
      selectAllHotspots: () =>
        set((state) => ({
          selectedHotspots: [...state.hotspots],
        })),
      clearSelectedHotspots: () => set({ selectedHotspots: [] }),
      setTopics: (topics) => set({ topics }),
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      setFramework: (framework) => set({ selectedFramework: framework }),
      setStrategy: (strategy) => set({ selectedStrategy: strategy }),
      setMaterials: (materials) => set({ materials }),
      setArticle: (article) =>
        set((state) => ({ article: { ...state.article, ...article } })),
      setProgressText: (text) => set({ progressText: text }),
      setRuntime: (runtime) =>
        set((state) => ({ runtime: { ...state.runtime, ...runtime } })),
      setCloudSyncAt: (isoTime) => set({ cloudSyncAt: isoTime }),
      markStepDone: () => set({ stepDone: true }),
      startRun: () => set({ isRunning: true }),
      stopRun: () => set({ isRunning: false }),

      nextStep: () => {
        const { currentStep, runMode } = get();
        if (runMode === "step" || runMode === "interactive") {
          return;
        }
        if (currentStep < PIPELINE_STEPS.length) {
          set({ currentStep: currentStep + 1, stepDone: false });
        }
      },

      resetPipeline: () =>
        set({
          currentStep: 1,
          isRunning: false,
          stepDone: false,
          hotspots: [],
          selectedHotspots: [],
          topics: [],
          selectedTopic: null,
          selectedFramework: null,
          selectedStrategy: null,
          materials: [],
          article: { title: "", content: "" },
          progressText: "就绪",
          cloudSyncAt: null,
          runtime: {
            aiMode: "unknown",
            aiProvider: "未检测",
            hotspotMode: "unknown",
            materialsMode: "unknown",
            publishMode: "unknown",
          },
        }),
    }),
    {
      name: "wewrite-pipeline",
      partialize: (state) => ({
        article: state.article,
        selectedFramework: state.selectedFramework,
        selectedStrategy: state.selectedStrategy,
        hotspots: state.hotspots,
        selectedHotspots: state.selectedHotspots,
        cloudSyncAt: state.cloudSyncAt,
      }),
    }
  )
);
