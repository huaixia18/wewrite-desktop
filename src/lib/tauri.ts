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
  composite_score?: number;
}

export const api = {
  getConfig: () => invoke<Record<string, string>>("get_config"),
  saveConfig: (updates: Record<string, string | number | boolean>) =>
    invoke<void>("save_config", { updates }),

  listArticles: () => invoke<ArticleMeta[]>("list_articles"),
  openArticleFolder: (filePath: string) =>
    invoke<void>("open_article_folder", { filePath }),
  getDefaultSavePath: () => invoke<string>("get_default_save_path"),
  saveArticle: (
    title: string,
    content: string,
    options?: {
      framework?: string;
      composite_score?: number;
      writing_persona?: string;
      media_id?: string;
      topic_source?: string;
      topic_keywords?: string[];
      enhance_strategy?: string;
      dimensions?: string[];
      closing_type?: string;
      digest?: string;
      tags?: string[];
      word_count?: number;
    }
  ) =>
    invoke<SaveArticleResult>("save_article", {
      params: { title, content, ...options },
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

  writeArticleStreaming: (params: {
    title: string;
    framework: string;
    materials?: MaterialResult[];
    enhance_strategy?: string;
  }) =>
    invoke<{
      article: string;
      word_count: number;
      h2_count: number;
      title: string;
      framework: string;
      persona: string;
    }>("write_article_streaming", { params }),

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

  fetchHotspots: (limit?: number) =>
    invoke<{ success: boolean; hotspots: Hotspot[]; error?: string }>(
      "fetch_hotspots",
      { limit: limit ?? 30 }
    ),

  seoKeywords: (keywords: string[], topic?: string) =>
    invoke<{ success: boolean; keywords: KeywordResult[]; error?: string }>(
      "seo_keywords",
      { keywords, topic }
    ),

  collectMaterials: (
    topic: string,
    framework: string,
    keywords: string[]
  ) =>
    invoke<{
      success: boolean;
      materials: MaterialResult[];
      topic: string;
      error?: string;
    }>("collect_materials", { topic, framework, keywords }),

  humannessScore: (article: string, tier3?: number) =>
    invoke<{
      success: boolean;
      composite_score?: number;
      param_scores?: Record<string, number>;
      issues?: string[];
      suggestions?: string[];
      error?: string;
    }>("humanness_score", { article, tier3 }),

  checkPythonEnv: () =>
    invoke<{
      success: boolean;
      python_version?: string;
      deps_ok?: boolean;
      has_api_key?: boolean;
      message?: string;
    }>("check_python_env"),

  readVisualPrompts: (skillPath?: string) =>
    invoke<{
      success: boolean;
      data?: {
        cover_a?: { name: string; description: string; english_prompt_template: string };
        cover_b?: { name: string; description: string; english_prompt_template: string };
        cover_c?: { name: string; description: string; english_prompt_template: string };
        inline_template?: string;
        image_types?: string[];
        rules?: { aspect_ratio: string; no_text: boolean; min_entities_per_prompt: number };
      };
      error?: string;
    }>("read_visual_prompts", { skillPath }),
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
