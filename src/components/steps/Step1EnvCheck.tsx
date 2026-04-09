import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useConfigStore } from "../../store/config";
import { api } from "../../lib/tauri";

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

export function Step1EnvCheck({ onNext }: Step1EnvCheckProps) {
  const { config, setConfig } = useConfigStore();
  const [items, setItems] = useState<CheckItem[]>([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pythonInfo, setPythonInfo] = useState<{ deps_ok: boolean; python_version?: string } | null>(null);
  const navigate = useNavigate();

  // Load config from SQLite on mount
  useEffect(() => {
    api.getConfig()
      .then((cfg) => setConfig(cfg))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setConfig]);

  // Check Python environment
  useEffect(() => {
    if (!config.skill_path) return;
    api.checkPythonEnv(config.skill_path)
      .then((result) => {
        if (result.success) {
          setPythonInfo({ deps_ok: !!result.deps_ok, python_version: result.python_version });
        }
      })
      .catch(() => {});
  }, [config.skill_path]);

  useEffect(() => {
    if (loading) return;
    const checkItems: CheckItem[] = [
      {
        id: "ai_key",
        label: "AI API Key",
        description: "Claude / GPT 密钥",
        status: config.api_key ? "ok" : "warning",
        ...(config.api_key ? {} : { actionLabel: "去设置", actionTarget: "/settings" }),
      },
      {
        id: "python_env",
        label: "Python 环境",
        description: config.skill_path
          ? pythonInfo
            ? pythonInfo.deps_ok
              ? `Python ${pythonInfo.python_version ?? "未知"}，依赖齐全`
              : "缺少 requests / beautifulsoup4"
            : "检查中…"
          : "未设置 Skill 路径，请在设置页配置",
        status: config.skill_path
          ? pythonInfo
            ? pythonInfo.deps_ok ? "ok" : "warning"
            : "checking"
          : "warning",
        ...(config.skill_path ? {} : { actionLabel: "去设置", actionTarget: "/settings" }),
      },
      {
        id: "wechat",
        label: "微信凭证",
        description: "AppID + AppSecret",
        status: config.app_id && config.app_secret ? "ok" : "warning",
        ...(config.app_id && config.app_secret ? {} : { actionLabel: "去设置", actionTarget: "/settings" }),
      },
      {
        id: "image_api",
        label: "图片 API",
        description: "DALL-E / Stable Diffusion",
        status: config.img_provider === "跳过配图" ? "warning" : config.img_api_key ? "ok" : "warning",
        ...(config.img_api_key ? {} : { actionLabel: "去设置", actionTarget: "/settings" }),
      },
      {
        id: "style_config",
        label: "风格配置",
        description: "公众号名称、行业等",
        status: config.account_name ? "ok" : "warning",
        ...(config.account_name ? {} : { actionLabel: "去设置", actionTarget: "/settings" }),
      },
    ];
    setItems(checkItems);
    setChecked(true);
  }, [config, loading, pythonInfo]);

  const hasAiKey = items.find((i) => i.id === "ai_key")?.status === "ok";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">环境检查</h2>
        <p className="text-[13px] text-[var(--color-text-secondary)]">检查各项服务配置，确保写作流程可以正常运行。</p>
      </div>

      {!checked ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]"
            >
              <div className="flex-shrink-0">
                {item.status === "ok" && <CheckCircle2 size={18} className="text-green-500" />}
                {item.status === "warning" && <CheckCircle2 size={18} className="text-amber-400" />}
                {item.status === "error" && <XCircle size={18} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[var(--color-near-black)]">{item.label}</span>
                  {item.status === "ok" && <Badge variant="green">已配置</Badge>}
                  {item.status === "warning" && <Badge variant="yellow">未配置</Badge>}
                  {item.status === "error" && <Badge variant="red">错误</Badge>}
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
                  {item.status === "ok" ? "已配置" : item.description}
                </p>
              </div>
              {item.actionLabel && item.status !== "ok" && (
                <Button size="sm" variant="ghost" className="flex-shrink-0 gap-1" onClick={() => navigate(item.actionTarget || "/settings")}>
                  {item.actionLabel}
                  <ExternalLink size={11} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {checked && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[12px] text-[var(--color-text-tertiary)]">
            {hasAiKey
              ? items.filter((i) => i.status === "warning").length > 0
                ? "部分功能未配置，可在设置页完善。"
                : "所有配置正常，可以开始写作。"
              : "请先配置 AI API Key 才能继续。"}
          </p>
          <Button variant="primary" size="md" onClick={onNext} disabled={!hasAiKey}>
            开始写作
          </Button>
        </div>
      )}
    </div>
  );
}
