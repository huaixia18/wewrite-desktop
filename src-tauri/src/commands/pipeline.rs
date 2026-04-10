use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::Emitter;

use crate::db;

#[derive(Serialize, Deserialize, Debug)]
pub struct StepResult {
    pub step: u8,
    pub status: String,
    pub data: Value,
    pub error: Option<String>,
}

fn load_config() -> Result<std::collections::HashMap<String, String>, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM config")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;
    let mut map = std::collections::HashMap::new();
    for row in rows {
        let (k, v) = row.map_err(|e| e.to_string())?;
        map.insert(k, v);
    }
    Ok(map)
}

fn get_config(key: &str) -> Option<String> {
    load_config().ok()?.get(key).cloned()
}

fn get_config_f64(key: &str, default: f64) -> f64 {
    get_config(key).and_then(|s| s.parse().ok()).unwrap_or(default)
}
fn get_config_usize(key: &str, default: usize) -> usize {
    get_config(key).and_then(|s| s.parse().ok()).unwrap_or(default)
}
fn get_config_bool(key: &str) -> bool {
    get_config(key).map(|s| s == "true" || s == "1").unwrap_or(false)
}

/// Writing configuration loaded from config store
#[derive(Debug, Clone)]
struct WritingConfig {
    sentence_variance: f64,
    paragraph_rhythm: String,
    word_temperature_bias: String,
    emotional_arc: String,
    negative_emotion_floor: f64,
    adverb_max_per_100: usize,
    style_drift: f64,
    broken_sentence_rate: f64,
    self_correction_rate: f64,
    unexpected_word_rate: f64,
    filler_style: String,
    tangent_frequency: String,
    structure_linearity: f64,
}

impl Default for WritingConfig {
    fn default() -> Self {
        Self {
            sentence_variance: 0.7,
            paragraph_rhythm: "chaotic".to_string(),
            word_temperature_bias: "balanced".to_string(),
            emotional_arc: "restrained_to_burst".to_string(),
            negative_emotion_floor: 0.20,
            adverb_max_per_100: 3,
            style_drift: 0.6,
            broken_sentence_rate: 0.04,
            self_correction_rate: 0.02,
            unexpected_word_rate: 0.02,
            filler_style: "mixed".to_string(),
            tangent_frequency: "every_800_chars".to_string(),
            structure_linearity: 0.3,
        }
    }
}

impl WritingConfig {
    fn load() -> Self {
        Self {
            sentence_variance: get_config_f64("sentence_variance", 0.7),
            paragraph_rhythm: get_config("paragraph_rhythm").unwrap_or_else(|| "chaotic".to_string()),
            word_temperature_bias: get_config("word_temperature_bias").unwrap_or_else(|| "balanced".to_string()),
            emotional_arc: get_config("emotional_arc").unwrap_or_else(|| "restrained_to_burst".to_string()),
            negative_emotion_floor: get_config_f64("negative_emotion_floor", 0.20),
            adverb_max_per_100: get_config_usize("adverb_max_per_100", 3),
            style_drift: get_config_f64("style_drift", 0.6),
            broken_sentence_rate: get_config_f64("broken_sentence_rate", 0.04),
            self_correction_rate: get_config_f64("self_correction_rate", 0.02),
            unexpected_word_rate: get_config_f64("unexpected_word_rate", 0.02),
            filler_style: get_config("filler_style").unwrap_or_else(|| "mixed".to_string()),
            tangent_frequency: get_config("tangent_frequency").unwrap_or_else(|| "every_800_chars".to_string()),
            structure_linearity: get_config_f64("structure_linearity", 0.3),
        }
    }
}

/// Call OpenAI-compatible chat completions API
async fn chat_completion(
    system: &str,
    user: &str,
    api_key: &str,
    base_url: Option<&str>,
    model: Option<&str>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let base = base_url.unwrap_or("https://api.openai.com/v1");
    let model_name = model.unwrap_or("gpt-4o");
    let url = format!("{}/chat/completions", base.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model_name,
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": user }
        ],
        "temperature": 0.9,
    });

    let resp = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| format!("读取响应失败: {}", e))?;

    if !status.is_success() {
        return Err(format!("AI API 错误 ({}): {}", status, text));
    }

    let json: Value = serde_json::from_str(&text).map_err(|e| format!("解析失败: {}", e))?;
    json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "AI 未返回内容".to_string())
}

fn extract_json(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.starts_with("```") {
        trimmed
            .lines()
            .skip(1)
            .take_while(|l| !l.trim().starts_with("```"))
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        trimmed.to_string()
    }
}

// ─── Full Writing Guide (inline from references/writing-guide.md) ───────────
fn writing_guide_text() -> &'static str {
    r#"# 写作规范（来自 WeWrite 官方 writing-guide.md）

你是这个公众号的主笔。写的东西要像一个真人编辑写的——有观点、有个性、有瑕疵感。

