import { CheckCircle2, FolderOpen, FileText } from "lucide-react";
import { Button } from "../ui/Button";

interface Step9FinishProps {
  onReset: () => void;
}

export function Step9Finish({ onReset }: Step9FinishProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50">
        <CheckCircle2 size={32} className="text-green-500" />
      </div>

      <div className="text-center">
        <h2 className="text-[17px] font-semibold text-[var(--color-near-black)] mb-1.5">文章已完成</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">文章已发布到微信草稿箱，同时保存到本地。</p>
      </div>

      {/* Summary card */}
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-light-bg)] p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <FileText size={16} className="text-[var(--color-apple-blue)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[var(--color-text-tertiary)] mb-0.5">标题</p>
            <p className="text-[13px] font-medium text-[var(--color-near-black)] leading-snug">
              DeepSeek R2 发布：国产大模型首次超越 GPT-4o，我们该怎么看？
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-200">
          <div className="text-center">
            <p className="text-[18px] font-bold text-[var(--color-near-black)]">1,842</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">字数</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-[var(--color-near-black)]">热点解读</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">框架</p>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold text-green-500">82</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">质量评分</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
          <FolderOpen size={14} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
          <p className="text-[12px] text-[var(--color-text-secondary)] truncate flex-1">
            ~/Documents/WeWrite/2026-04-08-deepseek-r2.md
          </p>
          <Button size="sm" variant="ghost">打开文件夹</Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="md" variant="secondary" onClick={onReset}>写下一篇</Button>
        <Button size="md" variant="ghost">查看历史文章</Button>
      </div>
    </div>
  );
}
