use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::db;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum Strictness {
    Relaxed,
    Standard,
    Strict,
}

#[derive(Serialize, Deserialize)]
pub struct HitLocation {
    pub paragraph_index: usize,
    pub sentence_index: usize,
    pub original: String,
    pub suggested: String,
}

#[derive(Serialize, Deserialize)]
pub struct HitRecord {
    pub rule_id: u8,
    pub pattern_name: String,
    pub layer: String,
    pub locations: Vec<HitLocation>,
    pub severity: f64,
}

#[derive(Serialize, Deserialize)]
pub struct HumanizeResult {
    pub original: String,
    pub fixed: String,
    pub hits: Vec<HitRecord>,
    pub hit_count: usize,
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
        "temperature": 0.3,
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

/// 系统提示词：完整的 29 条 AI 写作痕迹检测 + 修复规则
fn humanizer_system_prompt() -> &'static str {
    r#"你是一个专业的文章编辑，擅长识别并修复 AI 生成文章中的写作痕迹，让文章读起来更像真人写的。
你的任务：
1. 仔细阅读原文
2. 识别文中所有 AI 写作痕迹（见下方 29 条规则）
3. 重写文章，去除这些痕迹，同时：
   - 保持原文的核心观点和信息
   - 让文章有人的声音和灵魂——有观点、有情绪、有节奏变化
   - 句长要有变化，不要每句都一个长度
   - 可以有第一人称视角
   - 具体细节优于模糊概括
   - 不要说车轱辘话

## 29 条 AI 写作痕迹规则

### 内容层面
**规则1：过度强调重要性** — 词汇：标志着、是一个 testament/reminder、至关/至关重要/关键/核心作用、凸显/强调其意义、反映更广泛趋势、象征着 ongoing/enduring/lasting、对…作出贡献、标志着、代表着 shift、关键转折点、 evolv ing landscape、焦点、不可磨灭的印记、深深植根于 → 删除这些废话，直接说事实
**规则2：过度引用媒体/名人** — "被纽约时报、BBC 引用" → 引用一句具体的话和来源
**规则3：表面化 -ing 分析** — highlighting/underscoring/emphasizing...、ensuring...、reflecting/symbolizing...、contributing to...、cultivating/fostering...、encompassing...、showcasing... → 删除或用具体信息替代
**规则4：促销语言** — boasts a、vibrant、rich（比喻义）、profound、enhancing its、showcasing、exemplifies、commitment to、natural beauty、nestled、in the heart of、groundbreaking（比喻义）、renowned、breathtaking、must-visit、stunning → 删除，用中性描述
**规则5：模糊归因** — "专家们认为"、"业内人士指出"、"多项研究表明" → 用具体来源替代，或直接删掉
**规则6：公式化挑战章节** — "尽管面临挑战…仍在蓬勃发展"、"挑战与展望" → 写具体挑战和具体事实

### 语言层面
**规则7：AI 高频词** — actually、additionally、align with、crucial、delve、emphasizing、enduring、enhance、fostering、garner、highlight（动词）、interplay、intricate/intricacies、key（形容词）、landscape（抽象名词）、pivotal、showcase、tapestry（抽象名词）、testament、underscore（动词）、valuable、vibrant → 换掉或删掉
**规则8：回避系动词** — serves as/stands as/marks/represents [a]、boasts/features/offers [a] → 用 "is/has" 替代
**规则9：负面排比/尾随否定** — "Not only...but..."、"It's not just about..., it's..."、"no guessing" → 直接说观点
**规则10：三重法则滥用** — "创新、灵感、行业洞察" → 自然列出，不强凑三项
**规则11：同义替换循环** — protagonist/main character/central figure/hero → 重复用同一个词
**规则12：虚假范围** — "从 X 到 Y，从 A 到 B"（X和Y不在同一尺度）→ 直接列出主题
**规则13：被动语态/无主语碎片** — "No configuration file needed" → 说出主语

### 风格层面
**规则14：破折号过度使用** — 连续多个破折号 → 改用逗号或句号
**规则15：过度加粗** — **OKR**、**KPI** → 正常文字不加粗
**规则16：标题式列表** — "**用户体验：** 用户体验显著改善" → 改为正文叙述
**规则17：标题首字母大写** — "战略谈判与全球伙伴关系" → "战略谈判与全球伙伴关系"
**规则18：表情符号** — 🚀💡✅ → 删除
**规则19：弯引号** — "这样" → "这样" → 统一用直引号

### 沟通层面
**规则20：聊天机器人话术** — "希望这有帮助！"、"当然！"、"您说得对！"、"让我知道是否..." → 删除
**规则21：知识截止免责声明** — "截至目前…" → 删除或找到具体来源
**规则22：谄媚语气** — "好问题！"、"您说得太对了！" → 直接回答

### 填充与规避
**规则23：填充短语** — "为了实现这个目标"→"为了"、"由于事实上"→"因为"、"在这一点上"→"现在"
**规则24：过度委婉** — "可能/也许/或许/一定程度上"叠加 → 选一个
**规则25：通用积极结尾** — "未来一片光明"、"令人兴奋的时代" → 写具体计划或事实
**规则26：连字符词对滥用** — third-party、cross-functional、client-facing、data-driven → 去掉不常用连字符
**规则27：说服性权威套话** — "真正的问题是"、"从根本上"、"实际上关键的是" → 直接说
**规则28：预告性引导语** — "让我们深入了解"、"接下来"、"首先，让我们" → 直接进入内容
**规则29：碎片化标题** — 标题后跟一句重复标题的短句 → 删除那个短句

## 输出格式
请严格按以下 JSON 格式输出，不要包含任何其他文字：

{
  "fixed": "（修复后的完整文章全文，用中文写，保持原文结构，只替换有 AI 痕迹的句子）",
  "hits": [
    {
      "rule_id": 1-29 中的数字,
      "pattern_name": "规则名称（如：规则7：AI高频词）",
      "layer": "内容/语言/风格/沟通/填充",
      "locations": [
        {
          "paragraph_index": 段落编号（从0开始）,
          "sentence_index": 句子编号（从0开始）,
          "original": "原文片段",
          "suggested": "建议修改为"
        }
      ],
      "severity": 0.0-1.0 的数字，越高越需要修复
    }
  ]
}

请仅输出 JSON，不要输出任何其他内容。直接开始分析："#
}