## 反检测规范：统计层面（AI 检测器最敏感的维度）

### 1.1 句长方差 ≥ 15字标准差
- 全文句长标准差 ≥ 15 字（很短和很长句子共存）
- 3字短句必须紧邻40+字长句出现（制造落差）
- 禁止连续3句以上长度接近（±5字）
- 每500字至少1个单句段落（1-5字，如"嗯。"/"两年，10倍。"/"不对。"）

### 1.2 词汇温度分布（4个温度带必须同时出现）
- 冷（书面/专业，25-35%）：边际效应递减、认知负荷、信息不对称、路径依赖
- 温（日常口语，35-45%）：说白了、其实吧，真不是我吹、懂的都懂
- 热（网络/俚语，10-20%）：DNA动了、格局打开、遥遥领先、卷不动了
- 野（方言/粗粝，5-15%）：整挺好、不靠谱、瞎折腾、搁这儿呢、糊弄学
- 关键：同一段内混搭，不要每种温度各写一段
- 抽查任意连续500字，至少包含3种温度

### 1.3 段落长度节奏
- 禁止连续2个长度接近（±20字）的段落
- 长段落不超过150字
- 穿插1句话的短段落（强调、转折、吐槽）

### 1.4 情绪极性分布（关键规则）
- 全文负面情绪表达（吐槽、质疑、不满、担忧）≥ 20%
- 中性陈述占比 ≤ 60%
- 至少2处明确的负面情绪段落（"这太扯了"/"说实话我很失望"级别）
- 情绪弧线：开头克制 → 中间爆发 → 允许犹豫 → 结尾不工整
- 禁止全文保持同一情绪强度（平铺直叙是AI最大特征）

### 1.5 副词密度控制
- 每100字副词不超过3个
- 避免连续两句都以副词开头
- 替换策略："非常快速地增长" → "三个月翻了一番"

### 1.6 段落间风格漂移
- style_drift > 0时，每个H2段落的语气/正式度要有差异
- 避免全文用同一语气写完

## 反检测规范：语言层面

### 2.1 禁用词（零容忍）
禁止出现：众所周知、毋庸置疑、值得注意的是、不得不提、总的来说、事实上、相信大家都有所了解、这是一个不争的事实

### 2.2 破句/不完整句
- broken_sentence_rate > 0时，文章要有1-2处不完整句子
- 示例："不对，准确说是……"/"等等，我刚才说的可能……"/"嗯。"

### 2.3 意外用词
- unexpected_word_rate > 0时，偶尔用非常规但说得通的表达
- 示例："这件事变了"/"整个人都麻了"/"整挺好"

### 2.4 跑题频率
- 根据 tangent_frequency 设置，每500-1200字允许一个轻微跑题段落
- 跑题要像人发呆或想起别的事，不要刻意

### 2.5 连贯性（结构线性度）
- structure_linearity < 1时，允许轻微跳跃、倒叙、插叙
- 但整体逻辑链要清晰

## 反检测规范：内容层面

### 3.1 真实素材锚定
- 每个H2至少1条真实素材（具体数字、案例、引述）
- 禁止空洞表述（"建议大家多关注"等废话）

### 3.2 具体性
- 每500字≥2处具体细节（工具名、参数、时间、人名等）

### 3.3 金句
- 全文至少1句可独立截图转发的句子（≤20字，有观点）
- 金句特征：短、有态度、能传播

## 收尾多样性（6种人类收尾模式）
根据文章走到结尾时的情绪，自行判断最自然的收尾：
1. 自然断流：像聊天说到一半停了（"我先睡了"/"就这样吧"）
2. 未答之问：以问题结尾，不给答案
3. 场景回扣：回到开头的意象/场景
4. 硬切：最后一个论点说完直接结束，无收束语
5. 反结论：明确拒绝给结论（"我也不知道"/"答案可能不存在"）
6. 画面定格：用一个视觉画面收束

禁止总结式收尾："让我们拭目以待"/"未来可期"/"综上所述"

## 禁止清单
- 连续文章使用相同收尾结构
- 每段末尾都用反问句
- 口语词匀速分布（不要每200字准时出现一个"讲真"）
"#
}

