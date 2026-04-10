use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::db;

// ─── Config helpers ────────────────────────────────────────────────────────────

fn get_config_val(key: &str) -> Option<String> {
    db::open()
        .ok()?
        .prepare(&format!("SELECT value FROM config WHERE key = '{}'", key))
        .ok()?
        .query_map([], |row| row.get::<_, String>(0))
        .ok()?
        .filter_map(|r| r.ok())
        .next()
}

fn get_config_map() -> std::collections::HashMap<String, String> {
    let conn = match db::open() {
        Ok(c) => c,
        Err(_) => return std::collections::HashMap::new(),
    };
    let mut stmt = match conn.prepare("SELECT key, value FROM config") {
        Ok(s) => s,
        Err(_) => return std::collections::HashMap::new(),
    };
    let mut map = std::collections::HashMap::new();
    if let Ok(rows) = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }) {
        for row in rows.flatten() {
            map.insert(row.0, row.1);
        }
    }
    map
}

// ─── LLM helper ───────────────────────────────────────────────────────────────

async fn chat_complete<S: AsRef<str>>(system: S, user: S) -> Result<String, String> {
    let config = get_config_map();
    let api_key = config
        .get("api_key")
        .ok_or("未配置 AI API Key，请先去设置页填写")?;
    let base = config.get("base_url").map(|s| s.as_str());
    let model = config.get("model").map(|s| s.as_str());

    let client = reqwest::Client::new();
    let base_url = base.unwrap_or("https://api.openai.com/v1");
    let model_name = model.unwrap_or("gpt-4o");
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model_name,
        "messages": [
            { "role": "system", "content": system.as_ref() },
            { "role": "user", "content": user.as_ref() }
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
        return Err(format!("AI API 错误 ({}): {}", status, &text[..text.len().min(200)]));
    }

    let json: Value =
        serde_json::from_str(&text).map_err(|e| format!("解析失败: {}", e))?;
    json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "AI 未返回内容".to_string())
}

fn extract_json_block(text: &str) -> String {
    let text = text.trim();
    // Try to find a JSON code block
    if let Some(start) = text.find("```json") {
        let after = &text[start + 7..];
        if let Some(end) = after.find("```") {
            return after[..end].trim().to_string();
        }
    }
    if let Some(start) = text.find("```") {
        let after = &text[start + 3..];
        if let Some(end) = after.find("```") {
            return after[..end].trim().to_string();
        }
    }
    // Try from first { to last }
    if let Some(start) = text.find('{') {
        if let Some(end) = text.rfind('}') {
            return text[start..=end].to_string();
        }
    }
    text.to_string()
}

// ─── Builtin visual prompts (fallback) ───────────────────────────────────────

const BUILTIN_VISUAL_PROMPTS: &str = r#"# 视觉提示词

## 封面 A：直觉冲击型

### 定位
用视觉隐喻直接表达文章核心观点，适合热点类、观点类。

### AI 绘图提示词：
"A bold visual metaphor for the topic, high-impact composition, dramatic contrast, first-glance hook, flat modern illustration, 16:9 aspect ratio, clean space for title text overlay at bottom, no text or letters in image"

## 封面 B：氛围渲染型

### 定位
营造情绪或场景氛围，适合故事类、情绪类。

### AI 绘图提示词：
"An atmospheric scene illustration, emotional mood, detailed texture, inviting composition, 16:9 aspect ratio, soft lighting, space for title text overlay, no text in image"

## 封面 C：信息图表型

### 定位
用简洁的图形/图标/数据可视化传递信息，适合干货类、清单类。

### AI 绘图提示词：
"Clean infographic illustration, professional data visualization style, minimalist design, 16:9 aspect ratio, clear visual hierarchy, space for title text overlay at top, no text in image"

## 内文配图通用要求

16:9 aspect ratio, modern minimalist illustration, no text in image, consistent visual style with article cover
"#;

// ─── Commands ─────────────────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct Hotspot {
    pub title: String,
    #[serde(default)]
    pub hot: f64,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub url: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct KeywordResult {
    pub keyword: String,
    #[serde(default)]
    pub seo_score: f64,
    #[serde(default)]
    pub related: Vec<String>,
    #[serde(default)]
    pub trending: Option<String>,
}

