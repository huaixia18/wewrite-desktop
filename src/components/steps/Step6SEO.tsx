import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";

const TITLE_OPTIONS = [
  { id: "a", title: "DeepSeek R2 发布：国产大模型首次超越 GPT-4o，我们该怎么看？" },
  { id: "b", title: "凌晨两点，我看到了让硅谷沉默的那条微博" },
  { id: "c", title: "用 1/10 的成本打败 GPT-4o，DeepSeek 到底赢在哪里" },
];

const SUGGESTED_TAGS = ["DeepSeek", "大模型", "AI竞争", "国产AI", "技术评测"];

const QUALITY_CHECKS = [
  { label: "标题长度（5-64字节）", pass: true },
  { label: "摘要长度（≤40字）", pass: true },
  { label: "关键词密度（1-3%）", pass: true },
  { label: "H2 结构（≥3个）", pass: true },
  { label: "正文字数（1500-2500字）", pass: false },
];

interface Step6SEOProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step6SEO({ onNext, onBack }: Step6SEOProps) {
  const [selectedTitle, setSelectedTitle] = useState("a");
  const [digest, setDigest] = useState("DeepSeek R2 正式发布，多项基准测试超越 GPT-4o。本文分析数据背后的真实含义。");
  const [tags, setTags] = useState<string[]>(SUGGESTED_TAGS);

  const removeTag = (tag: string) => setTags((t) => t.filter((x) => x !== tag));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">SEO + 验证</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">选择标题，完善摘要和标签，验证内容质量。</p>
      </div>

      {/* Title options */}
      <div>
        <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">备选标题</p>
        <div className="flex flex-col gap-2">
          {TITLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedTitle(opt.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-[var(--radius-sm)] text-left transition-all duration-150 border",
                selectedTitle === opt.id
                  ? "border-[var(--color-apple-blue)] bg-blue-50"
                  : "border-transparent bg-[var(--color-light-bg)] hover:border-gray-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors",
                selectedTitle === opt.id ? "border-[var(--color-apple-blue)] bg-[var(--color-apple-blue)]" : "border-gray-300"
              )} />
              <p className="text-[13px] text-[var(--color-near-black)] leading-snug">{opt.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Digest */}
      <Input
        label="摘要"
        value={digest}
        onChange={(e) => setDigest(e.target.value)}
        hint={`${digest.length}/40 字`}
      />

      {/* Tags */}
      <div>
        <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">标签</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => removeTag(tag)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[var(--color-apple-blue)] text-[12px] hover:bg-blue-100 transition-colors"
            >
              {tag}
              <span className="text-[10px] opacity-60">×</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quality checklist */}
      <div>
        <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">质量检查</p>
        <div className="flex flex-col gap-1.5">
          {QUALITY_CHECKS.map((check) => (
            <div key={check.label} className="flex items-center gap-2">
              <span className={cn("text-[13px]", check.pass ? "text-green-500" : "text-amber-500")}>
                {check.pass ? "✓" : "⚠"}
              </span>
              <span className={cn("text-[12px]", check.pass ? "text-[var(--color-near-black)]" : "text-amber-600")}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <Button size="md" variant="primary" onClick={onNext}>
          下一步：配图
        </Button>
      </div>
    </div>
  );
}
