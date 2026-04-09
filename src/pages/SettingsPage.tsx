import { useState, useEffect, useRef } from "react";
import { useConfigStore } from "../store/config";
import { api } from "../lib/tauri";
import { open } from "@tauri-apps/plugin-dialog";
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
const IMAGE_PROVIDERS = ["DALL-E 3", "Flux", "自定义", "跳过配图"];
const IMAGE_MODELS: Record<string, string[]> = {
  "DALL-E 3": ["dall-e-3", "dall-e-2"],
  "Flux": ["flux-dev", "flux-pro", "flux-kontext", "flux-schnell"],
  "自定义": [],
};
const ASPECT_RATIOS = ["1:1", "16:9", "4:3", "3:2", "9:16", "3:4", "21:9"];
const WECHAT_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "gpt-4o", "gpt-4o-mini"];

export function SettingsPage() {
  const { setConfig, updateKey } = useConfigStore();

  const [aiProvider, setAiProvider] = useState("Claude (Anthropic)");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [imgProvider, setImgProvider] = useState("DALL-E 3");
  const [imgKey, setImgKey] = useState("");
  const [imgModel, setImgModel] = useState("dall-e-3");
  const [imgBaseUrl, setImgBaseUrl] = useState("");
  const [imgAspectRatio, setImgAspectRatio] = useState("16:9");
  const [accountName, setAccountName] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [contentDirs, setContentDirs] = useState<string[]>([]);
  const [tone, setTone] = useState("轻松幽默");
  const [blacklist, setBlacklist] = useState("");
  const [savePath, setSavePath] = useState("~/Documents/WeWrite");
  const [strictness, setStrictness] = useState<"relaxed" | "standard" | "strict">("standard");
  // Writing parameters
  const [sentenceVariance, setSentenceVariance] = useState(0.7);
  const [paragraphRhythm, setParagraphRhythm] = useState("chaotic");
  const [emotionalArc, setEmotionalArc] = useState("restrained_to_burst");
  const [wordTemperatureBias, setWordTemperatureBias] = useState("balanced");
  const [negativeEmotionFloor, setNegativeEmotionFloor] = useState(0.20);
  const [adverbMaxPer100, setAdverbMaxPer100] = useState(3);
  const [styleDrift, setStyleDrift] = useState(0.6);
  const [brokenSentenceRate, setBrokenSentenceRate] = useState(0.04);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [migrateArticles, setMigrateArticles] = useState(false);
  const [skillPath, setSkillPath] = useState("");
  // Tracks the save path at time of page load — used for migration
  const loadedSavePath = useRef("");
  // Load config from SQLite on mount
  useEffect(() => {
    api.getConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (cfg.ai_provider) setAiProvider(cfg.ai_provider);
        if (cfg.api_key) setApiKey(cfg.api_key);
        if (cfg.base_url) setBaseUrl(cfg.base_url);
        if (cfg.model) setModel(cfg.model);
        if (cfg.app_id) setAppId(cfg.app_id);
        if (cfg.app_secret) setAppSecret(cfg.app_secret);
        if (cfg.img_provider) setImgProvider(cfg.img_provider);
        if (cfg.img_api_key) setImgKey(cfg.img_api_key);
        if (cfg.img_model) setImgModel(cfg.img_model);
        if (cfg.img_base_url) setImgBaseUrl(cfg.img_base_url);
        if (cfg.img_aspect_ratio) setImgAspectRatio(cfg.img_aspect_ratio);
        if (cfg.account_name) setAccountName(cfg.account_name);
        if (cfg.industry) setIndustry(cfg.industry);
        if (cfg.audience) setAudience(cfg.audience);
        if (cfg.content_dirs) setContentDirs(cfg.content_dirs.split(","));
        if (cfg.tone) setTone(cfg.tone);
        if (cfg.blacklist) setBlacklist(cfg.blacklist);
        if (cfg.save_path) {
          setSavePath(cfg.save_path);
          loadedSavePath.current = cfg.save_path;
        }
        if (cfg.strictness) setStrictness(cfg.strictness as "relaxed" | "standard" | "strict");
        if (cfg.sentence_variance) setSentenceVariance(parseFloat(cfg.sentence_variance));
        if (cfg.paragraph_rhythm) setParagraphRhythm(cfg.paragraph_rhythm);
        if (cfg.emotional_arc) setEmotionalArc(cfg.emotional_arc);
        if (cfg.word_temperature_bias) setWordTemperatureBias(cfg.word_temperature_bias);
        if (cfg.negative_emotion_floor) setNegativeEmotionFloor(parseFloat(cfg.negative_emotion_floor));
        if (cfg.adverb_max_per_100) setAdverbMaxPer100(parseInt(cfg.adverb_max_per_100));
        if (cfg.style_drift) setStyleDrift(parseFloat(cfg.style_drift));
        if (cfg.broken_sentence_rate) setBrokenSentenceRate(parseFloat(cfg.broken_sentence_rate));
        if (cfg.skill_path) setSkillPath(cfg.skill_path);
      })
      .catch((e) => setSaveError("加载配置失败：" + e));
  }, [setConfig]);

  const toggleContentDir = (dir: string) =>
    setContentDirs((prev) => prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir]);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.saveConfig({
        ai_provider: aiProvider,
        api_key: apiKey,
        base_url: baseUrl,
        model: model,
        app_id: appId,
        app_secret: appSecret,
        img_provider: imgProvider,
        img_api_key: imgKey,
        img_model: imgModel,
        img_base_url: imgBaseUrl,
        img_aspect_ratio: imgAspectRatio,
        account_name: accountName,
        industry: industry,
        audience: audience,
        content_dirs: contentDirs.join(","),
        tone: tone,
        blacklist: blacklist,
        save_path: savePath,
        strictness: strictness,
        sentence_variance: sentenceVariance.toString(),
        paragraph_rhythm: paragraphRhythm,
        emotional_arc: emotionalArc,
        word_temperature_bias: wordTemperatureBias,
        negative_emotion_floor: negativeEmotionFloor.toString(),
        adverb_max_per_100: adverbMaxPer100.toString(),
        style_drift: styleDrift.toString(),
        broken_sentence_rate: brokenSentenceRate.toString(),
        skill_path: skillPath,
      });
      updateKey("ai_provider", aiProvider);
      updateKey("api_key", apiKey);
      updateKey("base_url", baseUrl);
      updateKey("model", model);
      updateKey("app_id", appId);
      updateKey("app_secret", appSecret);
      updateKey("img_provider", imgProvider);
      updateKey("img_api_key", imgKey);
      updateKey("img_model", imgModel);
      updateKey("img_base_url", imgBaseUrl);
      updateKey("img_aspect_ratio", imgAspectRatio);
      updateKey("account_name", accountName);
      updateKey("industry", industry);
      updateKey("audience", audience);
      updateKey("content_dirs", contentDirs.join(","));
      updateKey("tone", tone);
      updateKey("blacklist", blacklist);
      updateKey("save_path", savePath);
      updateKey("strictness", strictness);
      updateKey("sentence_variance", sentenceVariance.toString());
      updateKey("paragraph_rhythm", paragraphRhythm);
      updateKey("emotional_arc", emotionalArc);
      updateKey("word_temperature_bias", wordTemperatureBias);
      updateKey("negative_emotion_floor", negativeEmotionFloor.toString());
      updateKey("adverb_max_per_100", adverbMaxPer100.toString());
      updateKey("style_drift", styleDrift.toString());
      updateKey("broken_sentence_rate", brokenSentenceRate.toString());
      updateKey("skill_path", skillPath);

      // Run migration if user checked the box and path changed
      if (migrateArticles && loadedSavePath.current && loadedSavePath.current !== savePath) {
        try {
          const result = await api.migrateArticles(loadedSavePath.current, savePath);
          if (result.errors.length > 0) {
            setSaveError(`迁移完成，但有 ${result.errors.length} 个文件迁移失败`);
            setTimeout(() => setSaveError(null), 5000);
          } else {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
          }
        } catch (e) {
          setSaveError("迁移失败: " + String(e));
          setTimeout(() => setSaveError(null), 5000);
        }
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
      // Update loaded path so subsequent saves use the new location
      loadedSavePath.current = savePath;
      setMigrateArticles(false);
    } catch (e) {
      setSaveError(typeof e === "string" ? e : "保存失败，请重试");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold text-[var(--color-near-black)]">设置</h1>
          {saveSuccess && <span className="text-[11px] text-green-600 font-medium">已保存</span>}
          {saveError && <span className="text-[11px] text-red-500">保存失败：{saveError}</span>}
        </div>
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
              <Button size="sm" variant="secondary" onClick={async () => {
                setVerifyStatus("loading");
                setVerifyMsg("");
                try {
                  const result = await api.verifyWechatConnection(appId, appSecret);
                  setVerifyStatus(result.success ? "ok" : "fail");
                  setVerifyMsg(result.message);
                } catch (e) {
                  setVerifyStatus("fail");
                  setVerifyMsg(String(e));
                }
              }} disabled={!appId || !appSecret || verifyStatus === "loading"}>
                {verifyStatus === "loading" ? "验证中…" : "验证连接"}
              </Button>
              {verifyStatus !== "idle" && (
                <span className={`text-[12px] ${verifyStatus === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {verifyMsg}
                </span>
              )}
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
                      onClick={() => {
                        setImgProvider(p);
                        const models = IMAGE_MODELS[p];
                        if (models && models.length > 0) setImgModel(models[0]);
                      }}
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
                <>
                  <Input
                    label="API Key"
                    type="password"
                    value={imgKey}
                    onChange={(e) => setImgKey(e.target.value)}
                  />
                  {imgProvider === "自定义" ? (
                    <Input
                      label="模型名称"
                      value={imgModel}
                      onChange={(e) => setImgModel(e.target.value)}
                      placeholder="输入模型名称，如 flux-schnell"
                    />
                  ) : IMAGE_MODELS[imgProvider] && IMAGE_MODELS[imgProvider].length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[13px] font-medium text-[var(--color-near-black)]">模型</p>
                      <div className="flex flex-wrap gap-2">
                        {IMAGE_MODELS[imgProvider].map((m) => (
                          <button
                            key={m}
                            onClick={() => setImgModel(m)}
                            className={cn(
                              "px-3 py-1.5 text-[12px] rounded-[var(--radius-sm)] border transition-all duration-150 font-mono",
                              imgModel === m
                                ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)] font-medium"
                                : "border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300"
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px] font-medium text-[var(--color-near-black)]">宽高比</p>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar}
                          onClick={() => setImgAspectRatio(ar)}
                          className={cn(
                            "px-3 py-1.5 text-[12px] rounded-[var(--radius-sm)] border transition-all duration-150 font-mono",
                            imgAspectRatio === ar
                              ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)] font-medium"
                              : "border-gray-200 text-[var(--color-text-secondary)] hover:border-gray-300"
                          )}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
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

          {/* Writing Parameters */}
          <Card>
            <Section title="写作参数">
              <div className="flex flex-col gap-4">
                {/* sentence_variance */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[var(--color-near-black)]">句长方差</p>
                    <span className="text-[12px] text-[var(--color-apple-blue)] font-mono">{sentenceVariance.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={sentenceVariance}
                    onChange={(e) => setSentenceVariance(parseFloat(e.target.value))}
                    className="w-full accent-[var(--color-apple-blue)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">越高句长差异越大（对抗AI均匀性检测）</p>
                </div>

                {/* paragraph_rhythm */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[13px] font-medium text-[var(--color-near-black)]">段落节奏</p>
                  <div className="flex gap-2 flex-wrap">
                    {[["structured","匀称"],["wave","波浪"],["chaotic","混乱（推荐）"]].map(([v,label]) => (
                      <button key={v} onClick={() => setParagraphRhythm(v)}
                        className={cn("px-3 py-1.5 text-[12px] rounded border", paragraphRhythm===v ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)]" : "border-gray-200 text-[var(--color-text-secondary)]")}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* emotional_arc */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[13px] font-medium text-[var(--color-near-black)]">情绪弧线</p>
                  <div className="flex gap-2 flex-wrap">
                    {[["flat","平稳"],["gradual","渐升"],["restrained_to_burst","克制→爆发（推荐）"],["volatile","波动"]].map(([v,label]) => (
                      <button key={v} onClick={() => setEmotionalArc(v)}
                        className={cn("px-3 py-1.5 text-[12px] rounded border", emotionalArc===v ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)]" : "border-gray-200 text-[var(--color-text-secondary)]")}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* word_temperature_bias */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[13px] font-medium text-[var(--color-near-black)]">词汇温度</p>
                  <div className="flex gap-2 flex-wrap">
                    {[["cold","偏书面"],["warm","偏口语"],["hot","偏网络"],["balanced","混搭（推荐）"]].map(([v,label]) => (
                      <button key={v} onClick={() => setWordTemperatureBias(v)}
                        className={cn("px-3 py-1.5 text-[12px] rounded border", wordTemperatureBias===v ? "border-[var(--color-apple-blue)] bg-blue-50 text-[var(--color-apple-blue)]" : "border-gray-200 text-[var(--color-text-secondary)]")}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* negative_emotion_floor */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[var(--color-near-black)]">负面情绪最低占比</p>
                    <span className="text-[12px] text-[var(--color-apple-blue)] font-mono">{(negativeEmotionFloor * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.5" step="0.05"
                    value={negativeEmotionFloor}
                    onChange={(e) => setNegativeEmotionFloor(parseFloat(e.target.value))}
                    className="w-full accent-[var(--color-apple-blue)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">AI文本负面情绪仅11-12%，人类25-34%</p>
                </div>

                {/* adverb_max_per_100 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[var(--color-near-black)]">副词密度上限</p>
                    <span className="text-[12px] text-[var(--color-apple-blue)] font-mono">每100字 ≤ {adverbMaxPer100} 个</span>
                  </div>
                  <input
                    type="range" min="1" max="6" step="1"
                    value={adverbMaxPer100}
                    onChange={(e) => setAdverbMaxPer100(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-apple-blue)]"
                  />
                </div>

                {/* style_drift */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[var(--color-near-black)]">段落风格漂移</p>
                    <span className="text-[12px] text-[var(--color-apple-blue)] font-mono">{styleDrift.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={styleDrift}
                    onChange={(e) => setStyleDrift(parseFloat(e.target.value))}
                    className="w-full accent-[var(--color-apple-blue)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">越高各段落语气差异越大（对抗AI风格一致性检测）</p>
                </div>

                {/* broken_sentence_rate */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[var(--color-near-black)]">破句频率</p>
                    <span className="text-[12px] text-[var(--color-apple-blue)] font-mono">{(brokenSentenceRate * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.1" step="0.01"
                    value={brokenSentenceRate}
                    onChange={(e) => setBrokenSentenceRate(parseFloat(e.target.value))}
                    className="w-full accent-[var(--color-apple-blue)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">不完整句/自我纠正的出现频率</p>
                </div>
              </div>
            </Section>
          </Card>

          {/* Skill Path */}
          <Card>
            <Section title="WeWrite Skill 路径">
              <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
                WeWrite skill 目录，用于素材采集（热搜抓取、SEO关键词分析、WebSearch）。<br />
                默认：<code className="font-mono bg-gray-100 px-1 rounded">~/.claude/skills/wewrite/</code>
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={skillPath}
                  onChange={(e) => setSkillPath(e.target.value)}
                  placeholder="~/.claude/skills/wewrite/"
                />
                <Button size="md" variant="secondary" onClick={async () => {
                  const selected = await open({ directory: true, multiple: false });
                  if (selected) setSkillPath(selected as string);
                }}>选择</Button>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                路径下需包含 <code className="font-mono bg-gray-100 px-1 rounded">scripts/</code> 子目录
              </p>
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
                <Button size="md" variant="secondary" onClick={async () => {
                  const selected = await open({ directory: true, multiple: false });
                  if (selected) {
                    setSavePath(selected as string);
                    setMigrateArticles(false); // reset confirmation on new selection
                  }
                }}>选择文件夹</Button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrateArticles}
                  onChange={(e) => setMigrateArticles(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-[12px] text-[var(--color-text-secondary)]">迁移现有文章到新路径</span>
              </label>
            </Section>
          </Card>

        </div>
      </div>
    </div>
  );
}
