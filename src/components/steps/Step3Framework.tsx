import { useState, useEffect } from "react";
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { useConfigStore } from "../../store/config";
import { usePipelineStore } from "../../store/pipeline";
import { api, type MaterialResult } from "../../lib/tauri";

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

const FRAMEWORK_LABELS: Record<string, string> = {
  pain: "痛点型",
  story: "故事型",
  list: "清单型",
  compare: "对比型",
  hotspot: "热点解读",
  opinion: "纯观点",
  review: "复盘型",
};

// Framework → content enhancement strategy (per skill spec Step 3.2)
const FRAMEWORK_ENHANCE: Record<string, string> = {
  pain: "density_boost",
  list: "density_boost",
  story: "detail_anchoring",
  review: "detail_anchoring",
  hotspot: "angle_discovery",
  opinion: "angle_discovery",
  compare: "real_feel",
};

interface Step3FrameworkProps {
  onNext: (frameworkId: string) => void;
  onBack: () => void;
}

export function Step3Framework({ onNext, onBack }: Step3FrameworkProps) {
  const { config } = useConfigStore();
  const { selectedTopic, setCollectedMaterials, setEnhanceStrategy } = usePipelineStore();

  // Auto-select: use topic's recommended framework, otherwise highest-scoring
  const defaultFramework = (() => {
    if (selectedTopic?.framework) {
      const matched = Object.entries(FRAMEWORK_LABELS).find(([, v]) => v === selectedTopic.framework);
      if (matched) return matched[0];
    }
    // Fallback: highest recommendScore
    return FRAMEWORKS.reduce((best, fw) =>
      fw.recommendScore > best.recommendScore ? fw : best, FRAMEWORKS[0]).id;
  })();

  const [selectedFramework, setSelectedFramework] = useState<string>(defaultFramework);
  const [collecting, setCollecting] = useState(false);
  const [materials, setMaterials] = useState<MaterialResult[]>([]);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const topic = selectedTopic?.title || "";
  const keywords = selectedTopic?.keywords || [];

  const handleCollectMaterials = async () => {
    if (!config.skill_path || !topic) return;
    setCollecting(true);
    setCollectError(null);
    try {
      const result = await api.collectMaterials(
        config.skill_path,
        topic,
        FRAMEWORK_LABELS[selectedFramework] || selectedFramework,
        keywords
      );
      if (result.success && result.materials) {
        setMaterials(result.materials);
        setCollectedMaterials(result.materials);
      } else {
        setCollectError(result.error || "素材采集失败");
      }
    } catch (e) {
      setCollectError(String(e));
    } finally {
      setCollecting(false);
    }
  };

  // Auto-collect when framework changes and topic is available
  useEffect(() => {
    if (topic && config.skill_path && !confirmed) {
      setMaterials([]);
      setCollectedMaterials([]);
    }
    // Auto-select highest scoring framework when topic changes
    if (selectedTopic?.framework) {
      const matched = Object.entries(FRAMEWORK_LABELS).find(([, v]) => v === selectedTopic.framework);
      if (matched) setSelectedFramework(matched[0]);
    }
  }, [selectedTopic, topic, config.skill_path]);

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const handleNext = () => {
    setEnhanceStrategy(FRAMEWORK_ENHANCE[selectedFramework] || "angle_discovery");
    onNext(selectedFramework);
  };

  const frameworkLabel = FRAMEWORK_LABELS[selectedFramework] || selectedFramework;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">框架 + 素材</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {topic ? `主题：${topic}` : "选择文章结构框架，AI 将采集真实素材后开始写作。"}
        </p>
      </div>

      {/* Framework selection */}
      <div>
        <p className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">选择框架</p>
        <div className="grid grid-cols-2 gap-2">
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw.id}
              onClick={() => { setSelectedFramework(fw.id); setConfirmed(false); }}
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

      {/* Material collection */}
      {topic && config.skill_path && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCollectMaterials}
              disabled={collecting}
              className="gap-1.5"
            >
              {collecting && <Loader2 size={11} className="animate-spin" />}
              {collecting ? "采集中…" : "采集素材"}
            </Button>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              基于「{topic}」+ {frameworkLabel} 框架搜索真实素材
            </span>
          </div>

          {collectError && (
            <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 text-[12px] text-red-600">
              {collectError} — AI 将使用内置知识写作
            </div>
          )}

          {materials.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="green">
                  <CheckCircle2 size={9} /> 已采集 {materials.length} 条素材
                </Badge>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">
                  将注入写作提示词，提升内容真实度
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                {materials.map((mat, i) => (
                  <div key={i} className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)] border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-medium text-[var(--color-near-black)] leading-snug flex-1">
                        {mat.title}
                      </p>
                      {mat.url && (
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-[var(--color-link-blue)] hover:underline"
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed line-clamp-2">
                      {mat.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {topic && !config.skill_path && (
        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
          未配置 WeWrite Skill 路径（设置页），素材采集将使用 AI 内置知识。建议前往设置页填写。
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <div className="flex items-center gap-2">
          {topic && config.skill_path && materials.length > 0 && !confirmed && (
            <Button size="md" variant="secondary" onClick={handleConfirm}>
              确认素材
            </Button>
          )}
          <Button
            size="md"
            variant="primary"
            onClick={handleNext}
            disabled={collecting}
          >
            {topic ? "开始写作" : "下一步"}
          </Button>
        </div>
      </div>
    </div>
  );
}