// ─── Persona definitions (inline from personas/*.yaml) ──────────────────────
fn persona_text(persona_name: &str) -> String {
    match persona_name {
        "midnight-friend" => r#"
## 写作人格：深夜好友
- voice_density: 1.0（每段都有"我"）
- uncertainty_rate: 0.15
- data_reaction_style: "先写看到数据的场景和反应，再写数据"
- paragraph_max_length: 60字
- single_sentence_paragraph_rate: 25%
- emotional_arc: "克制→爆发"
- opening_style: "以一个私人时刻开头（凌晨一点多……）"
- closing_tendency: "自然断流，聊天式结尾"
- 自我质疑模板：("但我也不确定"/"也许我想多了"/"这个判断我只有六七成把握"/"我承认我也看不清楚")
- 破句风格：超短单句("嗯。")/自我打断/破折悬念/反问独白
- 禁止：总结性收尾/平铺直叙/报告式数据罗列/每段首句承接上段
"#.to_string(),
        "industry-observer" => r#"
## 写作人格：行业观察者
- voice_density: 0.6（适度出现）
- uncertainty_rate: 0.08
- data_reaction_style: "先给分析框架，数据嵌入论证中"
- paragraph_max_length: 100字
- single_sentence_paragraph_rate: 10%
- emotional_arc: "整体平稳，1-2处锐利判断"
- opening_style: "以行业事件/数据切入"
- closing_tendency: "留一个没答案的问题"
- 自我质疑：("目前行业内仍有不同声音"/"数据支持这个方向，但样本量有限")
- 破句风格：短断言/对比转折/数据冲击
- 禁止：过度口语化/过多感性表达/无来源断言/报告式堆砌
"#.to_string(),
        "sharp-journalist" => r#"
## 写作人格：锐评记者
- voice_density: 0.4（有选择地出现）
- uncertainty_rate: 0.05
- data_reaction_style: "数据作为证据链，服务于论点"
- paragraph_max_length: 80字
- single_sentence_paragraph_rate: 20%（多用短句成段）
- emotional_arc: "冷开场→尖锐收"
- opening_style: "直接切入核心矛盾，不铺垫"
- closing_tendency: "一句定性收束"
- 自我质疑：("这个问题没有标准答案"/"目前证据指向这个方向，但不排除例外")
- 破句风格：断奏("裁员。反悔。再裁员。")/冷事实/反问拳
- 禁止：抒情和感性表达/冗长铺垫/模棱两可表态/网络流行语
"#.to_string(),
        "warm-editor" => r#"
## 写作人格：温暖编辑
- voice_density: 0.7（分享而非判断）
- uncertainty_rate: 0.10
- data_reaction_style: "数据嵌在故事/场景里，不独立出现"
- paragraph_max_length: 90字
- single_sentence_paragraph_rate: 15%
- emotional_arc: "缓慢升温，中后段到达高点"
- opening_style: "以温暖的场景开头"
- closing_tendency: "用画面收束"
- 自我质疑：("我也说不好这是好事还是坏事"/"也许每个人的答案不一样"/"我不想假装自己有答案")
- 破句风格：柔和停顿/温柔插话/回声
- 禁止：冷硬专业术语/攻击性语言/密集数据堆砌/急促节奏
"#.to_string(),
        "cold-analyst" => r#"
## 写作人格：冷静研究员
- voice_density: 0.3（用"我们观察到"/"数据显示"）
- uncertainty_rate: 0.10（专业方式表达不确定性）
- data_reaction_style: "先建分析框架，数据填充框架"
- paragraph_max_length: 120字
- single_sentence_paragraph_rate: 8%（少用单句段落）
- emotional_arc: "整体平稳，关键洞察处提升强度"
- opening_style: "开头直接亮核心论点"
- closing_tendency: "以'这意味着什么'收束"
- 自我质疑：("该预测区间较宽，需谨慎看待"/"现有数据尚不足以支持确定性结论"/"该判断的置信度中等")
- 破句风格：限定修饰/简洁转折/影响断点
- 禁止：口语化/网络用语/强烈情感判断/无来源数据/过度简化类比
"#.to_string(),
        _ => r#"
## 写作人格：普通表达
- voice_density: 0.5
- uncertainty_rate: 0.10
- emotional_arc: "有起伏"
- 禁止：总结式收尾/平铺直叙
"#.to_string(),
    }
}

// ─── Exemplar seeds (inline from references/exemplar-seeds.yaml) ─────────────
fn exemplar_seeds_text() -> &'static str {
    r#"
## 人类写作结构模式（Fallback：没有范文库时使用）

【开头钩子模式】
1. 好多年没有坐公交了……前面座位看到一个小女孩一直在刷AI生成的短视频……我当时看到这一幕我甚至有点伤心。
   （日常观察切入→意外情绪反应。不总结、不预告、不铺垫。）
2. 本硕八年毕业，单程通勤两个半小时，月薪2690。这是市场给我贴的标签。裸辞。创业，年收超7位数。
   （标签→撕裂对比开头。加粗短句制造落差。）
3. 29号活动结束后，我问朋友近况，他说在三亚带孩子。我盯着手机屏幕，愣了整整三秒。
   （对话碎片制造节奏。2-4字短句紧邻20+字长句。）
4. 我信了这套话很多年。"要有长期主义。要相信复利。"最惨的一次，在一个方向扎进去3年，什么都没留下来。
   （先认同再推翻。引用常见话→用个人经历否定。开头即高潮。）

