import { useState } from "react";
import { Monitor } from "lucide-react";
import { Button } from "../ui/Button";

interface Step8LayoutProps {
  onNext: () => void;
  onBack: () => void;
}

const PREVIEW_HTML = `
<html>
<head>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1d1d1f; }
  h1 { font-size: 22px; font-weight: 700; line-height: 1.3; margin-bottom: 8px; }
  h2 { font-size: 16px; font-weight: 600; margin: 24px 0 8px; }
  p { font-size: 15px; line-height: 1.8; color: #333; margin: 0 0 16px; }
  .lead { color: #555; font-style: italic; }
  .comment { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; font-size: 13px; color: #92400e; margin: 16px 0; }
</style>
</head>
<body>
<h1>DeepSeek R2 发布：国产大模型首次超越 GPT-4o，我们该怎么看？</h1>
<p class="lead">这件事情发生的时候，我正好在刷推特。</p>
<p>凌晨两点，DeepSeek 官方突然发布了一条微博。没有倒计时，没有发布会，就这么丢出来——R2 发布，全面超越 GPT-4o。评论区炸了。</p>
<div class="comment">✏️ 编辑建议：在这里加一句你自己第一次看到这个消息时的感受</div>
<h2>数据说明了什么</h2>
<p>MMLU 上，R2 拿到了 91.3，比 GPT-4o 的 88.7 高了不少。编程能力测评 HumanEval 里，差距更明显，足足高出 6 个百分点。</p>
<p>但数学推理和多语言理解，两家几乎打平。</p>
</body>
</html>
`;

export function Step8Layout({ onNext, onBack }: Step8LayoutProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); }, 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">排版 + 发布</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">预览微信排版效果，确认后发布到草稿箱。</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)]">
          <Monitor size={13} />
          <span>预览</span>
        </div>
      </div>

      {/* Preview iframe */}
      <div
        className="rounded-[var(--radius-sm)] overflow-hidden border border-gray-200 bg-white"
        style={{ height: 400 }}
      >
        <iframe
          srcDoc={PREVIEW_HTML}
          className="w-full h-full border-0"
          title="排版预览"
          sandbox="allow-same-origin"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack}>上一步</Button>
        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? "保存中…" : saved ? "已保存草稿" : "保存草稿"}
          </Button>
          <Button size="md" variant="primary" onClick={onNext}>
            发布到草稿箱
          </Button>
        </div>
      </div>
    </div>
  );
}