#[derive(Serialize)]
pub struct SearchResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hotspots: Option<Vec<Hotspot>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keywords: Option<Vec<KeywordResult>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub materials: Option<Vec<serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub composite_score: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub param_scores: Option<serde_json::Value>,
    pub data: serde_json::Value,
    pub error: Option<String>,
}

impl SearchResult {
    pub fn ok(data: serde_json::Value) -> Self {
        SearchResult {
            success: true,
            hotspots: None,
            keywords: None,
            materials: None,
            composite_score: None,
            param_scores: None,
            data,
            error: None,
        }
    }

    pub fn err(msg: &str) -> Self {
        SearchResult {
            success: false,
            hotspots: None,
            keywords: None,
            materials: None,
            composite_score: None,
            param_scores: None,
            data: serde_json::Value::Null,
            error: Some(msg.to_string()),
        }
    }
}

/// Fetch trending topics using LLM (replaces fetch_hotspots.py)
#[tauri::command]
pub async fn fetch_hotspots(limit: usize) -> SearchResult {
    let system = "你是公众号选题策划师，专注于热点分析和选题评分。";
    let user = &format!(
        "请根据以下信息，生成{}个今日热点选题，返回JSON数组：行业：{}内容方向：{}目标受众：{}要求：每个选题包含title/hot/source/framework字段，7-8个热点+2-3个常青，返回纯JSON不要解释。格式：[{{\"title\":\"标题\",\"hot\":80,\"source\":\"微博热搜\",\"framework\":\"热点解读\"}},...]",
        limit,
        get_config_val("industry").unwrap_or_else(|| "AI/互联网".into()),
        get_config_val("content_dirs").unwrap_or_else(|| "AI、科技、创业".into()),
        get_config_val("audience").unwrap_or_else(|| "互联网从业者".into())
    );

    match chat_complete(system, user).await {
        Ok(text) => {
            let json_str = extract_json_block(&text);
            match serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
                Ok(items) => {
                    let hotspots: Vec<Hotspot> = items
                        .into_iter()
                        .map(|v| Hotspot {
                            title: v.get("title")
                                .and_then(|x| x.as_str())
                                .unwrap_or("")
                                .to_string(),
                            hot: v.get("hot")
                                .and_then(|x| x.as_f64())
                                .unwrap_or(50.0),
                            source: v.get("source")
                                .and_then(|x| x.as_str())
                                .unwrap_or("LLM生成")
                                .to_string(),
                            url: v.get("url").and_then(|x| x.as_str()).map(String::from),
                        })
                        .collect();
                    let hotspots_json = serde_json::json!({ "hotspots": hotspots });
                    SearchResult {
                        success: true,
                        hotspots: Some(hotspots),
                        keywords: None,
                        materials: None,
                        composite_score: None,
                        param_scores: None,
                        data: hotspots_json,
                        error: None,
                    }
                }
                Err(e) => SearchResult::err(&format!("解析选题失败: {} | {}", e, &json_str[..json_str.len().min(200)])),
            }
        }
        Err(e) => SearchResult::err(&e),
    }
}

/// Extract SEO keywords and suggestions using LLM (replaces seo_keywords.py)
#[tauri::command]
pub async fn seo_keywords(keywords: Vec<String>, topic: Option<String>) -> SearchResult {
    let topic_hint = topic.unwrap_or_else(|| keywords.join(" "));

    let system = "你是SEO专家，擅长提取公众号文章的关键词和标签。";
    let user = format!(
        r#"针对主题「{}」，生成10个SEO关键词和标签，返回纯JSON数组。格式：[{{"keyword":"关键词","seo_score":0-100,"related":["相关词1","相关词2"],"trending":"热度描述"}}]要求seo_score基于搜索量和竞争度综合评估。"#,
        topic_hint
    );

    match chat_complete(system, &user).await {
        Ok(text) => {
            let json_str = extract_json_block(&text);
            match serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
                Ok(items) => {
                    let keywords_out: Vec<KeywordResult> = items
                        .into_iter()
                        .map(|v| KeywordResult {
                            keyword: v.get("keyword")
                                .and_then(|x| x.as_str())
                                .unwrap_or("")
                                .to_string(),
                            seo_score: v.get("seo_score")
                                .and_then(|x| x.as_f64())
                                .unwrap_or(50.0),
                            related: v
                                .get("related")
                                .and_then(|x| x.as_array())
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|x| x.as_str())
                                        .map(String::from)
                                        .collect()
                                })
                                .unwrap_or_default(),
                            trending: v.get("trending").and_then(|x| x.as_str()).map(String::from),
                        })
                        .collect();
let data = serde_json::json!({ "keywords": keywords_out });
                    SearchResult {
                        success: true,
                        hotspots: None,
                        keywords: Some(keywords_out),
                        materials: None,
                        composite_score: None,
                        param_scores: None,
                        data,
                        error: None,
                    }
                }
                Err(e) => SearchResult::err(&format!("解析关键词失败: {} | {}", e, &json_str[..json_str.len().min(200)])),
            }
        }
        Err(e) => SearchResult::err(&e),
    }
}

