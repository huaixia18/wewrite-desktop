import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Loader2 } from "lucide-react";
import { api, type KeywordResult } from "../../lib/tauri";
import { cn } from "../../lib/utils";
import { usePipelineStore } from "../../store/pipeline";
import { useConfigStore } from "../../store/config";

function generateAltTitles(title: string): string[] {
  const alts: string[] = [];
  // 反问式
  alts.push(title.replace(/[：:]/, "？").replace(/^/, "为什么"));
  // 数字型
  const colonIdx = title.indexOf("：");
  if (colonIdx > 0) {
    alts.push(title.slice(0, colonIdx + 1) + "3个关键点");
  } else {
    alts.push("关于" + title + "，你需要知道的");
  }
  // 悬念型
  alts.push("为什么" + title + "突然火了？");
  // 行动型
  alts.push("如何" + title.replace(/^./, (c) => c));
  // 降调型（去掉最高级/强调词）
  alts.push(title.replace(/[很非常太极度]/g, "比较").replace(/颠覆/g, "聊聊").replace(/必看/g, "看看"));
  return alts.slice(0, 4);
}

function extractTags(title: string): string[] {
  const tagSet = new Set<string>();
  const known: Record<string, string[]> = {
    AI: ["AI", "大模型", "工具"], Claude: ["Claude", "AI", "工具"], GPT: ["GPT", "AI", "工具"],
    DeepSeek: ["DeepSeek", "大模型", "AI"], 写作: ["写作", "效率", "工具"], 工具: ["工具", "效率", "AI"],
    测评: ["测评", "工具", "对比"], 公众号: ["公众号", "运营", "内容"], 创业: ["创业", "商业", "故事"],
    职场: ["职场", "成长", "职业"], 科技: ["科技", "AI", "行业"], 投资: ["投资", "理财", "财经"],
  };
  for (const [key, tags] of Object.entries(known)) {
    if (title.includes(key)) tags.forEach((t) => tagSet.add(t));
  }
  if (tagSet.size < 3) {
    const segments = title.split(/[：、，。？！、\-\/]/).filter((s) => s.length >= 2 && s.length <= 6);
    segments.slice(0, 3).forEach((s) => tagSet.add(s));
  }
  return Array.from(tagSet).slice(0, 5);
}

interface TextAnalysis {
  sentence_count: number;
  word_count: number;
  paragraph_count: number;
  avg_sentence_length: number;
  sentence_length_std_dev: number;
  length_variance_ok: boolean;
}

interface Step6SEOProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step6SEO({ onNext, onBack }: Step6SEOProps) {
  const { selectedTopic, articleContent, seoData, setSeoData } = usePipelineStore();
  const { config } = useConfigStore();

