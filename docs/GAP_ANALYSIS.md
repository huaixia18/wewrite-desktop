# WeWrite Desktop vs. 官方 Skill Spec 差距分析

> 生成时间：2026-04-09
> 项目路径：`/Users/huaixia/Desktop/project/AI公众号/wewrite-desktop`
> Skill 路径：`/Users/huaixia/.claude/skills/wewrite/`
> 最后更新：2026-04-10（全部 Critical + Major + Minor 全部修复完成）

---

## 概览

| 严重程度 | 数量 | 已修复 | 说明 |
|----------|------|--------|------|
| Critical | 7 | ✅ 7 | — |
| Major | 6 | ✅ 6 | #8 ✅ #9 ✅ #10 ✅ #11 ✅ #12 ✅ #13 ✅ |
| Minor | 7 | ✅ 7 | #14 ✅ #15 ✅ #16 ✅ #17 ✅ #18 ✅ #19 ✅ #20 ✅ |

---

## Critical 差距（全部已修复 ✅）

---

### 1. Step 5 名称与功能错位 — ✅ 已修复

**Spec 要求：**
- Step 5 = SEO + 验证（标题建议、摘要、标签、质量检查）
- 写作后自带 Step 4.5 自检（内嵌在 Rust pipeline 中，已经实现 ✓）

**修复状态：** 桌面版步骤名称已对齐 Spec：
- Step 4 = 写作
- Step 5 = 去AI化（humanizer）
- Step 6 = SEO + 验证
- Step 7 = 配图
- Step 8 = 排版发布
- Step 9 = 收尾

---

### 2. `seo_keywords.py` 从未调用 — ✅ 已修复

**Spec 要求（Step 5.1）：**
```
python3 {skill_dir}/scripts/seo_keywords.py --json {关键词}
```

**修复状态：**
- `search.rs` 有 `seo_keywords()` 命令（已注册 ✓）
- `Step6SEO.tsx` 在加载时调用 `api.seoKeywords(config.skill_path, keywords)`
- 返回结果填充备选标题和标签列表

---

### 3. `fetch_hotspots.py` 结果从未展示给用户 — ✅ 已修复

**Spec 要求（Step 2.1）：**
```
python3 {skill_dir}/scripts/fetch_hotspots.py --limit 30
```

**修复状态：**
- `search.rs` 有 `fetch_hotspots()` 命令（已注册 ✓）
- `store/pipeline.ts` 有 `hotspots: HotspotData[]` 状态
- `Step2Topics.tsx` 在加载时调用 `api.fetchHotspots(config.skill_path, 30)`
- 热搜数据存储到 store，在选题列表上方显示红色标签芯片（可折叠）

---

### 4. 没有写作人格（writing_persona）选择器 — ✅ 已修复

**Spec 要求（Step 4.2）：**
用户在设置页选择写作人格，5 种：
- `midnight-friend` — 深夜好友
- `industry-observer` — 行业观察者
- `sharp-journalist` — 锐评记者
- `warm-editor` — 温暖编辑
- `cold-analyst` — 冷静研究员

**修复状态：**
- SettingsPage 添加了"写作人格" section，5 个可点击卡片（名称 + 描述）
- 加载/保存 `writing_persona` 配置到 SQLite

---

### 5. 5 个写作参数缺失 — ✅ 已修复

**Spec 要求（WritingConfig，共 13 项）：**

| 参数 | 状态 |
|------|------|
| sentence_variance | ✅ 有 |
| paragraph_rhythm | ✅ 有 |
| word_temperature_bias | ✅ 有 |
| emotional_arc | ✅ 有 |
| negative_emotion_floor | ✅ 有 |
| adverb_max_per_100 | ✅ 有 |
| style_drift | ✅ 有 |
| broken_sentence_rate | ✅ 有 |
| self_correction_rate | ✅ 新增 |
| unexpected_word_rate | ✅ 新增 |
| filler_style | ✅ 新增 |
| tangent_frequency | ✅ 新增 |
| structure_linearity | ✅ 新增 |

**修复状态：** SettingsPage 写作参数 section 已补全全部 13 个控件（slider 或 segmented button）。

---

### 6. `humanness_score.py` 从未执行 — ✅ 已修复