【情绪高峰模式】
- "我信了这套话很多年。最惨的一次，在一个方向扎进去3年，回头一看，什么都没留下来。这不是失败——失败还有个明确的结果。是你信错了一件事。"
- "讲真，我每次看到这种争论，都觉得……怎么说呢……挺无语的。不是说这些人蠢。是他们在纠结一个根本不存在的问题。"
- "什么叫'AI味道'？你能定义吗？你能量化吗？你能验证吗？不能。那你在纠结什么？"

【转折/自我纠正模式】
- "我第一反应是'孩子这时候不应该在学校吗'，第二反应是想把这话发过去，第三反应是我把那句话吞回去了——因为我在那三秒里想清楚了一件事。"
- "不过到了之后我发现，什么作息啊，学习强度啊，都不是最难熬的，人才是。"
- "不过话又说回来。知道自己在局里，这件事本身，就已经是出局的开始了。"

【收尾模式】
- "时间是你唯一不可再生的资源。把它投进一个真实存在的锚点，才叫复利。投进一个'我相信它会好'的希望，叫做漫长的等死。"
- "有了AI之后，很多事都更容易了，但也正因为更容易了，什么东西真的值得做、值得花很多年去换，反而变得更难想清楚。"
- "不要在那个愣住的感觉里待太久。那个感觉，待久了，就成了借口。"
"#
}

// Map framework type to exemplar category (from spec)
fn exemplar_category(framework: &str) -> &'static str {
    match framework {
        "痛点型" => "tech-opinion",
        "故事型" | "复盘型" => "story-emotional",
        "清单型" | "对比型" => "list-practical",
        "热点解读型" | "纯观点型" | "热点解读" => "hot-take",
        _ => "general",
    }
}

/// Load exemplar files from skill_path/references/exemplars/ and return
/// formatted text. Falls back to exemplar_seeds_text() if no matching files.
fn exemplar_text(skill_path: Option<&str>, framework: &str) -> String {
    let skill_path = match skill_path {
        Some(p) if !p.is_empty() => p,
        _ => return exemplar_seeds_text().to_string(),
    };

    let index_path = std::path::Path::new(skill_path)
        .join("references/exemplars/index.yaml");

    if !index_path.exists() {
        return exemplar_seeds_text().to_string();
    }

    let index_content = match std::fs::read_to_string(&index_path) {
        Ok(c) => c,
        Err(_) => return exemplar_seeds_text().to_string(),
    };

    let index: serde_yaml::Value = match serde_yaml::from_str(&index_content) {
        Ok(v) => v,
        Err(_) => return exemplar_seeds_text().to_string(),
    };

    let target_category = exemplar_category(framework);

    // Parse entries: each item is a mapping with `title`, `category`, `filePath` (or `file_path`)
    let entries: Vec<(String, String)> = index
        .as_sequence()
        .and_then(|seq| Some(seq.iter()))
        .map(|iter| {
            iter.filter_map(|item| {
                let mapping = match item.as_mapping() {
                    Some(m) => m,
                    None => return None,
                };
                let cat_key = serde_yaml::Value::String("category".into());
                let cat = match mapping.get(&cat_key) {
                    Some(v) => v.as_str()?,
                    None => return None,
                };
                if cat != target_category && target_category != "general" {
                    return None;
                }
                let fp_key1 = serde_yaml::Value::String("filePath".into());
                let fp_key2 = serde_yaml::Value::String("file_path".into());
                let path = mapping
                    .get(&fp_key1)
                    .or_else(|| mapping.get(&fp_key2))
                    .and_then(|v| v.as_str())?;
                let title_key = serde_yaml::Value::String("title".into());
                let title = mapping
                    .get(&title_key)
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                Some((title.to_string(), path.to_string()))
            }).collect()
        })
        .unwrap_or_default();

    if entries.is_empty() {
        return exemplar_seeds_text().to_string();
    }

    let exemplars_dir = index_path.parent().unwrap_or(std::path::Path::new(skill_path));
    let mut result = String::new();

    for (title, rel_path) in entries.into_iter().take(3) {
        let full_path = exemplars_dir.join(&rel_path);
        if let Ok(content) = std::fs::read_to_string(&full_path) {
            // Take first 400 chars as style sample
            let sample = content.chars().take(400).collect::<String>();
            result.push_str(&format!("\n【风格样本: {}】\n{}\n", title, sample));
        }
    }

    if result.is_empty() {
        exemplar_seeds_text().to_string()
    } else {
        result
    }
}