  const title = selectedTopic?.title || "（未选择选题）";
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);
  const [digestText, setDigestText] = useState(seoData?.digest || articleContent.slice(0, 40) || "");
  const [tagList, setTagList] = useState<string[]>(
    seoData?.tags?.length ? seoData.tags : extractTags(title)
  );
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [seoKeywords, setSeoKeywords] = useState<KeywordResult[]>([]);
  const [seoLoading, setSeoLoading] = useState(false);
  const analysisDone = useRef(false);

  // Fetch SEO keywords from Python script
  useEffect(() => {
    if (!selectedTopic?.keywords?.length) return;
    setSeoLoading(true);
    api.seoKeywords(selectedTopic.keywords, selectedTopic.title)
      .then((result) => {
        if (result.success && result.keywords) {
          setSeoKeywords(result.keywords);
          const newTags = result.keywords
            .map((k) => k.keyword)
            .filter((kw) => !tagList.includes(kw))
            .slice(0, 8 - tagList.length);
          if (newTags.length > 0) setTagList((prev) => [...prev, ...newTags]);
        }
      })
      .catch(() => {})
      .finally(() => setSeoLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic?.keywords, selectedTopic?.title]);

  // Fetch text analysis when article content changes
  useEffect(() => {
    if (!articleContent || analysisDone.current) return;
    analysisDone.current = true;
    api.analyzeText(articleContent)
      .then((result) => {
        const data = result as unknown as TextAnalysis;
        setAnalysis(data);
      })
      .catch(() => {
        // Silent fail, checks will use fallback
      });
  }, [articleContent]);

  const titleOptions = [title, ...generateAltTitles(title)];

  const addTag = (tag: string) => {
    if (tag && !tagList.includes(tag) && tagList.length < 8) {
      setTagList((t) => [...t, tag]);
    }
  };

  const removeTag = (tag: string) => setTagList((t) => t.filter((x) => x !== tag));

  const wordCount = articleContent.replace(/\s/g, "").length;
  const h2Count = (articleContent.match(/^## /gm) || []).length;

  // ─── Quality checks per skill Step 5 ─────────────────────────────────────

  // 1. 禁用词扫描
  const forbiddenWords = config.blacklist ? config.blacklist.split(/[,，、]/).filter(Boolean) : [];
  const forbiddenHits = forbiddenWords.filter((w) => articleContent.includes(w));

  // 2. 句长方差（来自 analyzeText）
  const sentenceVarianceOk = analysis?.length_variance_ok ?? (analysis?.sentence_length_std_dev ?? 0) >= 15;

  // 3. 开头钩子（检查前3句是否有悬念/冲突）
  const openingLines = articleContent
    .split(/[。！？\n]/)
    .slice(0, 6)
    .filter((l) => l.trim().length > 3)
    .slice(0, 3);
  const openingWords = openingLines.join("");
  const hasOpeningHook =
    openingWords.includes("？") ||
    openingWords.includes("！") ||
    /[你|我|他]的/.test(openingLines[0] || "") ||
    /\d+/.test(openingWords) || // 数字开头
    openingWords.includes("凌晨") ||
    openingWords.includes("竟然") ||
    openingWords.includes("为什么") ||
    openingWords.includes("说到底") ||
    openingWords.includes("说白了");

  // 4. 编辑锚点
  const hasEditAnchors = articleContent.includes("<!-- ✏️ 编辑建议");

  // 5. H2 数量
  const hasEnoughH2 = h2Count >= 3;

  // 6. 字数
  const hasEnoughWords = wordCount >= 1500;

  // 7. 金句检查（全文是否有感叹号或有力度的句子）
  const hasGoldenLines = /[！？]/.test(articleContent) && (articleContent.match(/[！？]/g) || []).length >= 2;

  // 8. 标题长度
  const titleLenOk = titleOptions[selectedTitleIdx].length >= 5 && titleOptions[selectedTitleIdx].length <= 32;

  // 9. 摘要长度
  const digestLenOk = digestText.length <= 40;

  // 10. 无连续长段落（启发式：检查是否有连续2段各超过200字）
  const paragraphs = articleContent.split(/\n\n+/).filter((p) => p.trim().length > 10);
  const longParagraphs = paragraphs.filter((p) => p.replace(/\s/g, "").length > 200);
  const noConsecutiveLongParagraphs = longParagraphs.length < 2;

  const qualityChecks = [
    { label: "标题长度（5-32字）", pass: titleLenOk },
    { label: "摘要长度（≤40字）", pass: digestLenOk },
    { label: "H2 结构（≥3个）", pass: hasEnoughH2 },
    { label: "正文字数（≥1500字）", pass: hasEnoughWords },
    { label: "句长方差（≥15字）", pass: sentenceVarianceOk, detail: analysis ? `σ=${analysis.sentence_length_std_dev.toFixed(1)}` : null },
    { label: "禁用词（零命中）", pass: forbiddenHits.length === 0, detail: forbiddenHits.length > 0 ? `命中: ${forbiddenHits.join(", ")}` : null },
    { label: "开头钩子（悬念/冲突）", pass: hasOpeningHook },
    { label: "编辑锚点（2-3个）", pass: hasEditAnchors },
    { label: "金句密度（≥2处）", pass: hasGoldenLines },
    { label: "段落节奏（无超长段落）", pass: noConsecutiveLongParagraphs },
  ];

  const passCount = qualityChecks.filter((c) => c.pass).length;
  const totalCount = qualityChecks.length;

  const handleNext = () => {
    setSeoData({
      selectedTitle: titleOptions[selectedTitleIdx],
      digest: digestText,
      tags: tagList,
    });
    onNext();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">SEO + 验证</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">选择标题，完善摘要和标签，检查内容质量。</p>
      </div>

      {/* Title options */}
      <div>
        <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">备选标题</p>
        <div className="flex flex-col gap-2">
          {titleOptions.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTitleIdx(idx)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-[var(--radius-sm)] text-left transition-all duration-150 border",
                selectedTitleIdx === idx
                  ? "border-[var(--color-apple-blue)] bg-blue-50"
                  : "border-transparent bg-[var(--color-light-bg)] hover:border-gray-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors",
                selectedTitleIdx === idx ? "border-[var(--color-apple-blue)] bg-[var(--color-apple-blue)]" : "border-gray-300"
              )} />
              <p className="text-[13px] text-[var(--color-near-black)] leading-snug">{t}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Digest */}
      <Input
        label="摘要"
        value={digestText}
        onChange={(e) => setDigestText(e.target.value)}
        hint={`${digestText.length}/40 字`}
      />

      {/* Tags */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">标签</p>
          {seoLoading && <Loader2 size={11} className="animate-spin text-gray-400" />}
          {!seoLoading && seoKeywords.length > 0 && (
            <span className="text-[11px] text-[var(--color-text-tertiary)]">SEO推荐</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {tagList.map((tag) => (
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
        <input
          placeholder="输入后回车添加标签…"
          className="w-full px-3 py-1.5 text-[13px] bg-[var(--color-light-bg)] border border-gray-200 rounded-[var(--radius-input)] outline-none focus:border-[var(--color-apple-blue)]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTag((e.target as HTMLInputElement).value.trim());
              (e.target as HTMLInputElement).value = "";
            }
          }}
        />
      </div>

      {/* Quality checklist */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">质量检查</p>
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded-full font-medium",
            passCount === totalCount
              ? "bg-green-50 text-green-600"
              : passCount >= totalCount * 0.7
              ? "bg-amber-50 text-amber-600"
              : "bg-red-50 text-red-500"
          )}>
            {passCount}/{totalCount} 通过
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {qualityChecks.map((check) => (
            <div key={check.label} className="flex items-center gap-2">
              <span className={cn("text-[13px]", check.pass ? "text-green-500" : "text-amber-500")}>
                {check.pass ? "✓" : "⚠"}
              </span>
              <span className={cn("text-[12px]", check.pass ? "text-[var(--color-near-black)]" : "text-amber-600")}>
                {check.label}
              </span>
              {check.detail && (
                <span className="text-[11px] text-[var(--color-text-tertiary)]">{check.detail}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <Button size="md" variant="primary" onClick={handleNext}>
          下一步：配图
        </Button>
      </div>
    </div>
  );
}
