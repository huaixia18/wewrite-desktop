import { invoke } from "@tauri-apps/api/core";

export interface ArticleMeta {
  id: number;
  date: string;
  title: string;
  slug: string;
  framework?: string;
  word_count?: number;
  composite_score?: number;
  writing_persona?: string;
  file_path: string;
  created_at: string;
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

export interface ImageData {
  url: string;
  revised_prompt?: string;
}

export interface GenerateImageResult {
  images: ImageData[];
  raw_response?: string;
}

export interface SaveArticleResult {
  file_path: string;
  id: number;
}

export const api = {
  getConfig: () => invoke<Record<string, string>>("get_config"),
  saveConfig: (updates: Record<string, string | number | boolean>) =>
    invoke<void>("save_config", { updates }),

  listArticles: () => invoke<ArticleMeta[]>("list_articles"),
  openArticleFolder: (filePath: string) =>
    invoke<void>("open_article_folder", { filePath }),
  getDefaultSavePath: () => invoke<string>("get_default_save_path"),
  saveArticle: (title: string, content: string, framework?: string) =>
    invoke<SaveArticleResult>("save_article", {
      params: { title, content, framework },
    }),

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

  generateImage: (
    prompt: string,
    options?: {
      model?: string;
      aspectRatio?: string;
      size?: string;
      apiKey?: string;
      baseUrl?: string;
    }
  ) =>
    invoke<GenerateImageResult>("generate_image", {
      prompt,
      model: options?.model,
      aspectRatio: options?.aspectRatio,
      size: options?.size,
      apiKey: options?.apiKey,
      baseUrl: options?.baseUrl,
    }),

  verifyWechatConnection: (appId: string, appSecret: string) =>
    invoke<{ success: boolean; message: string; access_token?: string }>(
      "verify_wechat_connection",
      { appId, appSecret }
    ),

  migrateArticles: (oldPath: string, newPath: string) =>
    invoke<{ moved: number; skipped: number; errors: string[] }>(
      "migrate_articles",
      { oldPath, newPath }
    ),

  fetchHotspots: (skillPath: string, limit?: number) =>
    invoke<{ success: boolean; hotspots: Hotspot[]; error?: string }>(
      "fetch_hotspots",
      { skillPath, limit: limit ?? 30 }
    ),

  seoKeywords: (skillPath: string, keywords: string[]) =>
    invoke<{ success: boolean; keywords: KeywordResult[]; error?: string }>(
      "seo_keywords",
      { skillPath, keywords }
    ),

  collectMaterials: (
    skillPath: string,
    topic: string,
    framework: string,
    keywords: string[]
  ) =>
    invoke<{
      success: boolean;
      materials: MaterialResult[];
      topic: string;
      query_used?: string;
      error?: string;
    }>("collect_materials", { skillPath, topic, framework, keywords }),

  checkPythonEnv: (skillPath: string) =>
    invoke<{
      success: boolean;
      python_version?: string;
      deps_ok?: boolean;
      has_hotspots_script?: boolean;
      has_seo_script?: boolean;
      error?: string;
    }>("check_python_env", { skillPath }),
};

export interface Hotspot {
  title: string;
  hot?: number;
  source?: string;
  url?: string;
}

export interface KeywordResult {
  keyword: string;
  seo_score?: number;
  related?: string[];
  trending?: string;
  baidu_count?: string;
}

export interface MaterialResult {
  title: string;
  snippet: string;
  url: string;
}