**Spec 要求（Step 5.3）：**
```bash
python3 {skill_dir}/scripts/humanness_score.py {path} --json --tier3 {agent_tier3_score}
```

**修复状态：**
- `search.rs` 添加了 `humanness_score()` 命令
- `Step5Humanizer.tsx` 去AI化完成后，写入临时文件，调用 `api.humannessScore()`
- 分数显示在去AI化页面（绿色 < 30，琥珀色 < 50，红色 ≥ 50）
- `save_article` 时 `composite_score` 写入 SQLite 和 `history.yaml`

---

### 7. `history.yaml` 从未写入 — ✅ 已修复

**Spec 要求（Step 8.1）：**
文章完成后追加记录到 `{skill_dir}/history.yaml`

**修复状态：**
- `articles.rs` 的 `save_article` 成功后将文章元数据追加到 `history.yaml`
- 字段包括：date, title, topic_source, topic_keywords, output_file, framework, enhance_strategy, word_count, media_id, writing_persona, dimensions, closing_type, composite_score, stats: null

---

## Major 差距（全部已修复 ✅）

---

### 8. `exemplar_seeds_text()` 重复注入 prompt — ✅ 已修复

**当前问题：** `pipeline.rs` 第 613 行和第 623 行两次调用 `exemplar_seeds_text()`。

**修复状态：** 重复调用已删除。

---

### 9. 素材采集不自动触发 — ✅ 已修复

**Spec 要求（Step 3.2）：** 进入 Step 3 后，根据选定框架自动采集素材。

**当前状态：** `Step3Framework.tsx` 的 `useEffect` 已在框架选中时自动触发 `handleCollectMaterials()`。

---

### 10. 没有加载范文文件 — ✅ 已修复

**Spec 要求（Step 4.3）：** 读 `references/exemplars/index.yaml`，按 framework category 筛选，取 top 3 注入 prompt。

**修复状态：** `pipeline.rs` 添加了 `exemplar_text()` 函数：
- 尝试读取 `{skill_path}/references/exemplars/index.yaml`
- 按框架类型映射 category（痛点→tech-opinion, 故事→story-emotional, 清单→list-practical, 热点→hot-take）
- 读取匹配的前 3 篇范文文件片段（前 400 字）注入 prompt
- 无匹配时 fallback 到 `exemplar_seeds_text()`

---

### 11. Pipeline mode 未连接行为 — ✅ 已修复

**修复状态：** `PipelinePage.tsx` 实现了 mode 连接：
- `auto` 模式：立即自动前进，不暂停
- `interactive` 模式：在 Step 2（选题）、Step 3（框架）、Step 7（配图）处暂停，显示确认条
- `stepwise` 模式：每步都暂停，显示确认条
- 确认条提供「返回修改」和「确认继续」两个选项

---

### 12. Step 4 UI 未显示 H2 数/人格/配置 — ✅ 已修复

**修复状态：** `Step4Writing.tsx` 提取并显示了 `h2_count`、`persona`、`framework`，done 阶段显示完整元数据。

---

### 13. `composite_score` 从未写入数据库 — ✅ 已修复

**修复状态：** `save_article` 已增加 `composite_score` 参数，INSERT 时填充该字段。

---

## Minor 差距（全部已修复 ✅）

---

### 14. Step 4 无真实 SSE 流式输出 — ✅ 已修复

**修复状态：** 新增 `write_article_streaming` Tauri command，在写作各阶段通过 `app.emit()` 向前端发送 `writing-progress` 事件（phase/article/word_count/h2_count/persona/framework/message）。前端 `Step4Writing.tsx` 通过 `@tauri-apps/api/event::listen()` 接收事件并实时更新 UI（阶段提示 + 文章内容 + 字数统计）。

---

### 15. 无 `playbook.md` 支持 — ✅ 已修复

**修复状态：** `pipeline.rs` 添加了 `playbook_text()` 函数，尝试读取 `{skill_path}/playbook.md`，提取 confidence ≥ 5 的规则注入 prompt。

---

### 16. 无维度随机化 — ✅ 已修复

**修复状态：** `pipeline.rs` 添加了 `dimension_randomization()` 函数，在 5 个维度池各随机激活 1 个选项（使用系统时间 nanos 作为随机种子），结果注入 prompt 的 `## 随机维度` section。

