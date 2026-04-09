# WeWrite Desktop vs. 官方 Skill Spec 差距分析

> 生成时间：2026-04-09
> 项目路径：`/Users/huaixia/Desktop/project/AI公众号/wewrite-desktop`
> Skill 路径：`/Users/huaixia/.claude/skills/wewrite/`

---

## 概览

| 严重程度 | 数量 | 说明 |
|----------|------|------|
| Critical | 7 | 核心功能缺失或严重错位 |
| Major | 6 | 显著功能缺失或行为错误 |
| Minor | 7 | 行为差异或 UX 优化点 |

---

## Critical 差距

---

### 1. Step 5 名称与功能错位

**Spec 要求：**
- Step 5 = SEO + 验证（标题建议、摘要、标签、质量检查）
- 写作后自带 Step 4.5 自检（内嵌在 Rust pipeline 中，已经实现 ✓）

**当前实现：**
- 桌面版 Step 5 = 去AI化（humanizer）
- Step 6 = SEO + 验证
- 顺序颠倒了，SEO 步骤的定位是对的，但命名不准确

**修复方向：**
- 将当前 Step 5（去AI化）改名为"去AI化"或"AI痕迹修复"，确认在写作后立即执行
- Step 6 保持为"SEO + 验证"，确保调用 `seo_keywords.py`

---

### 2. `seo_keywords.py` 从未调用

**Spec 要求（Step 5.1）：**
```
python3 {skill_dir}/scripts/seo_keywords.py --json {关键词}
```
调用结果用于生成备选标题、提取相关关键词、推荐标签。

**当前实现：**
- `search.rs` 有 `seo_keywords()` 命令（已注册 ✓）
- `Step6SEO.tsx` 使用本地正则 `extractTags()` 提取标签，完全绕过了 Python 脚本
- 标题建议也是前端 hardcode，没有来自 SEO 脚本的数据

**修复方向：**
在 `Step6SEO.tsx` 加载时调用：
```typescript
api.seoKeywords(config.skill_path, selectedTopic.keywords)
```
用返回结果填充备选标题和标签列表。

---

### 3. `fetch_hotspots.py` 结果从未展示给用户

**Spec 要求（Step 2.1）：**
```
python3 {skill_dir}/scripts/fetch_hotspots.py --limit 30
```
抓取热搜后**展示给用户**，作为选题的参考背景，再调用 LLM 生成选题。

**当前实现：**
- `search.rs` 有 `fetch_hotspots()` 命令（已注册 ✓）
- `store/pipeline.ts` 有 `hotspots: HotspotData[]` 状态（已添加 ✓）
- `Step2Topics.tsx` 直接调用 `api.runPipelineStep(2)` 出选题，**从未调用 `fetchHotspots()`**
- 热搜数据从未存储到 store，也从未展示

**修复方向：**
在 `Step2Topics` 加载时：
```typescript
const hotResult = await api.fetchHotspots(config.skill_path, 30);
setHotspots(hotResult.hotspots || []);
```
在选题列表上方显示热搜卡片（可折叠），作为选题参考。

---

### 4. 没有写作人格（writing_persona）选择器

**Spec 要求（Step 4.2）：**
用户在设置页选择写作人格，5 种：
- `midnight-friend` — 深夜好友
- `industry-observer` — 行业观察者
- `sharp-journalist` — 锐评记者
- `warm-editor` — 温暖编辑
- `cold-analyst` — 冷静研究员

**当前实现：**
- `pipeline.rs` 读取 `writing_persona` 从配置（存在 ✓）
- `SettingsPage.tsx` **完全没有这个选择器**，所有人格参数硬编码默认值

**修复方向：**
在 SettingsPage 添加"写作人格" section，5 个可点击卡片（名称 + 描述），加载/保存 `writing_persona` 配置。

---

### 5. 5 个写作参数缺失

**Spec 要求（WritingConfig，共 13 项）：**

