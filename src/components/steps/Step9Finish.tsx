import { CheckCircle2, FolderOpen, FileText } from "lucide-react";
import { Button } from "../ui/Button";
import { usePipelineStore } from "../../store/pipeline";
import { api } from "../../lib/tauri";

interface Step9FinishProps {
  onReset: () => void;
}

export function Step9Finish({ onReset }: Step9FinishProps) {
  const { selectedTopic, articleContent, seoData, savedFilePath } = usePipelineStore();

  const title = seoData?.selectedTitle || selectedTopic?.title || "（未知标题）";
  const framework = selectedTopic?.framework || "—";
  const wordCount = articleContent.replace(/\s/g, "").length;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50">
        <CheckCircle2 size={32} className="text-green-500" />
      </div>

      <div className="text-center">
        <h2 className="text-[17px] font-semibold text-[var(--color-near-black)] mb-1.5">文章已完成</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">初稿已生成，可以在草稿箱编辑后发布。</p>
      </div>

      {/* Summary card */}
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-light-bg)] p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <FileText size={16} className="text-[var(--color-apple-blue)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[var(--color-text-tertiary)] mb-0.5">标题</p>
            <p className="text-[13px] font-medium text-[var(--color-near-black)] leading-snug">
              {title}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-200">
          <div className="text-center">
            <p className="text-[18px] font-bold text-[var(--color-near-black)]">
              {wordCount > 0 ? wordCount.toLocaleString() : "—"}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">字数</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-[var(--color-near-black)]">{framework}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">框架</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
          <FolderOpen size={14} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
          <p className="text-[12px] text-[var(--color-text-secondary)] flex-1 truncate">
            {savedFilePath || "本地草稿"}
          </p>
          {savedFilePath && (
            <button
              onClick={() => api.openArticleFolder(savedFilePath)}
              className="text-[12px] text-[var(--color-apple-blue)] hover:underline flex-shrink-0"
            >
              打开文件夹
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="md" variant="secondary" onClick={() => {
          const confirmed = !savedFilePath
            ? window.confirm("草稿未保存，确定要开始新的一篇吗？当前内容会丢失。")
            : window.confirm("确定要开始新的一篇吗？");
          if (confirmed) onReset();
        }}>写下一篇</Button>
      </div>
    </div>
  );
}
