import { useState } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";

interface Framework {
  id: string;
  name: string;
  description: string;
  recommendScore: number;
}

const FRAMEWORKS: Framework[] = [
  { id: "pain", name: "痛点型", description: "直击读者痛点，提供解决方案", recommendScore: 9 },
  { id: "story", name: "故事型", description: "以真实故事或案例带动情绪", recommendScore: 8 },
  { id: "list", name: "清单型", description: "结构清晰，干货密集，便于收藏", recommendScore: 7 },
  { id: "compare", name: "对比型", description: "两种方案的优劣分析，帮助决策", recommendScore: 7 },
  { id: "hotspot", name: "热点解读", description: "借助热点切入，传播自己的观点", recommendScore: 8 },
  { id: "opinion", name: "纯观点", description: "旗帜鲜明地表达立场，引发讨论", recommendScore: 6 },
  { id: "review", name: "复盘型", description: "回顾一段经历，提炼经验和教训", recommendScore: 7 },
];

interface Material {
  id: string;
  type: "data" | "quote" | "case";
  content: string;
  source: string;
}

const MOCK_MATERIALS: Material[] = [
  { id: "1", type: "data", content: "2024年中国内容创作者市场规模达 4300 亿元，同比增长 23%", source: "艾瑞咨询" },
  { id: "2", type: "quote", content: "「大多数人用 AI 写文章的方式都是错的——他们用 AI 替代思考，而不是替代打字。」", source: "@科技评论员陈明" },
  { id: "3", type: "case", content: "博主「慢慢来也快」通过坚持日更 200 天，从 0 增长到 10 万粉丝", source: "公众号「创作者日报」" },
  { id: "4", type: "data", content: "使用 AI 工具的创作者平均产出效率提高 3.2 倍，但内容打开率下降了 18%", source: "NewRank 2024 报告" },
  { id: "5", type: "case", content: "Substack 上 top 100 作者中，只有 12% 表示使用 AI 辅助创作", source: "Substack 官方数据" },
];

interface Step3FrameworkProps {
  onNext: (frameworkId: string) => void;
  onBack: () => void;
}

export function Step3Framework({ onNext, onBack }: Step3FrameworkProps) {
  const [selectedFramework, setSelectedFramework] = useState<string>("hotspot");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">框架 + 素材</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">选择文章结构框架，已采集到相关素材。</p>
      </div>

      {/* Framework selection */}
      <div>
        <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">选择框架</p>
        <div className="grid grid-cols-2 gap-2">
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw.id}
              onClick={() => setSelectedFramework(fw.id)}
              className={cn(
                "flex items-start gap-2 p-3 rounded-[var(--radius-sm)] text-left transition-all duration-150 border",
                selectedFramework === fw.id
                  ? "border-[var(--color-apple-blue)] bg-blue-50"
                  : "border-transparent bg-[var(--color-light-bg)] hover:border-gray-200"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-medium text-[var(--color-near-black)]">{fw.name}</span>
                  {fw.recommendScore >= 8 && <Badge variant="blue">推荐</Badge>}
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)]">{fw.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Materials */}
      <div>
        <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">采集到的素材</p>
        <div className="flex flex-col gap-2">
          {MOCK_MATERIALS.map((mat) => (
            <div key={mat.id} className="flex items-start gap-2.5 p-3 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]">
              <Badge variant={mat.type === "data" ? "blue" : mat.type === "quote" ? "green" : "yellow"} className="flex-shrink-0 mt-0.5">
                {mat.type === "data" ? "数据" : mat.type === "quote" ? "引述" : "案例"}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[var(--color-near-black)] leading-relaxed">{mat.content}</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">来源: {mat.source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <Button size="md" variant="primary" onClick={() => onNext(selectedFramework)}>
          开始写作
        </Button>
      </div>
    </div>
  );
}
