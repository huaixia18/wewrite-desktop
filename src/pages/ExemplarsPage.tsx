import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { api } from "../lib/tauri";

interface Exemplar {
  id: number;
  title: string;
  category: string;
  importedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  "hot-take": "热点观点",
  "tech-opinion": "技术评论",
  "story-emotional": "故事情感",
  "list-practical": "清单干货",
  "general": "通用",
};

export function ExemplarsPage() {
  const [exemplars, setExemplars] = useState<Exemplar[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExemplars();
  }, []);

  const loadExemplars = async () => {
    setLoading(true);
    try {
      const data = await api.listExemplars();
      setExemplars(data.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        importedAt: e.importedAt.slice(0, 10),
      })));
    } catch {
      // DB might not exist yet, show empty
      setExemplars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    // Open file picker via Tauri dialog
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: true,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (!selected) return;
      const files = Array.isArray(selected) ? selected : [selected];
      for (const path of files) {
        const name = path.split("/").pop()?.replace(/\.md$/, "") || "未命名";
        await api.importExemplar(name, "general", path);
      }
      await loadExemplars();
    } catch (e) {
      console.error("导入失败:", e);
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteExemplar(id);
    await loadExemplars();
  };

  const filtered = exemplars.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-[15px] font-semibold text-[var(--color-near-black)]">范文库</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索范文…"
              className="w-52 pl-8 pr-3 py-1.5 text-[13px] bg-[var(--color-light-bg)] border border-gray-200 rounded-[var(--radius-input)] outline-none focus:border-[var(--color-apple-blue)] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <Button size="sm" variant="primary" className="gap-1.5" onClick={handleImport}>
            <Plus size={13} />
            导入范文
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-tertiary)]">
            <BookOpen size={32} className="mb-3 opacity-30" />
            <p className="text-[14px] mb-1">还没有范文</p>
            <p className="text-[12px] text-center max-w-xs">导入你已发布的文章，WeWrite 会学习你的写作风格</p>
            <Button size="md" variant="primary" className="mt-4 gap-1.5" onClick={handleImport}>
              <Plus size={14} />
              导入第一篇范文
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Table */}
            <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">标题</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider w-28">分类</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider w-28">导入时间</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exemplar, i) => (
                    <tr
                      key={exemplar.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? "border-0" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-[13px] text-[var(--color-near-black)] font-medium leading-snug line-clamp-1">
                          {exemplar.title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="gray">{CATEGORY_LABELS[exemplar.category] ?? exemplar.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[12px] text-[var(--color-text-tertiary)]">{exemplar.importedAt}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(exemplar.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
