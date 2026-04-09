import { useState } from "react";
import { Loader2, ImageIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface ImagePrompt {
  id: string;
  type: "cover" | "inline";
  label: string;
  prompt: string;
  generated: boolean;
  placeholder: string;
}

const MOCK_PROMPTS: ImagePrompt[] = [
  { id: "cover", type: "cover", label: "封面图", prompt: "A sleek dark background with two AI chips facing each other, one glowing blue (OpenAI), one glowing red (DeepSeek), dramatic lighting, tech aesthetic, 16:9", generated: false, placeholder: "封面图生成中…" },
  { id: "inline1", type: "inline", label: "数据对比图", prompt: "A clean comparison infographic showing benchmark scores between two AI models, minimalist design, white background", generated: false, placeholder: "数据图生成中…" },
  { id: "inline2", type: "inline", label: "场景插图", prompt: "A person at a laptop late at night, blue screen glow, focused expression, atmospheric photography style", generated: false, placeholder: "场景图生成中…" },
];

interface Step7ImagesProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step7Images({ onNext, onBack }: Step7ImagesProps) {
  const [prompts, setPrompts] = useState(MOCK_PROMPTS);
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setPrompts((prev) => prev.map((p) => p.id === id ? { ...p, generated: true } : p));
      setGenerating(null);
    }, 2500);
  };

  const handleGenerateAll = () => {
    const first = prompts.find((p) => !p.generated);
    if (first) handleGenerate(first.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">配图</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">为文章生成封面和内文配图。</p>
        </div>
        <Button size="sm" variant="primary" onClick={handleGenerateAll} disabled={!!generating || prompts.every((p) => p.generated)}>
          {generating ? "生成中…" : "全部生成"}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={prompt.type === "cover" ? "blue" : "gray"}>
                  {prompt.type === "cover" ? "封面" : "内文"}
                </Badge>
                <span className="text-[12px] font-medium text-[var(--color-near-black)]">{prompt.label}</span>
              </div>
              {!prompt.generated && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleGenerate(prompt.id)}
                  disabled={generating === prompt.id}
                  className="gap-1.5"
                >
                  {generating === prompt.id && <Loader2 size={11} className="animate-spin" />}
                  {generating === prompt.id ? "生成中" : "生成"}
                </Button>
              )}
            </div>

            <p className="text-[11px] text-[var(--color-text-tertiary)] mb-2 leading-relaxed">{prompt.prompt}</p>

            {/* Image placeholder */}
            <div
              className="rounded-[var(--radius-micro)] flex items-center justify-center overflow-hidden"
              style={{ height: prompt.type === "cover" ? 160 : 100, background: "var(--color-btn-light)" }}
            >
              {generating === prompt.id ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">生成中…</span>
                </div>
              ) : prompt.generated ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900">
                  <span className="text-white/40 text-[11px]">图片预览（演示）</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon size={20} className="text-gray-300" />
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">点击生成</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <Button size="md" variant="primary" onClick={onNext}>
          下一步：排版
        </Button>
      </div>
    </div>
  );
}
