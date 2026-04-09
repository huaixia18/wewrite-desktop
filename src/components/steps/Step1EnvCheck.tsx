import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  status: "checking" | "ok" | "warning" | "error";
  actionLabel?: string;
  actionTarget?: string;
}

interface Step1EnvCheckProps {
  onNext: () => void;
}

const INITIAL_ITEMS: CheckItem[] = [
  { id: "ai_key", label: "AI API Key", description: "Claude / GPT 密钥", status: "checking", actionLabel: "去设置", actionTarget: "/settings" },
  { id: "wechat", label: "微信凭证", description: "AppID + AppSecret", status: "checking", actionLabel: "去设置", actionTarget: "/settings" },
  { id: "image_api", label: "图片 API", description: "DALL-E / Stable Diffusion", status: "checking", actionLabel: "去设置", actionTarget: "/settings" },
  { id: "style_config", label: "风格配置", description: "公众号名称、行业等", status: "checking", actionLabel: "去设置", actionTarget: "/settings" },
];

export function Step1EnvCheck({ onNext }: Step1EnvCheckProps) {
  const [items, setItems] = useState<CheckItem[]>(INITIAL_ITEMS);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Simulate environment check
    const timer = setTimeout(() => {
      setItems([
        { ...INITIAL_ITEMS[0], status: "warning", description: "未配置，将跳过发布" },
        { ...INITIAL_ITEMS[1], status: "warning", description: "未配置，将跳过推送" },
        { ...INITIAL_ITEMS[2], status: "warning", description: "未配置，将跳过配图" },
        { ...INITIAL_ITEMS[3], status: "ok", description: "已加载默认配置" },
      ]);
      setChecked(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const allOk = items.every((i) => i.status === "ok" || i.status === "warning");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">环境检查</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">检查各项服务配置，确保写作流程可以正常运行。</p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]"
          >
            <div className="flex-shrink-0">
              {item.status === "checking" && <Loader2 size={18} className="animate-spin text-gray-400" />}
              {item.status === "ok" && <CheckCircle2 size={18} className="text-green-500" />}
              {item.status === "warning" && <CheckCircle2 size={18} className="text-amber-400" />}
              {item.status === "error" && <XCircle size={18} className="text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[var(--color-near-black)]">{item.label}</span>
                {item.status === "ok" && <Badge variant="green">已配置</Badge>}
                {item.status === "warning" && <Badge variant="yellow">跳过</Badge>}
                {item.status === "error" && <Badge variant="red">错误</Badge>}
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">{item.description}</p>
            </div>
            {item.actionLabel && item.status !== "ok" && checked && (
              <Button size="sm" variant="ghost" className="flex-shrink-0 gap-1">
                {item.actionLabel}
                <ExternalLink size={11} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {checked && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[12px] text-[var(--color-text-tertiary)]">
            {items.filter((i) => i.status === "warning").length > 0
              ? "部分功能未配置，可在设置页完善后重新检查。"
              : "所有配置正常，可以开始写作。"}
          </p>
          <Button variant="primary" size="md" onClick={onNext} disabled={!allOk}>
            开始写作
          </Button>
        </div>
      )}
    </div>
  );
}