---

### 17. Step 3 未按 recommendScore 自动选框架 — ✅ 已修复

**修复状态：** `Step3Framework.tsx` 中 `defaultFramework` 自动计算 recommendScore 最高的框架，并在 `selectedTopic?.framework` 变化时自动切换选中项。

---

### 18. Step 8 保存时忽略 SEO 数据 — ✅ 已修复

**修复状态：** `Step8Layout` 保存时传入 `seoData.selectedTitle`（覆盖默认标题）、`seoData.digest`、`seoData.tags`；后端 `save_article` 新增 `digest`、`tags` 字段，存入 `articles.seo_metadata` JSON 列和 `history.yaml`。

---

### 19. Step 7 硬编码图片 prompt — ✅ 已修复

**修复状态：** `Step7Images.tsx` 在 mount 时调用 `api.readVisualPrompts(config.skill_path)` 加载 `visual-prompts.md`，提取 cover_a/b/c 模板和 inline_template；Rust `search.rs` 的 `read_visual_prompts()` 命令负责解析 YAML 并返回结构化数据。

---

### 20. 未注入内容增强策略 — ✅ 已修复

**修复状态：** 框架选定后确定增强策略，存入 pipeline store：
- `FRAMEWORK_ENHANCE` 映射：痛点/清单 → `density_boost`，故事/复盘 → `detail_anchoring`，热点/纯观点 → `angle_discovery`，对比 → `real_feel`
- `Step3Framework` 确认框架后调用 `setEnhanceStrategy`
- `Step4Writing` 将 `enhance_strategy` 传入 `write_article_streaming`
- Rust `write_article_internal` 读取参数，prompt 中注入对应增强指导：
  - `density_boost`：各 H2 分散具体工具/步骤/数据
  - `detail_anchoring`：时间锚/数字锚/对话锚/感官锚
  - `real_feel`：真实用户评价和踩坑体验
  - `angle_discovery`：不同观点碰撞和角度锐度

---

## 优先级建议

### 已完成
- #1 Step 命名对齐
- #2 seo_keywords.py 调用
- #3 fetch_hotspots.py 展示
- #4 写作人格选择器
- #5 缺失写作参数补全
- #6 humanness_score 执行
- #7 history.yaml 写入
- #8 exemplar_seeds_text 重复调用
- #9 素材采集自动触发
- #10 exemplar 文件加载
- #11 pipeline mode 连接
- #12 Step 4 UI 显示 H2/人格
- #13 composite_score 写入 DB
- #14 SSE 流式输出
- #15 playbook.md 支持
- #16 维度随机化
- #17 框架自动选择
- #18 Step 8 传入 SEO 数据
- #19 visual-prompts.md
- #20 内容增强策略注入 prompt

**全部 20 个差距均已修复 ✅**

---

## 文件对应关系

| 文件 | 说明 |
|------|------|
| `src-tauri/src/commands/pipeline.rs` | 写作 pipeline（维度/增强/exemplar/playbook/SSE） |
| `src-tauri/src/commands/articles.rs` | 保存文章 + history.yaml |
| `src-tauri/src/commands/search.rs` | hotspots/seo/materials/humanness/visual-prompts |
| `src/pages/PipelinePage.tsx` | mode 连接（auto/interactive/stepwise） |
| `src/pages/SettingsPage.tsx` | 人格和写作参数控件 |
| `src/components/steps/Step2Topics.tsx` | 热搜展示 + 自动选题 |
| `src/components/steps/Step3Framework.tsx` | 框架自动选择 + 素材采集 |
| `src/components/steps/Step4Writing.tsx` | SSE 实时进度 + 元数据显示 |
| `src/components/steps/Step5Humanizer.tsx` | humanness_score 集成 |
| `src/components/steps/Step6SEO.tsx` | seo_keywords 调用 |
| `src/components/steps/Step7Images.tsx` | visual-prompts.md 加载 |
| `src/components/steps/Step8Layout.tsx` | SEO 数据保存 |
| `src/lib/tauri.ts` | API 类型包装 |
| `src/store/pipeline.ts` | 状态管理（增强策略/人格/分数） |
