import { useState } from "react";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";

interface Topic {
  id: string;
  title: string;
  score: number;
  framework: string;
  recommended: boolean;
  keywords: string[];
}

const MOCK_TOPICS: Topic[] = [
  { id: "1", title: "DeepSeek R2 发布：国产大模型首次超越 GPT-4o，我们该怎么看？", score: 94, framework: "热点解读", recommended: true, keywords: ["DeepSeek", "大模型", "AI竞争"] },
  { id: "2", title: "用 AI 写作的人越来越多，但真正被看见的还是那些有「自己的声音」的人", score: 89, framework: "纯观点", recommended: true, keywords: ["AI写作", "创作者", "个人品牌"] },
  { id: "3", title: "2025年最值得入手的5款AI工具（真实使用3个月后的感受）", score: 87, framework: "清单型", recommended: false, keywords: ["AI工具", "效率", "测评"] },
  { id: "4", title: "一个普通人如何靠内容创作月入过万？我走访了 10 个真实案例", score: 84, framework: "故事型", recommended: false, keywords: ["内容变现", "创作者经济"] },
  { id: "5", title: "Claude 3.7 vs GPT-4o：写公众号文章，谁更好用？", score: 82, framework: "对比型", recommended: false, keywords: ["Claude", "GPT", "写作助手"] },
  { id: "6", title: "我用 AI 重写了100篇历史公众号文章，数据说明了什么", score: 79, framework: "复盘型", recommended: false, keywords: ["数据分析", "内容优化"] },
  { id: "7", title: "内容创作者最常犯的7个错误（以及我自己踩过的坑）", score: 76, framework: "清单型", recommended: false, keywords: ["内容创作", "经验分享"] },
  { id: "8", title: "为什么你的公众号打开率越来越低？", score: 74, framework: "痛点型", recommended: false, keywords: ["打开率", "公众号运营"] },
  { id: "9", title: "Notion AI 深度体验：它真的能替代你的写作助手吗", score: 71, framework: "对比型", recommended: false, keywords: ["Notion AI", "写作工具"] },
  { id: "10", title: "如何让你的文章在发出3小时内破1000阅读", score: 68, framework: "清单型", recommended: false, keywords: ["传播技巧", "SEO"] },
];

interface Step2TopicsProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step2Topics({ onNext, onBack }: Step2TopicsProps) {
  const [selected, setSelected] = useState<string>(MOCK_TOPICS[0].id);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = () => {
    setRegenerating(true);
    setSelected(MOCK_TOPICS[0].id);
    setTimeout(() => setRegenerating(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">选题</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">基于热点和你的领域，生成了 10 个候选选题。</p>
        </div>
        <Button size="sm" variant="ghost" className="gap-1.5 text-[var(--color-apple-blue)]" onClick={handleRegenerate} disabled={regenerating}>
          {regenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          重新生成
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {regenerating ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-gray-300" />
          </div>
        ) : (
          MOCK_TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelected(topic.id)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-[var(--radius-sm)] text-left transition-all duration-150 border",
              selected === topic.id
                ? "border-[var(--color-apple-blue)] bg-blue-50"
                : "border-transparent bg-[var(--color-light-bg)] hover:border-gray-200"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {topic.recommended && (
                  <Badge variant="blue">推荐</Badge>
                )}
                <Badge variant="gray">{topic.framework}</Badge>
              </div>
              <p className="text-[13px] font-medium text-[var(--color-near-black)] leading-snug">{topic.title}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]">
                  <TrendingUp size={11} />
                  <span>综合评分 {topic.score}</span>
                </div>
                <div className="flex gap-1">
                  {topic.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] text-[var(--color-text-tertiary)] bg-gray-100 px-1.5 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <Button size="md" variant="primary" onClick={onNext}>
          选这个选题
        </Button>
      </div>
    </div>
  );
}