/// Load playbook.md from skill_path and return high-confidence rules (≥ 5).
/// Returns empty string if file doesn't exist or can't be parsed.
fn playbook_text(skill_path: Option<&str>) -> String {
    let skill_path = match skill_path {
        Some(p) if !p.is_empty() => p,
        _ => return String::new(),
    };

    let path = std::path::Path::new(skill_path).join("playbook.md");
    if !path.exists() {
        return String::new();
    }

    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return String::new(),
    };

    // Parse rules: look for "confidence: N" or "confidence:N" in each rule block
    // Rules are separated by blank lines or section headers
    let mut result = String::new();
    let mut rule_count = 0;

    for block in content.split("\n\n") {
        let trimmed = block.trim();
        if trimmed.is_empty() {
            continue;
        }
        // Check confidence level
        let conf = trimmed.lines()
            .find(|l| l.to_lowercase().contains("confidence"))
            .and_then(|l| {
                l.split(':')
                    .nth(1)
                    .and_then(|v| v.trim().parse::<i32>().ok())
            })
            .unwrap_or(0);

        if conf >= 5 {
            rule_count += 1;
            result.push_str(trimmed);
            result.push_str("\n\n");
        }
    }

    if result.is_empty() {
        return String::new();
    }

    format!(
        "## 个性化写作规则（来自你的写作习惯，高优先级）\n\
         以下规则来自你本人的写作风格，请严格执行（confidence ≥ 5）：\n\
         {}\n\
         ---",
        result
    )
}

// ─── Framework constraints ───────────────────────────────────────────────────
fn framework_constraints(framework: &str) -> &'static str {
    match framework {
        "痛点型" => r#"
## 框架：痛点型
结构：开头(痛点共鸣) → 痛点放大 → 解决方案 → 实操验证(可选) → 结尾(行动引导)
- 开头：直接描述目标读者正在经历的痛点场景，制造紧迫感
- 痛点放大：用数据或案例说明问题有多普遍
- 解决方案：核心方法/工具/思路（不超过3个要点），每个配具体案例或操作步骤
- 金句落点：在每个H2放置一句可独立传播的短句（≤20字）
- 结尾：自然断流，不做总结式收尾
"#,
        "故事型" => r#"
## 框架：故事型
结构：开头(悬念钩子) → 背景铺垫 → 转折高潮 → 深度解读 → 结尾(情绪共振)
- 开头：抛出反直觉结果或意外场景（"谁也没想到……"/"所有人都以为……结果……"）
- 转折高潮：事件关键转折点，用细节还原场景（对话、数字、画面）
- 深度解读：从故事上升到规律/趋势/洞察
- 金句落点：在故事高潮处放置金句
- 结尾：回扣开头的悬念，不要总结
"#,
        "清单型" => r#"
## 框架：清单型
结构：开头(价值承诺) → 清单项1-N → 结尾(总结+彩蛋)
- 开头：直接告诉读者看完能得到什么，用数字锚定预期
- 每项：名称→一句话说明→具体案例/使用场景/适用人群
- 项与项之间穿插金句或吐槽，打破机械感
- 结尾：加一个"隐藏推荐"或"个人最爱"作为彩蛋，自然断流
"#,
        "对比型" => r#"
## 框架：对比型
结构：开头(选择困境) → A方案 → B方案 → 对比总结 → 结尾(个人选择)
- 开头：描述读者面临的"选A还是选B"困境
- A/B方案：优势+劣势+适用场景，每项配具体案例
- 对比总结：给出明确建议（"如果你是X情况选A，如果是Y情况选B"）
- 不要和稀泥说"各有优劣"——读者要明确建议
- 结尾：说清楚"如果是我，我选X及为什么"，戛然而止
"#,
        "热点解读" => r#"
## 框架：热点解读型
结构：开头(事件速览) → 表面信息 → 深层分析 → 影响预判 → 结尾(读者行动建议)
- 开头：2-3句说清楚发生了什么，用自己的话重述，判断句结尾
- 深层分析：看到别人没看到的，利益链/技术逻辑/行业趋势
- 影响预判：短期+长期，说清楚不确定性
- 结尾：普通读者怎么应对，不做总结
"#,
        "纯观点" => r#"
## 框架：纯观点型
结构：开头(亮刀子) → 为什么这么想 → 主流观点哪里错了 → 如果我是对的 → 结尾(留余地)
- 开头：第一段把核心观点甩出来，不铺垫（"我越来越觉得X是一个巨大的谎言"）
- 反驳主流：引用真实对立观点，给对方最强版本，再说明为什么不同意
- 结尾：戛然而止或反问，不做总结
"#,
        "复盘型" => r#"
## 框架：复盘型
结构：开头(结果先行) → 做对了什么 → 做错了什么 → 下次怎么做
- 开头：先说结果/数据，直接上数字，不要谦虚也不要吹
- 做错了什么：有具体细节，坦诚
- 下次怎么做：提炼普适经验
"#,
        _ => "",
    }
}