/// Collect real materials (facts/data/cases) for a topic using LLM (replaces wewrite_search.py)
#[tauri::command]
pub async fn collect_materials(topic: String, framework: String, keywords: Vec<String>) -> SearchResult {
    let system = "你是资料研究员，擅长从公开信息中提取真实素材：具体数据、案例、引述、工具名、步骤参数等。";
    let keyword_hint = if keywords.is_empty() {
        String::new()
    } else {
        format!(" 相关关键词：{}", keywords.join("、"))
    };

    let user = format!(
        r#"针对主题「{}」（框架类型：{}），搜集真实素材{}。要求：5-8条真实素材，每条包含title/snippet/url字段，素材要具体（包含数字、案例名、引述），返回纯JSON数组。格式：[{{"title":"...","snippet":"...","url":"https://..."}},...]"#,
        topic, framework, keyword_hint
    );

    match chat_complete(system, &user).await {
        Ok(text) => {
            let json_str = extract_json_block(&text);
            match serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
                Ok(items) => {
                    let data = serde_json::json!({
                        "success": true,
                        "topic": topic,
                        "materials": items,
                    });
                    SearchResult {
                        success: true,
                        hotspots: None,
                        keywords: None,
                        materials: Some(items),
                        composite_score: None,
                        param_scores: None,
                        data,
                        error: None,
                    }
                }
                Err(e) => SearchResult::err(&format!("解析素材失败: {} | {}", e, &json_str[..json_str.len().min(200)])),
            }
        }
        Err(e) => SearchResult::err(&e),
    }
}

/// Score article humanness using LLM (replaces humanness_score.py)
#[tauri::command]
pub async fn humanness_score(article: String, tier3: Option<f64>) -> SearchResult {
    let tier3_hint = tier3.unwrap_or(0.5);

    let system = "你是一个专业的AI写作检测编辑。你分析文章中AI写作的痕迹，并给出修复建议和评分。";
    let user = &format!(
        r#"请分析以下公众号文章，评估其"人味"程度。

评分维度（每项0-100，越高越好）：
1. 句长方差（长短句交替，有明显节奏变化）
2. 词汇多样性（冷/温/热/野词混用）
3. 情绪表达（有明确观点、情感、个人态度）
4. 具体性（有真实数据、案例、细节）
5. 风格一致性（全文语气统一，无明显AI拼接感）
6. 开头质量（前3句有悬念/冲突，不平淡）

综合评分 composite_score = 上述6项平均分（0=完美，100=全是AI感）

返回纯JSON：
{{
  "composite_score": 35.5,
  "param_scores": {{
    "sentence_variance": 42,
    "vocab_diversity": 38,
    "emotion_expression": 55,
    "specificity": 60,
    "style_consistency": 28,
    "opening_quality": 45
  }},
  "issues": ["连续3段落句长接近","缺少负面情绪表达","开头为背景铺垫"],
  "suggestions": ["第3段建议拆分成长短交替","第2节可加入你的个人感受","开头换用悬念式切入"]
}}

文章内容：
{}"#,
        &article[..article.len().min(4000)]
    );

    match chat_complete(system, user).await {
        Ok(text) => {
            let json_str = extract_json_block(&text);
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(v) => {
                    let composite_score = v.get("composite_score").and_then(|x| x.as_f64());
                    let param_scores = v.get("param_scores").cloned();
                    let issues: Vec<String> = v
                        .get("issues")
                        .and_then(|x| x.as_array())
                        .map(|arr| arr.iter().filter_map(|x| x.as_str()).map(String::from).collect())
                        .unwrap_or_default();
                    let suggestions: Vec<String> = v
                        .get("suggestions")
                        .and_then(|x| x.as_array())
                        .map(|arr| arr.iter().filter_map(|x| x.as_str()).map(String::from).collect())
                        .unwrap_or_default();

                    SearchResult {
                        success: true,
                        hotspots: None,
                        keywords: None,
                        materials: None,
                        composite_score,
                        param_scores: param_scores.clone(),
                        data: serde_json::json!({
                            "composite_score": composite_score,
                            "param_scores": param_scores,
                            "issues": issues,
                            "suggestions": suggestions,
                        }),
                        error: None,
                    }
                }
                Err(e) => SearchResult::err(&format!("解析评分失败: {} | {}", e, &json_str[..json_str.len().min(200)])),
            }
        }
        Err(e) => SearchResult::err(&e),
    }
}

