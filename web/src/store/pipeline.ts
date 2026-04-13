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
  title: string;           // 拟写标题
  score: number;           // 0-100
  clickPotential: number;   // 点击潜力 1-5
  seoScore: number;         // SEO 评分 1-10
  framework: string;        // 推荐框架
  keywords: string[];
  reason: string;          // 选题理由
}

// ─── 文章数据 ─────────────────────────────────────────────────────────────
export interface Article {
  id?: string;
  title: string;
  content: string;         // Markdown 正文
  htmlContent?: string;    // 微信 HTML
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
  // 当前步骤
  currentStep: number;
  runMode: RunMode;
  isRunning: boolean;

  // 热点数据
  hotspots: Hotspot[];
  hotspotsLoading: boolean;

  // 选题数据
  topics: Topic[];
  selectedTopic: Topic | null;

  // 框架选择
  selectedFramework: string | null;
  selectedStrategy: string | null;

  // 写作素材
  materials: Array<{ title: string; source: string; url: string }>;

  // 文章
  article: Article;

  // 进度文本
  progressText: string;

  // Actions
  setCurrentStep: (step: number) => void;
  setRunMode: (mode: RunMode) => void;
  setHotspots: (hotspots: Hotspot[]) => void;
  setHotspotsLoading: (loading: boolean) => void;
  setTopics: (topics: Topic[]) => void;
  setSelectedTopic: (topic: Topic | null) => void;
  setFramework: (framework: string | null) => void;
  setStrategy: (strategy: string | null) => void;
  setMaterials: (materials: PipelineState["materials"]) => void;
  setArticle: (article: Partial<Article>) => void;
  setProgressText: (text: string) => void;
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
      hotspotsLoading: false,
      topics: [],
      selectedTopic: null,
      selectedFramework: null,
      selectedStrategy: null,
      materials: [],
      article: {
        title: "",
        content: "",
      },
      progressText: "就绪",

      setCurrentStep: (step) => set({ currentStep: step }),
      setRunMode: (mode) => set({ runMode: mode }),
      setHotspots: (hotspots) => set({ hotspots }),
      setHotspotsLoading: (loading) => set({ hotspotsLoading: loading }),
      setTopics: (topics) => set({ topics }),
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      setFramework: (framework) => set({ selectedFramework: framework }),
      setStrategy: (strategy) => set({ selectedStrategy: strategy }),
      setMaterials: (materials) => set({ materials }),
      setArticle: (article) =>
        set((state) => ({ article: { ...state.article, ...article } })),
      setProgressText: (text) => set({ progressText: text }),
      startRun: () => set({ isRunning: true }),
      stopRun: () => set({ isRunning: false }),

      nextStep: () => {
        const { currentStep, runMode } = get();
        if (runMode === "step" || runMode === "interactive") {
          // 逐步/交互模式：停在当前步骤，等用户确认
          return;
        }
        if (currentStep < PIPELINE_STEPS.length) {
          set({ currentStep: currentStep + 1 });
        }
      },

      resetPipeline: () =>
        set({
          currentStep: 1,
          isRunning: false,
          hotspots: [],
          topics: [],
          selectedTopic: null,
          selectedFramework: null,
          selectedStrategy: null,
          materials: [],
          article: { title: "", content: "" },
          progressText: "就绪",
        }),
    }),
    {
      name: "wewrite-pipeline",
      partialize: (state) => ({
        // 只持久化非敏感数据
        article: state.article,
        selectedFramework: state.selectedFramework,
        selectedStrategy: state.selectedStrategy,
      }),
    }
  )
);