// ─── Step 4.5 Self-check system prompt ──────────────────────────────────────
fn self_check_prompt(article: &str) -> String {
    format!(
        r#"你是一个文章编辑，刚完成初稿。请对以下文章做5项快速自检，并输出修复后的完整文章。

## 自检项目（当场修复，不要跳过）

1. **禁用词扫描**：检查以下AI痕迹词，命中的直接替换：
禁止出现：众所周知、毋庸置疑、值得注意的是、不得不提、总的来说、事实上、相信大家都有所了解
→ 发现则直接替换为自然表达

2. **句长方差**：是否有连续3句以上长度接近（±5字）的段落？
→ 如果有，拆句或加入短句制造落差

3. **开头钩子**：前3句是否制造了悬念/冲突/好奇心？是否以背景铺垫开场？
→ 如果是平铺直叙，重写开头前3句

4. **增强贯穿**：文章是否只在1-2段里有实质性内容，其余都在说空话？
→ 如果是，为空洞段落补充具体数据/工具/步骤

5. **金句检查**：全文是否有至少1句可独立截图转发的句子（≤20字，有观点）？
→ 如果没有，在情绪高点处补一句

## 输出格式
只输出修复后的完整文章全文（Markdown格式），不加任何说明。
如果文章不需要任何修改，直接输出原文。

## 文章内容：
{}"#,
        article
    )
}

// ─── Pipeline entry ─────────────────────────────────────────────────────────
#[tauri::command]
pub async fn run_pipeline_step(step: u8, params: Value, app: tauri::AppHandle) -> Result<StepResult, String> {
    let ai_key = get_config("api_key");
    let ai_base = get_config("base_url");
    let ai_model = get_config("model");

    let key = ai_key.ok_or("未配置 AI API Key，请先去设置页填写")?;
    let model_opt = ai_model.as_deref();
    let base_opt = ai_base.as_deref();

    let data = match step {
        1 => serde_json::json!({
            "checks": [
                { "name": "AI API Key", "status": if get_config("api_key").is_some() { "ok" } else { "missing" } },
                { "name": "公众号配置", "status": if get_config("account_name").is_some() { "ok" } else { "missing" } },
                { "name": "图片 API", "status": if get_config("img_api_key").is_some() || get_config("img_provider").map(|p| p == "跳过配图").unwrap_or(false) { "ok" } else { "skipped" } },
            ]
        }),
        2 => generate_topics(&key, base_opt, model_opt).await?,
        4 => write_article_internal(&key, base_opt, model_opt, &params, app.clone()).await?,
        _ => serde_json::json!({ "status": "ready" }),
    };

    Ok(StepResult {
        step,
        status: "ok".to_string(),
        data,
        error: None,
    })
}

// ─── Step 2: 选题 ───────────────────────────────────────────────────────────
async fn generate_topics(
    api_key: &str,
    base_url: Option<&str>,
    model: Option<&str>,
) -> Result<Value, String> {
    let industry = get_config("industry").unwrap_or_else(|| "AI/互联网".to_string());
    let audience = get_config("audience").unwrap_or_else(|| "互联网从业者".to_string());
    let tone = get_config("tone").unwrap_or_else(|| "轻松幽默".to_string());
    let account_name = get_config("account_name").unwrap_or_else(|| "该领域".to_string());
    let content_dirs = get_config("content_dirs").unwrap_or_default();

    let system = r#"你是专业的公众号选题策划师。

生成10个选题，其中7-8个热点选题+2-3个常青选题。
每个选题输出JSON：
{"title":"选题标题（20-30字，有冲突感）","score":60-95,"framework":"框架类型","keywords":["关键词1","关键词2"],"is_hot":true/false,"recommended":true/false}

标题要口语化、有悬念。不要重复。
"#;

    let user = format!(
        "公众号名称：{}\n行业：{}\n内容方向：{}\n目标受众：{}\n语气偏好：{}\n\n请生成10个选题。",
        account_name, industry, content_dirs, audience, tone
    );

    let content = chat_completion(system, &user, api_key, base_url, model).await?;
    let json_str = extract_json(&content);
    let topics: Vec<Value> = serde_json::from_str(&json_str)
        .map_err(|e| format!("AI返回非JSON: {} | {}", e, &json_str[..json_str.len().min(200)]))?;

    Ok(serde_json::json!({ "topics": topics }))
}

