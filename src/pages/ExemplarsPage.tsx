import { useState } from "react";
import { BookOpen, Plus, Trash2, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

interface Exemplar {
  id: string;
  title: string;
  category: string;
  styleScore: number;
  importedAt: string;
}

const MOCK_EXEMPLARS: Exemplar[] = [
  { id: "1", title: "我在 OpenAI 工作了两年，离职后才说的话", category: "hot-take", styleScore: 94, importedAt: "2026-03-15" },
  { id: "2", title: "为什么你看了那么多干货，还是写不出好文章", category: "tech-opinion", styleScore: 89, importedAt: "2026-03-10" },
  { id: "3", title: "那个凌晨三点还在改稿的运营，后来怎么样了", category: "story-emotional", styleScore: 92, importedAt: "2026-03-05" },
];

const CATEGORY_LABELS: Record<string, string> = {
  "hot-take": "热点观点",
  "tech-opinion": "技术评论",
  "story-emotional": "故事情感",
  "list-practical": "清单干货",
  "general": "通用",
};

export function ExemplarsPage() {
  const [exemplars, setExemplars] = useState(MOCK_EXEMPLARS);
  const [search, setSearch] = useState("");

  const handleDelete = (id: string) => setExemplars((prev) => prev.filter((e) => e.id !== id));

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
          <Button size="sm" variant="primary" className="gap-1.5">
            <Plus size={13} />
            导入范文
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-tertiary)]">
            <BookOpen size={32} className="mb-3 opacity-30" />
            <p className="text-[14px] mb-1">还没有范文</p>
            <p className="text-[12px] text-center max-w-xs">导入你已发布的文章，WeWrite 会学习你的写作风格</p>
            <Button size="md" variant="primary" className="mt-4 gap-1.5">
              <Plus size={14} />
              导入第一篇范文
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="p-3 rounded-[var(--radius-sm)] bg-white shadow-[var(--shadow-card)] text-center">
                <p className="text-[22px] font-bold text-[var(--color-near-black)]">{exemplars.length}</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">范文总数</p>
              </div>
              <div className="p-3 rounded-[var(--radius-sm)] bg-white shadow-[var(--shadow-card)] text-center">
                <p className="text-[22px] font-bold text-[var(--color-near-black)]">
                  {Math.round(exemplars.reduce((s, e) => s + e.styleScore, 0) / exemplars.length)}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">平均风格分</p>
              </div>
              <div className="p-3 rounded-[var(--radius-sm)] bg-white shadow-[var(--shadow-card)] text-center">
                <p className="text-[22px] font-bold text-[var(--color-near-black)]">
                  {new Set(exemplars.map((e) => e.category)).size}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">覆盖风格</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">标题</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider w-28">分类</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider w-20">风格分</th>
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
                        <span className="text-[13px] font-semibold text-green-600">{exemplar.styleScore}</span>
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
