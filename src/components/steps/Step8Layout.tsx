import { useState, useMemo } from "react";
import { Monitor } from "lucide-react";
import { Button } from "../ui/Button";
import { api } from "../../lib/tauri";
import { usePipelineStore } from "../../store/pipeline";

interface Step8LayoutProps {
  onNext: () => void;
  onBack: () => void;
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/<!-- ✏️ 编辑建议：(.+?) -->/g, '<div class="comment">✏️ 编辑建议：$1</div>')
    .replace(/^(?!<[h\duldiv])(?!$)((?:[^\n]+\n?)+)/gm, (_, text) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.startsWith("<")) return text;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .replace(/\n{2,}/g, "\n");
}

export function Step8Layout({ onNext, onBack }: Step8LayoutProps) {
  const { articleContent, selectedTopic, setSavedFilePath } = usePipelineStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewHtml = useMemo(() => {
    const body = markdownToHtml(articleContent || "（文章内容为空）");
    return `
<html>
<head>
<style>
  body { font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1d1d1f; }
  h1 { font-size: 22px; font-weight: 700; line-height: 1.4; margin-bottom: 12px; }
  h2 { font-size: 17px; font-weight: 600; margin: 24px 0 10px; }
  h3 { font-size: 15px; font-weight: 600; margin: 20px 0 8px; }
  p { font-size: 15px; line-height: 1.8; color: #333; margin: 0 0 16px; }
  strong { font-weight: 600; }
  em { font-style: italic; }
  .comment { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; font-size: 13px; color: #92400e; margin: 16px 0; border-radius: 4px; }
</style>
</head>
<body>
${body}
</body>
</html>
    `.trim();
  }, [articleContent]);

  const handleSaveDraft = async () => {
    if (!articleContent || !selectedTopic) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await api.saveArticle(selectedTopic.title, articleContent, selectedTopic.framework);
      setSavedFilePath(result.file_path);
      setSaved(true);
    } catch (e) {
      setSaveError(typeof e === "string" ? e : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">排版 + 发布</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            预览微信排版效果，确认后发布到草稿箱。
            {selectedTopic && <span className="text-[var(--color-text-tertiary)]">（{selectedTopic.title.slice(0, 20)}…）</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)]">
          <Monitor size={13} />
          <span>预览</span>
        </div>
      </div>

      {saveError && (
        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 text-[12px] text-red-600">
          {saveError}
        </div>
      )}

      {!articleContent ? (
        <div className="flex items-center justify-center py-16 text-[13px] text-[var(--color-text-tertiary)]">
          暂无文章内容，请先完成写作步骤。
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-sm)] overflow-hidden border border-gray-200 bg-white"
          style={{ height: 400 }}
        >
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            title="排版预览"
            sandbox="allow-same-origin"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={saving || !articleContent}
          >
            {saving ? "保存中…" : saved ? "已保存草稿" : "保存草稿"}
          </Button>
          <Button size="md" variant="primary" onClick={async () => {
            if (!saved) {
              await handleSaveDraft();
            }
            if (saved) onNext();
          }} disabled={!articleContent}>
            发布到草稿箱
          </Button>
        </div>
      </div>
    </div>
  );
}
