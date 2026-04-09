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

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [articles] = useState<Article[]>([]);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  function scoreColor(score: number) {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-500";
  }

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
