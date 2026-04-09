import { useState } from "react";
import { FileText, Search, FolderOpen, Calendar } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

interface Article {
  id: string;
  title: string;
  date: string;
  wordCount: number;
  framework: string;
  score: number;
}

const MOCK_ARTICLES: Article[] = [
  { id: "1", title: "DeepSeek R2 发布：国产大模型首次超越 GPT-4o，我们该怎么看？", date: "2026-04-08", wordCount: 1842, framework: "热点解读", score: 82 },
  { id: "2", title: "用 AI 写作的人越来越多，但真正被看见的还是那些有「自己的声音」的人", date: "2026-04-05", wordCount: 2103, framework: "纯观点", score: 91 },
  { id: "3", title: "2025年最值得入手的5款AI工具（真实使用3个月后的感受）", date: "2026-04-01", wordCount: 1756, framework: "清单型", score: 78 },
  { id: "4", title: "一个普通人如何靠内容创作月入过万？我走访了 10 个真实案例", date: "2026-03-28", wordCount: 2340, framework: "故事型", score: 88 },
  { id: "5", title: "Claude 3.7 vs GPT-4o：写公众号文章，谁更好用？", date: "2026-03-21", wordCount: 1920, framework: "对比型", score: 85 },
];

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-500";
}

export function HistoryPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_ARTICLES.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-[15px] font-semibold text-[var(--color-near-black)]">历史文章</h1>
        <div className="flex items-center gap-2 w-64">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文章…"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-[var(--color-light-bg)] border border-gray-200 rounded-[var(--radius-input)] outline-none focus:border-[var(--color-apple-blue)] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-tertiary)]">
            <FileText size={32} className="mb-3 opacity-30" />
            <p className="text-[14px]">还没有文章，开始写作吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-w-3xl mx-auto">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="flex items-start gap-4 p-4 rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-card)] hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)] flex items-center justify-center">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-near-black)] leading-snug mb-2 line-clamp-2">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                      <Calendar size={11} />
                      <span>{article.date}</span>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">{article.wordCount} 字</span>
                    <Badge variant="gray">{article.framework}</Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <span className={`text-[18px] font-bold ${scoreColor(article.score)}`}>{article.score}</span>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">质量分</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0 gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FolderOpen size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