| 参数 | 当前 UI | 说明 |
|------|---------|------|
| sentence_variance | ✓ 有 | 句长方差 |
| paragraph_rhythm | ✓ 有 | 段落节奏 |
| word_temperature_bias | ✓ 有 | 词汇温度 |
| emotional_arc | ✓ 有 | 情绪弧线 |
| negative_emotion_floor | ✓ 有 | 负面情绪下限 |
| adverb_max_per_100 | ✓ 有 | 副词密度 |
| style_drift | ✓ 有 | 风格漂移 |
| broken_sentence_rate | ✓ 有 | 破句频率 |
| self_correction_rate | ❌ 缺失 | 自我纠正频率 |
| unexpected_word_rate | ❌ 缺失 | 意外用词频率 |
| filler_style | ❌ 缺失 | 填充词风格 |
| tangent_frequency | ❌ 缺失 | 跑题频率 |
| structure_linearity | ❌ 缺失 | 结构线性度 |

**修复方向：**
在 SettingsPage"写作参数" section 添加 5 个控件（slider 或 segmented button），与现有 8 个参数放在一起。

---

### 6. `humanness_score.py` 从未执行

**Spec 要求（Step 5.3）：**
```bash
python3 {skill_dir}/scripts/humanness_score.py {path} --json --tier3 {agent_tier3_score}
```
- 返回 `composite_score`（0-100）
- < 30 → 通过；30-50 → 定向修复；> 50 → DONE_WITH_CONCERNS
- 得分写入 `history.yaml` 和数据库

**当前实现：**
- 完全没有 `humanness_score` Tauri 命令
- `humanizer.rs` 的 AI 分析输出 `hits` 和 `fixed`，不是 spec 的 `composite_score`
- `articles` 表有 `composite_score` 列，但从未写入

**修复方向：**
1. 在 `search.rs` 添加 `humanness_score()` 命令，调用 Python 脚本
2. 在 Step 5（去AI化）完成后，调用此命令获取分数
3. 在 Step 8（收尾）调用 `saveArticle` 时传入 `composite_score`

---

### 7. `history.yaml` 从未写入

**Spec 要求（Step 8.1）：**
文章完成后追加记录到 `{skill_dir}/history.yaml`：
```yaml
- date: "2026-04-09"
  title: "..."
  topic_source: "热点抓取"
  topic_keywords: ["AI", "Agent"]
  output_file: "output/2026-04-09-xxx.md"
  framework: "热点解读"
  enhance_strategy: "angle_discovery"
  word_count: 1850
  media_id: null
  writing_persona: "midnight-friend"
  dimensions:
    - "叙事视角: 第一人称亲历"
    - "情绪基调: 克制冷静"
  closing_type: "trailing_off"
  composite_score: 23
  writing_config_snapshot:
    sentence_variance: 0.7
    ...
  stats: null
```

**当前实现：**
- `saveArticle` 只写 SQLite，从不写 `history.yaml`
- `articles` 表的 `composite_score`、`writing_persona` 列从未填充

**修复方向：**
1. 在 `articles.rs` 添加 `write_history_record()` 命令
2. `saveArticle` 成功后调用它追加到 `history.yaml`
3. 同时回填 `composite_score` 和 `writing_persona` 到 SQLite

---

## Major 差距

---

### 8. `exemplar_seeds_text()` 重复注入 prompt

**当前问题：**
`pipeline.rs` 第 613 行和第 623 行两次调用 `exemplar_seeds_text()`，导致同样内容注入 prompt 两次，浪费 token 且可能混淆 LLM。

**修复：** 删除第 623 行的重复调用，只保留格式字符串模板内的一次。

---

### 9. 素材采集不自动触发

**Spec 要求（Step 3.2）：**
进入 Step 3 后，根据选定框架**自动**采集素材，不需用户手动点击。

**当前实现：**
`Step3Framework.tsx` 的 `useEffect` 只清除素材列表，从不主动调用 `handleCollectMaterials()`。