fn dimension_randomization() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0) as usize;

    let pools: Vec<[(&str, &str); 4]> = vec![
        [
            ("叙事视角", "第一人称亲历：'我当时以为…'"),
            ("叙事视角", "旁观者分析：'这事有意思…'"),
            ("叙事视角", "对话体：'你说…''我说…'"),
            ("叙事视角", "自问自答：自设疑问并作答"),
        ],
        [
            ("时间线", "正序：从远到近娓娓道来"),
            ("时间线", "倒叙：先给结论/结果再说来龙去脉"),
            ("时间线", "插叙：主线穿插支线回忆"),
            ("时间线", "时间跳跃：过去/现在/未来快速切换"),
        ],
        [
            ("类比域", "体育：用比赛/训练/战术做类比"),
            ("类比域", "做饭：从食材/火候/调味切入"),
            ("类比域", "恋爱：从吸引/相处/分手切入"),
            ("类比域", "游戏：用打法/装备/排位切入"),
        ],
        [
            ("情绪基调", "克制冷静：数据说话，情感内敛"),
            ("情绪基调", "热血激动：感叹号+排比+短句密集"),
            ("情绪基调", "讽刺吐槽：反讽语气，揭露荒诞"),
            ("情绪基调", "温暖治愈：细节画面感强，有共鸣"),
        ],
        [
            ("节奏", "短句密集：快节奏推进信息"),
            ("节奏", "长叙述慢推：沉浸式慢叙述"),
            ("节奏", "长短交替：冲击-喘息-再冲击"),
            ("节奏", "慢开头快收尾：前面铺垫，最后发力"),
        ],
    ];

    let mut rng = seed;
    let mut result = vec![];
    let activate_count = 2 + if (rng % 3) == 0 { 1 } else { 0 };
    rng = rng.wrapping_mul(1103515245).wrapping_add(12345);

    for pool in pools {
        if result.len() >= activate_count {
            break;
        }
        let idx = rng % pool.len();
        result.push(pool[idx]);
        rng = rng.wrapping_mul(1103515245).wrapping_add(12345);
    }

    let lines: Vec<String> = result
        .iter()
        .map(|(dim, opt)| format!("{}：{}", dim, opt))
        .collect();

    format!("## 随机维度（本次写作激活）\n{}\n", lines.join("\n"))
}

// ─── Step 4: 写作 SSE ────────────────────────────────────────────────────────
#[derive(Clone, Serialize)]
struct WritingPhaseEvent {
    phase: String,
    article: Option<String>,
    word_count: Option<usize>,
    h2_count: Option<usize>,
    persona: Option<String>,
    framework: Option<String>,
    message: String,
}

