import { useState } from "react";
import { useConfigStore } from "../store/config";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/utils";

const SECTION_CLASS = "flex flex-col gap-4";
const LABEL_CLASS = "text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={SECTION_CLASS}>
      <p className={LABEL_CLASS}>{title}</p>
      {children}
    </div>
  );
}

const CONTENT_DIRS = ["技术科普", "行业观察", "工具测评", "创业故事", "个人成长"];
const TONE_OPTIONS = ["专业严谨", "轻松幽默", "温暖治愈", "犀利直白", "启发思考"];
const AI_PROVIDERS = ["Claude (Anthropic)", "GPT-4o (OpenAI)", "自定义"];
const IMAGE_PROVIDERS = ["DALL-E 3", "Stable Diffusion", "跳过配图"];
const WECHAT_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "gpt-4o", "gpt-4o-mini"];

export function SettingsPage() {
  const { updateKey } = useConfigStore();

  const [aiProvider, setAiProvider] = useState("Claude (Anthropic)");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [imgProvider, setImgProvider] = useState("DALL-E 3");
  const [imgKey, setImgKey] = useState("");
  const [accountName, setAccountName] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [contentDirs, setContentDirs] = useState<string[]>([]);
  const [tone, setTone] = useState("轻松幽默");
  const [blacklist, setBlacklist] = useState("");
  const [savePath, setSavePath] = useState("~/Documents/WeWrite");
  const [strictness, setStrictness] = useState<"relaxed" | "standard" | "strict">("standard");

  const toggleContentDir = (dir: string) =>
    setContentDirs((prev) => prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir]);

  const handleSave = () => {
    updateKey("ai_provider", aiProvider);
    updateKey("api_key", apiKey);
    updateKey("model", model);
    updateKey("account_name", accountName);
    // TODO: invoke save_config
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-[15px] font-semibold text-[var(--color-near-black)]">设置</h1>
        <Button size="sm" variant="primary" onClick={handleSave}>保存</Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto flex flex-col gap-6">

          {/* AI Config */}
          <Card>
            <Section title="AI 配置">
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-[var(--color-near-black)]">Provider</p>
                <div className="flex gap-2">
                  {AI_PROVIDERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAiProvider(p)}
                      className={cn(
                        "px-3 py-1.5 text-[12px] rounded-[var(--radius-sm)] border transition-all duration-150",
                        aiProvider === p
                          ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)] font-medium"
                          : "border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              {aiProvider === "自定义" && (
                <Input
                  label="Base URL"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                />
              )}
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-[var(--color-near-black)]">模型</p>
                <div className="flex flex-wrap gap-2">
                  {WECHAT_MODELS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setModel(m)}
                      className={cn(
                        "px-3 py-1.5 text-[12px] rounded-[var(--radius-sm)] border transition-all duration-150 font-mono",
                        model === m
                          ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)] font-medium"
                          : "border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </Section>
          </Card>

          {/* WeChat */}
          <Card>
            <Section title="微信公众号">
              <Input
                label="AppID"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="wx..."
              />
              <Input
                label="AppSecret"
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="AppSecret"
              />
              <Button size="sm" variant="secondary">验证连接</Button>
            </Section>
          </Card>

          {/* Image */}
          <Card>
            <Section title="图片生成">
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-[var(--color-near-black)]">Provider</p>
                <div className="flex gap-2">
                  {IMAGE_PROVIDERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setImgProvider(p)}
                      className={cn(
                        "px-3 py-1.5 text-[12px] rounded-[var(--radius-sm)] border transition-all duration-150",
                        imgProvider === p
                          ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)] font-medium"
                          : "border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {imgProvider !== "跳过配图" && (
                <Input
                  label="API Key"
                  type="password"
                  value={imgKey}
                  onChange={(e) => setImgKey(e.target.value)}
                />
              )}
            </Section>
          </Card>

          {/* Writing Style */}
          <Card>
            <Section title="写作风格">
              <Input
                label="公众号名称"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="例：科技早知道"
              />
              <Input
                label="行业"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="例：AI / 互联网 / 金融"
              />
              <Input
                label="目标受众"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="例：互联网从业者、25-35岁"
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] font-medium text-[var(--color-near-black)]">内容方向</p>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_DIRS.map((dir) => (
                    <button
                      key={dir}
                      onClick={() => toggleContentDir(dir)}
                      className={cn(
                        "px-2.5 py-1 text-[12px] rounded-full border transition-all duration-150",
                        contentDirs.includes(dir)
                          ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)]"
                          : "border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300"
                      )}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] font-medium text-[var(--color-near-black)]">语气</p>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        "px-2.5 py-1 text-[12px] rounded-full border transition-all duration-150",
                        tone === t
                          ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)]"
                          : "border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="禁忌词（逗号分隔）"
                value={blacklist}
                onChange={(e) => setBlacklist(e.target.value)}
                placeholder="例：绝对,最好,保证"
              />
            </Section>
          </Card>

          {/* Humanizer */}
          <Card>
            <Section title="去AI化强度">
              <div className="flex flex-col gap-2">
                {(["relaxed", "standard", "strict"] as const).map((s) => {
                  const labels = { relaxed: "宽松", standard: "标准", strict: "严格" };
                  const descs = {
                    relaxed: "只修复高置信度的 AI 痕迹，保留更多原始表达",
                    standard: "平衡修复力度与可读性，适合大多数场景",
                    strict: "积极修复所有检测到的 AI 写作模式",
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => setStrictness(s)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-[var(--radius-sm)] text-left border transition-all duration-150",
                        strictness === s
                          ? "border-[var(--color-apple-blue)] bg-blue-50"
                          : "border-transparent bg-[var(--color-light-bg)] hover:border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors",
                        strictness === s ? "border-[var(--color-apple-blue)] bg-[var(--color-apple-blue)]" : "border-gray-300"
                      )} />
                      <div>
                        <p className="text-[13px] font-medium text-[var(--color-near-black)]">{labels[s]}</p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{descs[s]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>
          </Card>

          {/* Save path */}
          <Card>
            <Section title="文章保存路径">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={savePath}
                  className="flex-1 px-3 py-2 text-[13px] text-[var(--color-near-black)] bg-[var(--color-light-bg)] border border-gray-200 rounded-[var(--radius-input)] outline-none font-mono"
                />
                <Button size="md" variant="secondary" onClick={() => setSavePath(savePath)}>选择文件夹</Button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-[12px] text-[var(--color-text-secondary)]">迁移现有文章到新路径</span>
              </label>
            </Section>
          </Card>

        </div>
      </div>
    </div>
  );
}
