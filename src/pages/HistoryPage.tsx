import { useState, useEffect } from "react";
import { FileText, Search, FolderOpen, Calendar, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { api } from "../lib/tauri";

export function HistoryPage() {
  const [articles, setArticles] = useState<Awaited<ReturnType<typeof api.listArticles>>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFramework, setFilterFramework] = useState<string>("全部");

  useEffect(() => {
    api.listArticles()
      .then(setArticles)
      .catch((e) => setLoadError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const frameworks = ["全部", ...Array.from(new Set(articles.map((a) => a.framework).filter((f): f is string => !!f)))];

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchFw = filterFramework === "全部" || a.framework === filterFramework;
    return matchSearch && matchFw;
  });

  function scoreColor(score: number) {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-amber-600";
    return "text-gray-400";
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-[15px] font-semibold text-[var(--color-near-black)]">历史文章</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文章…"
              className="w-52 pl-8 pr-3 py-1.5 text-[13px] bg-[var(--color-light-bg)] border border-gray-200 rounded-[var(--radius-input)] outline-none focus:border-[var(--color-apple-blue)]"
            />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {!loading && frameworks.length > 1 && (
        <div className="px-6 py-2 border-b border-gray-100 bg-white flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-[var(--color-text-tertiary)] flex-shrink-0">框架：</span>
          {frameworks.map((fw) => (
            <button
              key={fw}
              onClick={() => setFilterFramework(fw)}
              className={`px-2.5 py-1 text-[12px] rounded-full flex-shrink-0 transition-colors ${
                filterFramework === fw
                  ? "bg-[var(--color-apple-blue)] text-white"
                  : "bg-[var(--color-light-bg)] text-[var(--color-text-secondary)] hover:bg-gray-200"
              }`}
            >
              {fw}
            </button>
          ))}
        </div>
      )}

      {/* Article list */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-48 text-[13px] text-red-500 gap-2">
            <p>加载失败：{loadError}</p>
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>重试</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-tertiary)]">
            <FileText size={32} className="mb-3 opacity-30" />
            <p className="text-[14px]">没有符合条件的文章</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-w-3xl mx-auto">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="flex items-start gap-4 p-4 rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-card)] hover:shadow-md transition-shadow"
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
                    {article.word_count && (
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">{article.word_count.toLocaleString()} 字</span>
                    )}
                    {article.framework && <Badge variant="gray">{article.framework}</Badge>}
                  </div>
                </div>
                {article.composite_score != null && (
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-[18px] font-bold ${scoreColor(article.composite_score * 100)}`}>
                      {Math.round(article.composite_score * 100)}
                    </span>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">质量分</p>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0 gap-1"
                  onClick={() => api.openArticleFolder(article.file_path)}
                  title="打开文件夹"
                >
                  <FolderOpen size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