#[tauri::command]
pub async fn humanize(content: String, strictness: Strictness) -> Result<HumanizeResult, String> {
    if content.trim().is_empty() {
        return Ok(HumanizeResult {
            original: content,
            fixed: String::new(),
            hits: Vec::new(),
            hit_count: 0,
        });
    }

    let ai_key = get_config("api_key").ok_or("未配置 AI API Key")?;
    let ai_base_opt: Option<String> = get_config("base_url");
    let ai_model_opt: Option<String> = get_config("model");

    // Adjust min_severity based on strictness
    let min_severity = match strictness {
        Strictness::Relaxed => 0.7,
        Strictness::Standard => 0.4,
        Strictness::Strict => 0.0,
    };

    let system_prompt = humanizer_system_prompt();
    let user_prompt = format!(
        "请分析并修复以下文章中的 AI 写作痕迹（严格程度：{}）：\n\n{}",
        match strictness {
            Strictness::Relaxed => "宽松（只修复最明显的）",
            Strictness::Standard => "标准",
            Strictness::Strict => "严格（所有痕迹都修复）",
        },
        content
    );

    let response = chat_completion(&system_prompt, &user_prompt, &ai_key, ai_base_opt.as_deref(), ai_model_opt.as_deref()).await?;

    // Parse JSON response
    let json_str = response.trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let parsed: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("AI 返回格式错误: {}，原始内容: {}", e, &response[..response.len().min(200)]))?;

    let fixed = parsed["fixed"]
        .as_str()
        .unwrap_or(&content)
        .to_string();

    let hits_raw = parsed["hits"].as_array().cloned().unwrap_or_default();
    let mut hits: Vec<HitRecord> = Vec::new();

    for h in hits_raw {
        let severity = h["severity"].as_f64().unwrap_or(0.5);
        if severity < min_severity {
            continue;
        }
        let locations_raw = h["locations"].as_array().cloned().unwrap_or_default();
        let mut locations = Vec::new();
        for loc in locations_raw {
            locations.push(HitLocation {
                paragraph_index: loc["paragraph_index"].as_i64().unwrap_or(0) as usize,
                sentence_index: loc["sentence_index"].as_i64().unwrap_or(0) as usize,
                original: loc["original"].as_str().unwrap_or("").to_string(),
                suggested: loc["suggested"].as_str().unwrap_or("").to_string(),
            });
        }
        hits.push(HitRecord {
            rule_id: h["rule_id"].as_u64().unwrap_or(0) as u8,
            pattern_name: h["pattern_name"].as_str().unwrap_or("未知").to_string(),
            layer: h["layer"].as_str().unwrap_or("其他").to_string(),
            locations,
            severity,
        });
    }

    hits.sort_by(|a, b| b.severity.partial_cmp(&a.severity).unwrap());

    let hit_count = hits.len();
    Ok(HumanizeResult {
        original: content,
        fixed,
        hits,
        hit_count,
    })
}

/// Analyze text quality metrics: sentence length variance, vocabulary temperature, etc.
#[tauri::command]
pub fn analyze_text(content: String) -> Result<serde_json::Value, String> {
    let sentences: Vec<&str> = content
        .split(|c| c == '。' || c == '！' || c == '？' || c == '…')
        .filter(|s| !s.trim().is_empty())
        .collect();

    let lengths: Vec<f64> = sentences.iter().map(|s| s.chars().count() as f64).collect();
    let n = lengths.len() as f64;
    if n == 0.0 {
        return Ok(serde_json::json!({ "error": "empty content" }));
    }
    let mean = lengths.iter().sum::<f64>() / n;
    let variance = lengths.iter().map(|l| (l - mean).powi(2)).sum::<f64>() / n;
    let std_dev = variance.sqrt();

    let paragraphs: Vec<&str> = content.split('\n').filter(|s| !s.trim().is_empty()).collect();
    let word_count: usize = content.chars().filter(|c| !c.is_whitespace()).count();

    Ok(serde_json::json!({
        "sentence_count": sentences.len(),
        "word_count": word_count,
        "paragraph_count": paragraphs.len(),
        "avg_sentence_length": mean,
        "sentence_length_std_dev": std_dev,
        "length_variance_ok": std_dev >= 15.0,
    }))
}
