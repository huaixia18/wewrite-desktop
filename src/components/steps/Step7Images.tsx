import { useState, useMemo, useEffect } from "react";
import { Loader2, ImageIcon, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { api } from "../../lib/tauri";
import { useConfigStore } from "../../store/config";
import { usePipelineStore } from "../../store/pipeline";
import { cn } from "../../lib/utils";

interface CoverVariant {
  id: string;
  label: string;
  description: string;
  strategy: "intuition" | "atmosphere" | "infographic";
  prompt: string;
  imageUrl: string | null;
  error: string | null;
  confirmed: boolean;
}

interface InlineImage {
  id: string;
  h2Label: string;
  paragraphNote: string;
  imageUrl: string | null;
  error: string | null;
  confirmed: boolean;
}

interface VisualPrompts {
  cover_a: { name: string; description: string; english_prompt_template: string };
  cover_b: { name: string; description: string; english_prompt_template: string };
  cover_c: { name: string; description: string; english_prompt_template: string };
  inline_template: string;
  image_types: string[];
  rules: { aspect_ratio: string; no_text: boolean; min_entities_per_prompt: number };
}

interface Step7ImagesProps {
  onNext: () => void;
  onBack: () => void;
}

function buildCoverVariants(topic: string, prompts?: VisualPrompts): CoverVariant[] {
  // Fallback templates if visual-prompts.md not available
  const templateA = prompts?.cover_a?.english_prompt_template
    || `A bold visual metaphor for "${topic}", high impact composition, dramatic contrast, first-glance hook, flat modern illustration, 16:9 aspect ratio, clean space for title text overlay at bottom, no text or letters in image`;
  const templateB = prompts?.cover_b?.english_prompt_template
    || `An atmospheric scene illustration for "${topic}", emotional mood, detailed texture, inviting composition, 16:9 aspect ratio, soft lighting, space for title text overlay, no text in image`;
  const templateC = prompts?.cover_c?.english_prompt_template
    || `Clean infographic illustration about "${topic}", professional data visualization style, minimalist design, 16:9 aspect ratio, clear visual hierarchy, space for title text overlay at top, no text in image`;

  return [
    {
      id: "cover-a",
      label: prompts?.cover_a?.name || "直觉冲击型",
      description: prompts?.cover_a?.description || "用视觉隐喻直接表达文章核心观点，适合热点类、观点类",
      strategy: "intuition",
      prompt: templateA,
      imageUrl: null,
      error: null,
      confirmed: false,
    },
    {
      id: "cover-b",
      label: prompts?.cover_b?.name || "氛围渲染型",
      description: prompts?.cover_b?.description || "营造情绪或场景氛围，适合故事类、情绪类",
      strategy: "atmosphere",
      prompt: templateB,
      imageUrl: null,
      error: null,
      confirmed: false,
    },
    {
      id: "cover-c",
      label: prompts?.cover_c?.name || "信息图表型",
      description: prompts?.cover_c?.description || "用简洁的图形/图标传递信息，适合干货类、清单类",
      strategy: "infographic",
      prompt: templateC,
      imageUrl: null,
      error: null,
      confirmed: false,
    },
  ];
}

export function Step7Images({ onNext, onBack }: Step7ImagesProps) {
  const { config } = useConfigStore();
  const { selectedTopic } = usePipelineStore();

  const topic = selectedTopic?.title || "文章配图";

  const [visualPrompts, setVisualPrompts] = useState<VisualPrompts | null>(null);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [coverVariants, setCoverVariants] = useState<CoverVariant[]>(() => buildCoverVariants(topic));
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([
    { id: "inline-1", h2Label: "配图1", paragraphNote: "第一张内文配图", imageUrl: null, error: null, confirmed: false },
    { id: "inline-2", h2Label: "配图2", paragraphNote: "第二张内文配图", imageUrl: null, error: null, confirmed: false },
  ]);
  const [generatingCovers, setGeneratingCovers] = useState(false);
  const [generatingInline, setGeneratingInline] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"select-cover" | "inline">("select-cover");

  // Load visual-prompts.md (builtin + optional skill_path override)
  useEffect(() => {
    setPromptsLoading(true);
    api.readVisualPrompts(config.skill_path)
      .then((result) => {
        if (result.success && result.data) {
          setVisualPrompts(result.data as VisualPrompts);
          setCoverVariants(buildCoverVariants(topic, result.data as VisualPrompts));
        }
      })
      .catch(() => { /* silent - uses builtin prompts */ })
      .finally(() => setPromptsLoading(false));
  }, [config.skill_path, topic]);

  // Visual anchor (extracted from confirmed cover)
  const visualAnchor = useMemo(() => {
    const confirmed = coverVariants.find((v) => v.confirmed && v.imageUrl);
    if (!confirmed) return null;
    return {
      style: confirmed.strategy === "intuition" ? "bold-illustration" : confirmed.strategy === "atmosphere" ? "atmospheric-scene" : "clean-infographic",
      palette: confirmed.strategy === "intuition" ? "vibrant" : confirmed.strategy === "atmosphere" ? "warm" : "professional",
    };
  }, [coverVariants]);

  const handleGenerateAllCovers = async () => {
    setGeneratingCovers(true);
    const updated = await Promise.all(
      coverVariants.map(async (v) => {
        try {
          // Substitute topic into the template
          const prompt = v.prompt.replace(/\{topic\}/g, topic);
          const result = await api.generateImage(prompt, {
            model: config.img_model || undefined,
            aspectRatio: config.img_aspect_ratio || undefined,
            apiKey: config.img_api_key || undefined,
            baseUrl: config.img_base_url || undefined,
          });
          return { ...v, imageUrl: result.images[0]?.url ?? null, error: null };
        } catch (e) {
          return { ...v, error: String(e) };
        }
      })
    );
    setCoverVariants(updated);
    setGeneratingCovers(false);
  };

  const handleGenerateInline = async (id: string) => {
    const img = inlineImages.find((i) => i.id === id);
    if (!img) return;
    setGeneratingInline((prev) => new Set(prev).add(id));
    try {
      // Use inline_template from visual-prompts.md if available
      const inlineBase = visualPrompts?.inline_template
        || "modern minimalist illustration, 16:9 aspect ratio, no text in image";
      const result = await api.generateImage(
        `${img.paragraphNote} for article "${topic}", ${visualAnchor ? `${visualAnchor.style}, palette: ${visualAnchor.palette}` : inlineBase}`,
        {
          model: config.img_model || undefined,
          aspectRatio: config.img_aspect_ratio || undefined,
          apiKey: config.img_api_key || undefined,
          baseUrl: config.img_base_url || undefined,
        }
      );
      setInlineImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, imageUrl: result.images[0]?.url ?? null, error: null } : i))
      );
    } catch (e) {
      setInlineImages((prev) => prev.map((i) => (i.id === id ? { ...i, error: String(e) } : i)));
    } finally {
      setGeneratingInline((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleConfirmCover = (id: string) => {
    setCoverVariants((prev) => prev.map((v) => ({ ...v, confirmed: v.id === id })));
    setSelectedCover(id);
  };

  const handleNext = () => {
    if (phase === "select-cover") {
      setPhase("inline");
    } else {
      onNext();
    }
  };

  const hasConfirmedCover = coverVariants.some((v) => v.confirmed && v.imageUrl);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">配图</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {phase === "select-cover"
              ? "基于文章内容生成封面，选择满意的一张。"
              : "为内文生成配图，保持视觉风格一致。"}
          </p>
        </div>
        <Badge variant={hasConfirmedCover ? "green" : "gray"}>
          {phase === "select-cover" ? "封面" : "内文配图"}
        </Badge>
      </div>

      {!config.img_api_key && config.img_provider !== "跳过配图" && (
        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
          未配置图片生成 API Key，请前往设置页填写后再生成。
        </div>
      )}

      {/* ── Phase 1: Cover variants ── */}
      {phase === "select-cover" && (
        <>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleGenerateAllCovers}
              disabled={generatingCovers || !config.img_api_key}
              className="gap-1.5"
            >
              {promptsLoading && <Loader2 size={11} className="animate-spin" />}
              {generatingCovers && <Loader2 size={11} className="animate-spin" />}
              {generatingCovers ? "生成中…" : "生成封面"}
            </Button>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              {visualPrompts ? "使用 visual-prompts.md 模板" : "内置模板"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {coverVariants.map((v) => (
              <div key={v.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={v.strategy === "intuition" ? "blue" : v.strategy === "atmosphere" ? "green" : "gray"}>
                    {v.label}
                  </Badge>
                  {v.description && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)] truncate">{v.description}</span>
                  )}
                  {v.confirmed && <Badge variant="green"><Check size={9} /> 已确认</Badge>}
                </div>
                <div
                  className={cn(
                    "rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center",
                    "border-2 transition-all",
                    v.confirmed ? "border-[var(--color-apple-blue)]" : "border-transparent",
                    !v.imageUrl && !v.error && "bg-[var(--color-light-bg)]"
                  )}
                  style={{ height: 160 }}
                >
                  {v.imageUrl ? (
                    <button className="w-full h-full" onClick={() => !generatingCovers && handleConfirmCover(v.id)}>
                      <img src={v.imageUrl} alt={v.label} className="w-full h-full object-cover" />
                    </button>
                  ) : generatingCovers ? (
                    <Loader2 size={20} className="animate-spin text-gray-300" />
                  ) : (
                    <ImageIcon size={20} className="text-gray-300" />
                  )}
                </div>
                {v.error && <p className="text-[11px] text-red-500">{v.error}</p>}
              </div>
            ))}
          </div>

          {selectedCover && (
            <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-green-50 border border-green-200 text-[12px] text-green-700">
              已确认封面：{coverVariants.find((v) => v.id === selectedCover)?.label}，点击下方「下一步」进入内文配图
            </div>
          )}
        </>
      )}

      {/* ── Phase 2: Inline images ── */}
      {phase === "inline" && (
        <>
          {visualAnchor && (
            <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-blue-50 border border-blue-100 text-[12px] text-blue-600">
              视觉锚点已提取：风格={visualAnchor.style}，色调={visualAnchor.palette}。内文配图将保持一致。
            </div>
          )}
          <div className="flex flex-col gap-3">
            {inlineImages.map((img) => {
              const isGenerating = generatingInline.has(img.id);
              return (
                <div key={img.id} className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="gray">{img.h2Label}</Badge>
                      <span className="text-[12px] text-[var(--color-text-secondary)]">{img.paragraphNote}</span>
                      {img.confirmed && <Badge variant="green"><Check size={9} /> 已确认</Badge>}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
                      {visualAnchor
                        ? `${img.paragraphNote}，风格锚定：${visualAnchor.style}`
                        : img.paragraphNote}
                    </p>
                    {img.error && <p className="text-[11px] text-red-500 mt-1">{img.error}</p>}
                  </div>
                  <div
                    className="flex-shrink-0 rounded-[var(--radius-micro)] flex items-center justify-center overflow-hidden border border-gray-200"
                    style={{ width: 100, height: 64, background: "var(--color-btn-light)" }}
                  >
                    {isGenerating ? (
                      <Loader2 size={16} className="animate-spin text-gray-300" />
                    ) : img.imageUrl ? (
                      <img src={img.imageUrl} alt={img.h2Label} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={16} className="text-gray-300" />
                    )}
                  </div>
                  {!img.imageUrl && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleGenerateInline(img.id)}
                      disabled={isGenerating || !config.img_api_key}
                    >
                      {isGenerating ? "生成中" : "生成"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={phase === "inline" ? () => setPhase("select-cover") : onBack}>
          {phase === "inline" ? "上一步" : "上一步"}
        </Button>
        <Button size="md" variant="primary" onClick={handleNext}>
          {phase === "select-cover" ? "下一步：内文配图" : "下一步：排版"}
        </Button>
      </div>
    </div>
  );
}