**修复：**
```typescript
useEffect(() => {
  if (topic && config.skill_path && !confirmed) {
    handleCollectMaterials(); // 自动采集
  }
}, [selectedFramework, topic, config.skill_path]);
```
将"采集素材"按钮改为"重新采集"。

---

### 10. 没有加载范文文件

**Spec 要求（Step 4.3）：**
- 读 `references/exemplars/index.yaml`
- 按 framework category 筛选，取 top 3
- 注入对应 `.md` 文件片段到写作 prompt
- 库为空时才 fallback 到 `exemplar_seeds_text()`

**当前实现：**
- `exemplars.rs` 有 list/import/delete 命令
- `pipeline.rs` **从不读文件系统**，永远用内置的 `exemplar_seeds_text()` 作为 fallback

**修复：**
在 `write_article()` 中尝试读 `{skill_path}/references/exemplars/index.yaml`，匹配 category 后注入对应范文内容，否则 fallback 到 seeds。

---

### 11. Pipeline mode 未连接行为

**Spec 要求：**
- `auto`：跑完所有 Step 不暂停
- `interactive`：在选题/框架/封面处暂停等用户确认
- `stepwise`：每个 Step 后都暂停

**当前实现：**
`store/pipeline.ts` 定义了 `mode` 状态和 `setMode()`，但**没有任何步骤读取它**，全程按固定流程走。

**修复：**
在渲染步骤确认弹窗/按钮的组件中，根据 `mode` 决定：
- `auto`：完成即自动下一步，不显示确认按钮
- `interactive`：在选题、框架、封面处显示确认按钮并等待
- `stepwise`：每步都显示"确认并继续"

---

### 12. Step 4 UI 未显示 H2 数/人格/配置

**Spec 要求（Step 4.4 完成后）：**
显示：字数、H2 数、活跃人格

**当前实现：**
`pipeline.rs` 返回了 `word_count`、`h2_count`、`persona`、`writing_config`，但 `Step4Writing.tsx` 只提取并使用了 `word_count`。

**修复：**
```typescript
const data = result.data as {
  article: string; word_count: number;
  h2_count?: number; persona?: string;
};
// 在 done 阶段显示：
// "框架：{framework} | 人格：{persona} | {h2_count}节 | {word_count}字"
```

---

### 13. `composite_score` 从未写入数据库

**当前问题：**
`articles` 表第 131 列是 `composite_score`，`save_article` 从不写入它。

**修复：**
`save_article` 命令增加可选参数 `composite_score`，INSERT 时填充该字段。

---

## Minor 差距

---

### 14. Step 4 无真实 SSE 流式输出

**Spec**：写作阶段应为真实流式输出。

**当前实现**：前端每 16ms 追加 30 字，本地模拟流式效果。

**影响**：低。当前模拟效果可接受。真实 SSE 需要 Tauri 后端改造。

**修复**（可选）：通过 Tauri event 或 stream command 实现真实流式。

---

### 15. 无 `playbook.md` 支持

**Spec 要求（Step 4.2 优先级链）：**
`playbook.md` (confidence ≥ 5) > persona > exemplar > writing-guide

**当前实现**：从不读取 `playbook.md`。

**修复**：在 `write_article()` 中尝试读 `{skill_path}/playbook.md`，追加高置信度规则到 system prompt。

---

### 16. 无维度随机化

**Spec 要求（Step 4.1）：**
每篇文章随机激活 2-3 个维度池选项：
- 叙事视角：第一人称亲历 / 旁观者分析 / 对话体 / 自问自答
- 时间线：正序 / 倒叙 / 插叙
- 类比域：体育 / 做饭 / 军事 / 恋爱 / 游戏 / 电影
- 情绪基调：克制冷静 / 热血激动 / 讽刺吐槽 / 温暖治愈
- 节奏：短句密集 / 长叙述慢推 / 长短交替