/// Check environment — no longer needs Python (always succeeds if API key is set)
#[tauri::command]
pub fn check_python_env() -> SearchResult {
    let config = get_config_map();
    let has_key = config.get("api_key").map(|s| !s.is_empty()).unwrap_or(false);
    let python_version = std::process::Command::new("python3")
        .arg("--version")
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    SearchResult {
        success: true,
        hotspots: None,
        keywords: None,
        materials: None,
        composite_score: None,
        param_scores: None,
        data: serde_json::json!({
            "python_version": python_version,
            "deps_ok": true,
            "has_api_key": has_key,
            "message": if has_key {
                "AI API Key 已配置，无需 Python 环境".to_string()
            } else {
                "请先在设置页配置 AI API Key".to_string()
            },
        }),
        error: None,
    }
}

/// Read visual prompts — builtin templates + optional skill_path override
#[tauri::command]
pub fn read_visual_prompts(skill_path: Option<String>) -> SearchResult {
    // Try skill_path override first
    if let Some(ref sp) = skill_path {
        if !sp.is_empty() {
            let path = std::path::Path::new(sp).join("references/visual-prompts.md");
            if path.exists() {
                if let Ok(content) = std::fs::read_to_string(&path) {
                    return parse_visual_prompts_from_content(&content);
                }
            }
        }
    }

    // Fall back to builtin prompts
    parse_visual_prompts_from_content(BUILTIN_VISUAL_PROMPTS)
}

fn parse_visual_prompts_from_content(content: &str) -> SearchResult {
    let cover_a = extract_english_prompt(content, "创意 A");
    let cover_b = extract_english_prompt(content, "创意 B");
    let cover_c = extract_english_prompt(content, "创意 C");

    SearchResult {
        success: true,
        hotspots: None,
        keywords: None,
        materials: None,
        composite_score: None,
        param_scores: None,
        data: serde_json::json!({
            "cover_a": {
                "name": "直觉冲击型",
                "description": "用视觉隐喻直接表达文章核心观点，适合热点类、观点类",
                "english_prompt_template": cover_a,
            },
            "cover_b": {
                "name": "氛围渲染型",
                "description": "营造情绪或场景氛围，适合故事类、情绪类",
                "english_prompt_template": cover_b,
            },
            "cover_c": {
                "name": "信息图表型",
                "description": "用简洁的图形/图标/数据可视化传递信息，适合干货类、清单类",
                "english_prompt_template": cover_c,
            },
            "inline_template": "16:9 aspect ratio, modern minimalist illustration, no text in image",
            "image_types": ["infographic", "scene", "flowchart", "comparison", "framework", "timeline"],
            "rules": {
                "aspect_ratio": "16:9",
                "no_text": true,
                "min_entities_per_prompt": 2,
            }
        }),
        error: None,
    }
}

fn extract_english_prompt(content: &str, section: &str) -> String {
    let section_idx = match content.find(section) {
        Some(idx) => idx,
        None => return String::new(),
    };
    let after_section = &content[section_idx..];

    let prompt_marker = "AI 绘图提示词：";
    let prompt_idx = match after_section.find(prompt_marker) {
        Some(idx) => idx + prompt_marker.len(),
        None => return String::new(),
    };
    let after_marker = &after_section[prompt_idx..];

    let lines: Vec<&str> = after_marker.lines().take(4).collect();
    let mut prompt = String::new();
    for line in lines {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("适配") || trimmed.starts_with("- ") {
            break;
        }
        let clean = trimmed.trim_matches('"').trim_matches('"');
        if !clean.is_empty() {
            if !prompt.is_empty() {
                prompt.push(' ');
            }
            prompt.push_str(clean);
        }
    }
    prompt
}
