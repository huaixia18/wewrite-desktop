import { invoke } from "@tauri-apps/api/core";

export interface ArticleMeta {
  id: number;
  date: string;
  title: string;
  slug: string;
  framework?: string;
  wordCount?: number;
  compositeScore?: number;
  writingPersona?: string;
  filePath: string;
  createdAt: string;
}

export interface Exemplar {
  id: number;
  title: string;
  category: string;
  filePath: string;
  sentenceScore?: number;
  importedAt: string;
}

export interface HitLocation {
  paragraphIndex: number;
  sentenceIndex: number;
  original: string;
  suggested: string;
}

export interface HitRecord {
  ruleId: number;
  patternName: string;
  layer: string;
  locations: HitLocation[];
  severity: number;
}

export interface HumanizeResult {
  original: string;
  fixed: string;
  hits: HitRecord[];
  hitCount: number;
}

export interface StepResult {
  step: number;
  status: string;
  data: unknown;
  error?: string;
}

export type Strictness = "relaxed" | "standard" | "strict";

export const api = {
  getConfig: () => invoke<Record<string, string>>("get_config"),
  saveConfig: (updates: Record<string, string | number | boolean>) =>
    invoke<void>("save_config", { updates }),

  listArticles: () => invoke<ArticleMeta[]>("list_articles"),
  openArticleFolder: (filePath: string) =>
    invoke<void>("open_article_folder", { filePath }),
  getDefaultSavePath: () => invoke<string>("get_default_save_path"),

  humanize: (content: string, strictness: Strictness) =>
    invoke<HumanizeResult>("humanize", { content, strictness }),
  analyzeText: (content: string) =>
    invoke<Record<string, unknown>>("analyze_text", { content }),

  listExemplars: () => invoke<Exemplar[]>("list_exemplars"),
  importExemplar: (title: string, category: string, filePath: string) =>
    invoke<number>("import_exemplar", { title, category, filePath }),
  deleteExemplar: (id: number) => invoke<void>("delete_exemplar", { id }),

  runPipelineStep: (step: number, params?: unknown) =>
    invoke<StepResult>("run_pipeline_step", { step, params: params ?? {} }),
};