**修复**：在 `write_article()` 中随机选 2-3 个维度注入 prompt。

---

### 17. Step 3 未按 recommendScore 自动选框架

**当前实现**：`selectedFramework = "hotspot"` 硬编码。

**修复**：计算最高 recommendScore，默认选中它。

---

### 18. Step 8 保存时忽略 SEO 数据

**Spec 要求（Step 7.2）**：`publish` 命令接收 `--title`、`--digest`、`--tags`。

**当前实现**：`Step8Layout` 调用 `saveArticle(title, content, framework)`，完全忽略 `seoData`（标题选择、摘要、标签）。

**修复**：
1. `saveArticle` 增加 `digest` 和 `tags` 参数
2. `Step8Layout` 从 `seoData` 取出这些值传入

---

### 19. Step 7 硬编码图片 prompt，未读 `visual-prompts.md`

**Spec 要求（Step 6）**：读 `references/visual-prompts.md` 获取结构化封面和内文配图的提示词模板。

**当前实现**：`Step7Images.tsx` 硬编码英文 prompt 字符串。

**修复**：在 `images.rs` 中读 `{skill_path}/references/visual-prompts.md`，用模板替换硬编码字符串。

---

### 20. 未注入内容增强策略

**Spec 要求（Step 3.2）**：
素材采集时同时提取"增强材料"（角度发现/密度强化/细节锚定/真实体感），注入写作 prompt 并**贯穿全文各 H2**，不只在某一段装饰性出现。

**当前实现**：`collectMaterials` 返回原始素材片段，`write_article` 注入时只作为素材引用，未体现增强策略。

**修复**：
1. `collectMaterials` 返回时附带 `enhanceStrategy` 字段
2. `pipeline store` 增加 `enhanceStrategy` 状态
3. `write_article` 在 prompt 中明确要求分发增强策略内容到各 H2

---

## 优先级建议

### 第一批（Critical，直接影响写作质量）

1. #4 写作人格选择器 — 用户最直观感知
2. #5 5 个缺失写作参数 — 影响文章风格
3. #8 exemplar_seeds_text 重复 — 修复简单，立即修
4. #7 history.yaml 写入 — 数据完整性
5. #12 Step 4 UI 显示 H2/人格 — 提升透明度

### 第二批（Critical，功能正确性）

6. #1 Step 命名对齐 — 减少用户困惑
7. #3 fetch_hotspots 展示 — 选题更有依据
8. #2 seo_keywords 调用 — SEO 数据更准确
9. #9 素材自动采集 — 减少操作步骤

### 第三批（Major，体验提升）

10. #10 exemplar 文件加载
11. #11 pipeline mode 连接
12. #6 humanness_score 执行
13. #13 composite_score 写入 DB
14. #18 Step 8 传入 SEO 数据

### 第四批（Minor，锦上添花）

15. #14 真实 SSE 流式
16. #15 playbook.md 支持
17. #16 维度随机化
18. #17 框架自动选择
19. #19 visual-prompts.md
20. #20 内容增强策略

---

## 文件对应关系

| 文件 | 当前状态 | 需修改 |
|------|----------|--------|
| `src-tauri/src/commands/pipeline.rs` | 主要逻辑 | #8 #10 #15 #16 |
| `src-tauri/src/commands/search.rs` | 已有框架 | #2 #3 #6 |
| `src-tauri/src/commands/articles.rs` | 保存文章 | #7 #13 #18 |
| `src/pages/SettingsPage.tsx` | 缺少人格和参数 | #4 #5 |
| `src/components/steps/Step2Topics.tsx` | 未调用热搜 | #3 |
| `src/components/steps/Step3Framework.tsx` | 手动采集 | #9 |
| `src/components/steps/Step4Writing.tsx` | 未显示元数据 | #12 |
| `src/components/steps/Step6SEO.tsx` | 本地提取标签 | #2 |
| `src/store/pipeline.ts` | 状态不全 | #20 |