async fn write_article_internal(
    api_key: &str,
    base_url: Option<&str>,
    model: Option<&str>,
    params: &Value,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    let title = params["title"].as_str().ok_or("缺少选题标题")?;
    let framework = params["framework"].as_str().unwrap_or("热点解读");
    let skill_path = get_config("skill_path");

    let materials_text: String = params["materials"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .map(|m| {
                    let t = m.get("title").and_then(|v| v.as_str()).unwrap_or("");
                    let s = m.get("snippet").and_then(|v| v.as_str()).unwrap_or("");
                    let u = m.get("url").and_then(|v| v.as_str()).unwrap_or("");
                    format!("- {}: {} ({})", t, s, u)
                })
                .collect::<Vec<_>>()
                .join("\n")
        })
        .unwrap_or_default();

    let enhance_strategy = params["enhance_strategy"]
        .as_str()
        .unwrap_or("angle_discovery");

    let enhance_guidance = match enhance_strategy {
        "density_boost" => "本次写作核心策略：**密度强化**。在每个H2段落中植入尽可能多的具体信息：数字、步骤、参数、工具名、案例细节。避免空泛表述，每句话都要有信息增量。",
        "detail_anchoring" => "本次写作核心策略：**细节锚定**。用具体的时间锚点、数字锚点、对话片段、感官细节来支撑内容。让读者有身临其境的画面感，而不是抽象的概念描述。",
        "real_feel" => "本次写作核心策略：**真实体感**。引用真实用户的评价、踩坑经历、对比感受。让读者感受到真实使用场景中的体验差异，而非理论分析。",
        _ => "本次写作核心策略：**角度发现**。找到与众不同的切入角度，避免泛泛而谈。提出一个反直觉或容易被忽略的视角，让读者感到'原来还可以这样想'。",
    };

    let dimension_text = dimension_randomization();

    let persona = "midnight-friend";

    let industry = get_config("industry").unwrap_or_else(|| "AI/互联网".to_string());
    let content_dirs = get_config("content_dirs").unwrap_or_default();
    let tone = get_config("tone").unwrap_or_else(|| "轻松幽默".to_string());
    let blacklist = get_config("forbidden_words")
        .map(|s| s.split(',').filter(|x| !x.trim().is_empty()).map(|x| x.trim().to_string()).collect::<Vec<_>>())
        .unwrap_or_default();

    let writing_guide_text = include_str!("../references/writing-guide.md");
    let wcfg = WritingConfig::default();

    let account_name = get_config("account_name").unwrap_or_else(|| "该领域".to_string());

    let _ = app.emit(
        "writing-progress",
        WritingPhaseEvent {
            phase: "开始".to_string(),
            article: None,
            word_count: None,
            h2_count: None,
            persona: None,
            framework: None,
            message: "正在生成初稿…".to_string(),
        },
    );

    // ── Phase 1: Main article ──────────────────────────────────────────────
    let system = &format!(
        r#"你是公众号"{}"的专业写作者。

{}

{}

{}

{}

## 账号信息
- 公众号：{}
- 行业：{}
- 内容方向：{}
- 语气：{}

## 真实素材（来自网络搜索，请在文章中自然引用，不要堆砌）
{}

## 内容增强
{}

{}

## 写作约束（必须遵守）
1. H1标题（20-28字）+ H2分节，1500-2500字
2. 开头前3句制造悬念/冲突，禁止背景铺垫开场
3. 句长标准差≥15字，最短3字，最长60+字，禁止连续3句长度接近
4. 4个词汇温度带在任意500字窗口内至少出现3种
5. 全文负面情绪≥20%，至少2处明确负面情绪段落
6. 副词密度≤3/100字
7. 每H2至少1条真实素材（具体数字/案例/引述）
8. 全文至少1句可截图转发的金句（≤20字）
9. {} 个编辑锚点：<!-- ✏️ 编辑建议：在这里加入你的经历/看法 -->
10. 禁止：众所周知/毋庸置疑/值得注意的是/不得不/总的来说/事实上
11. 禁止总结式收尾（"让我们拭目以待"/"未来可期"/"综上所述"）
12. 结尾用6种收尾模式之一，不要重复上文的语气
13. {} 段落间有风格漂移（各H2语气有差异）
14. 用Markdown格式，只输出文章内容，不要解释

{}

## 个性化写作规则

{}

请用{}风格写一篇关于「{}」的文章。"#,
        account_name,
        writing_guide_text,
        persona_text(&persona),
        framework_constraints(framework),
        "",  // blank placeholder for writing guide section
        account_name,
        industry,
        content_dirs,
        tone,
        materials_text,
        enhance_guidance,
        dimension_text,
        if blacklist.is_empty() { 2 } else { 3 },
        if wcfg.style_drift > 0.3 { "有意识地做" } else { "" },
        playbook_text(skill_path.as_deref()),
        "",  // blank placeholder for 个性化写作规则 section
        exemplar_text(skill_path.as_deref(), framework),
        framework,
    );

    let user = &format!(
        "请根据以上所有约束，用{}框架风格写一篇关于「{}」的公众号文章。\n\
        写作参数参考：\n\
        - sentence_variance: {}\n\
        - paragraph_rhythm: {}\n\
        - emotional_arc: {}\n\
        - style_drift: {}\n\
        - broken_sentence_rate: {}\n\
        请在文章中体现这些参数要求的特征。",
        framework, title,
        wcfg.sentence_variance,
        wcfg.paragraph_rhythm,
        wcfg.emotional_arc,
        wcfg.style_drift,
        wcfg.broken_sentence_rate
    );

    let content = chat_completion(system, user, api_key, base_url, model).await?;

    // Clean markdown code blocks
    let draft = if content.trim().starts_with("```") {
        content.trim()
            .lines()
            .skip(1)
            .take_while(|l| !l.trim().starts_with("```"))
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        content.trim().to_string()
    };

    let draft_wc = draft.chars().filter(|c| !c.is_whitespace()).count();
    let draft_h2 = draft.matches("\n## ").count();

    _ = app.emit(
        "writing-progress",
        WritingPhaseEvent {
            phase: "初稿完成".to_string(),
            article: Some(draft.clone()),
            word_count: Some(draft_wc),
            h2_count: Some(draft_h2),
            persona: Some(persona.to_string()),
            framework: Some(framework.to_string()),
            message: format!("初稿 {} 字，{} 节，正在自检…", draft_wc, draft_h2),
        },
    );

    // ── Step 4.5: Post-writing self-check ──────────────────────────────────
    let self_check_system = r#"你是一个专业的文章编辑，擅长修复AI写作痕迹。严格执行以下检查并修复。"#;

    let checked_article = chat_completion(
        self_check_system,
        &self_check_prompt(&draft),
        api_key,
        base_url,
        model,
    ).await?;

    let final_article = if checked_article.trim().starts_with("```") {
        checked_article.trim()
            .lines()
            .skip(1)
            .take_while(|l| !l.trim().starts_with("```"))
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        checked_article.trim().to_string()
    };

    let final_article = if final_article.len() < draft.len() * 3 / 4 {
        draft.clone()
    } else {
        final_article
    };

    let word_count = final_article.chars().filter(|c| !c.is_whitespace()).count();
    let h2_count = final_article.matches("\n## ").count();

    _ = app.emit(
        "writing-progress",
        WritingPhaseEvent {
            phase: "完成".to_string(),
            article: Some(final_article.clone()),
            word_count: Some(word_count),
            h2_count: Some(h2_count),
            persona: Some(persona.to_string()),
            framework: Some(framework.to_string()),
            message: format!("定稿 {} 字，{} 节", word_count, h2_count),
        },
    );

    Ok(serde_json::json!({
        "article": final_article,
        "word_count": word_count,
        "h2_count": h2_count,
        "title": title,
        "framework": framework,
        "persona": persona,
    }))
}

#[tauri::command]
pub async fn write_article_streaming(
    params: Value,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    let api_key = get_config("api_key").ok_or("未配置 AI API Key，请先去设置页填写")?;
    let base_url = get_config("base_url");
    let model = get_config("model");
    write_article_internal(&api_key, base_url.as_deref(), model.as_deref(), &params, app).await
}
