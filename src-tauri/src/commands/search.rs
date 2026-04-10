use serde::{Deserialize, Serialize};
use std::process::Command;
use std::thread;

#[derive(Serialize, Deserialize)]
pub struct Hotspot {
    pub title: String,
    pub source: String,
    pub hot: f64,
    pub url: Option<String>,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SeoKeyword {
    pub keyword: String,
    pub seo_score: f64,
    pub related: Vec<String>,
    pub trending: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SearchResult {
    pub success: bool,
    pub data: serde_json::Value,
    pub error: Option<String>,
}

/// Run a Python script and parse its JSON output
fn run_python_script(script_path: &str, args: &[&str], _timeout_secs: u64) -> Result<String, String> {
    // Check if python3 is available
    let python_check = Command::new("python3").arg("--version").output();
    if python_check.is_err() {
        return Err("Python3 未安装或不在 PATH 中".to_string());
    }

    let mut cmd = Command::new("python3");
    cmd.arg(script_path);
    for arg in args {
        cmd.arg(arg);
    }

    // Set working directory to skill dir parent
    if let Some(parent) = std::path::Path::new(script_path).parent() {
        cmd.current_dir(parent);
    }

    let output = cmd
        .output()
        .map_err(|e| format!("执行脚本失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("脚本执行失败: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    if stdout.trim().is_empty() {
        return Err("脚本未返回内容".to_string());
    }

    Ok(stdout.to_string())
}

/// Fetch hotspots via Python script (fetch_hotspots.py)
#[tauri::command]
pub fn fetch_hotspots(skill_path: String, limit: usize) -> SearchResult {
    let script = std::path::Path::new(&skill_path).join("scripts/fetch_hotspots.py");
    if !script.exists() {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(format!("脚本不存在: {}", script.display())),
        };
    }

    let script_str = script.to_string_lossy().to_string();
    let limit_arg = limit.to_string();

    // Run in a separate thread to avoid blocking the Tauri main thread
    match thread::spawn(move || {
        run_python_script(&script_str, &["--limit", &limit_arg], 30)
    }).join() {
        Ok(Ok(json_str)) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(v) => SearchResult {
                    success: true,
                    data: v,
                    error: None,
                },
                Err(e) => SearchResult {
                    success: false,
                    data: serde_json::Value::Null,
                    error: Some(format!("JSON 解析失败: {} | 内容: {}", e, &json_str[..json_str.len().min(200)])),
                },
            }
        }
        Ok(Err(e)) => SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(e),
        },
        Err(_) => SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some("脚本执行超时或崩溃".to_string()),
        },
    }
}

/// Run SEO keyword analysis via Python script (seo_keywords.py)
#[tauri::command]
pub fn seo_keywords(skill_path: String, keywords: Vec<String>) -> SearchResult {
    let script = std::path::Path::new(&skill_path)
        .join("scripts/seo_keywords.py");
    if !script.exists() {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(format!("脚本不存在: {}", script.display())),
        };
    }

    let script_str = script.to_string_lossy().to_string();
    let keywords_arg = keywords.join(" ");

    match thread::spawn(move || {
        run_python_script(&script_str, &["--json", &keywords_arg], 20)
    }).join() {
        Ok(Ok(json_str)) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(v) => SearchResult { success: true, data: v, error: None },
                Err(e) => SearchResult {
                    success: false,
                    data: serde_json::Value::Null,
                    error: Some(format!("JSON 解析失败: {} | {}", e, &json_str[..json_str.len().min(200)])),
                },
            }
        }
        Ok(Err(e)) => SearchResult { success: false, data: serde_json::Value::Null, error: Some(e) },
        Err(_) => SearchResult { success: false, data: serde_json::Value::Null, error: Some("脚本执行超时".to_string()) },
    }
}

/// Collect real materials via wewrite_search.py materials subcommand
#[tauri::command]
pub fn collect_materials(skill_path: String, topic: String, framework: String, keywords: Vec<String>) -> SearchResult {
    let script = std::path::Path::new(&skill_path)
        .join("scripts/wewrite_search.py");
    if !script.exists() {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(format!("素材采集脚本不存在: {}", script.display())),
        };
    }

    let script_str = script.to_string_lossy().to_string();
    let mut args: Vec<String> = vec!["materials".to_string(), topic.clone(), framework.clone()];
    args.extend(keywords.clone());
    let handle = thread::spawn(move || {
        let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
        run_python_script(&script_str, &args_refs, 30)
    });

    match handle.join() {
        Ok(Ok(json_str)) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(v) => SearchResult { success: true, data: v, error: None },
                Err(e) => SearchResult {
                    success: false,
                    data: serde_json::Value::Null,
                    error: Some(format!("素材解析失败: {} | {}", e, &json_str[..json_str.len().min(200)])),
                },
            }
        }
        Ok(Err(e)) => SearchResult { success: false, data: serde_json::Value::Null, error: Some(e) },
        Err(_) => SearchResult { success: false, data: serde_json::Value::Null, error: Some("素材采集超时".to_string()) },
    }
}

/// Run humanness_score.py to measure article quality
#[tauri::command]
pub fn humanness_score(skill_path: String, article_path: String, tier3: Option<f64>) -> SearchResult {
    let script = std::path::Path::new(&skill_path).join("scripts/humanness_score.py");
    if !script.exists() {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(format!("humanness_score.py 不存在: {}", script.display())),
        };
    }

    let script_str = script.to_string_lossy().to_string();
    let path_arg = article_path.clone();
    let tier_arg = tier3.unwrap_or(0.5).to_string();

    let handle = thread::spawn(move || {
        run_python_script(&script_str, &["--json", "--tier3", &tier_arg, &path_arg], 30)
    });

    match handle.join() {
        Ok(Ok(json_str)) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(v) => SearchResult { success: true, data: v, error: None },
                Err(e) => SearchResult {
                    success: false,
                    data: serde_json::Value::Null,
                    error: Some(format!("评分解析失败: {} | {}", e, &json_str[..json_str.len().min(200)])),
                },
            }
        }
        Ok(Err(e)) => SearchResult { success: false, data: serde_json::Value::Null, error: Some(e) },
        Err(_) => SearchResult { success: false, data: serde_json::Value::Null, error: Some("评分脚本超时".to_string()) },
    }
}

/// Check if Python3 and required packages are available
#[tauri::command]
pub fn check_python_env(skill_path: String) -> SearchResult {
    // Check python3
    let python_check = Command::new("python3").arg("--version").output();
    let python_ok = python_check.is_ok();
    let python_ver = python_check
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    // Check required packages
    let pkg_check = Command::new("python3")
        .args(["-c", "import requests, bs4; print('ok')"])
        .output();

    let deps_ok = pkg_check
        .as_ref()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("ok"))
        .unwrap_or(false);

    // Check skill scripts exist
    let hotspots = std::path::Path::new(&skill_path).join("scripts/fetch_hotspots.py");
    let seo = std::path::Path::new(&skill_path).join("scripts/seo_keywords.py");
    let materials_script = std::path::Path::new(&skill_path).join("scripts/wewrite_search.py");

    let scripts_ok = hotspots.exists() && seo.exists() && materials_script.exists();

    SearchResult {
        success: python_ok && deps_ok && scripts_ok,
        data: serde_json::json!({
            "python_version": python_ver,
            "deps_ok": deps_ok,
            "has_hotspots_script": hotspots.exists(),
            "has_seo_script": seo.exists(),
            "has_materials_script": materials_script.exists(),
        }),
        error: if !python_ok {
            Some("Python3 未安装".to_string())
        } else if !deps_ok {
            Some("缺少 Python 依赖: pip install requests beautifulsoup4".to_string())
        } else if !scripts_ok {
            Some(format!("技能脚本目录不完整，请检查路径: {}", skill_path))
        } else {
            None
        },
    }
}

/// Read visual-prompts.md and return structured prompt content for Step 7 (配图).
#[tauri::command]
pub fn read_visual_prompts(skill_path: String) -> SearchResult {
    let path = std::path::Path::new(&skill_path).join("references/visual-prompts.md");
    if !path.exists() {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(format!("visual-prompts.md 不存在: {}", path.display())),
        };
    }

    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => {
            return SearchResult {
                success: false,
                data: serde_json::Value::Null,
                error: Some(format!("读取失败: {}", e)),
            }
        }
    };

    // Extract cover strategy prompts by finding the English prompt blocks after "AI 绘图提示词："
    let cover_a_prompt = extract_english_prompt(&content, "创意 A");
    let cover_b_prompt = extract_english_prompt(&content, "创意 B");
    let cover_c_prompt = extract_english_prompt(&content, "创意 C");

    // Extract inline image template guidance
    let inline_template = extract_section(&content, "内文配图通用要求")
        .unwrap_or_else(|| "16:9 aspect ratio, no text in image, minimalist style".to_string());

    let data = serde_json::json!({
        "cover_a": {
            "name": "直觉冲击型",
            "description": "用视觉隐喻直接表达文章核心观点，适合热点类、观点类",
            "english_prompt_template": cover_a_prompt,
        },
        "cover_b": {
            "name": "氛围渲染型",
            "description": "营造情绪或场景氛围，适合故事类、情绪类",
            "english_prompt_template": cover_b_prompt,
        },
        "cover_c": {
            "name": "信息图表型",
            "description": "用简洁的图形/图标/数据可视化传递信息，适合干货类、清单类",
            "english_prompt_template": cover_c_prompt,
        },
        "inline_template": inline_template,
        "image_types": ["infographic", "scene", "flowchart", "comparison", "framework", "timeline"],
        "rules": {
            "aspect_ratio": "16:9",
            "no_text": true,
            "min_entities_per_prompt": 2,
        }
    });

    SearchResult { success: true, data, error: None }
}

/// Extract the English AI image prompt that follows a section header (Chinese: "AI 绘图提示词：")
fn extract_english_prompt(content: &str, section: &str) -> String {
    let section_idx = match content.find(section) {
        Some(idx) => idx,
        None => return String::new(),
    };
    let after_section = &content[section_idx..];

    // Find "AI 绘图提示词：" after the section marker
    let prompt_marker = "AI 绘图提示词：";
    let prompt_idx = match after_section.find(prompt_marker) {
        Some(idx) => idx + prompt_marker.len(),
        None => return String::new(),
    };
    let after_marker = &after_section[prompt_idx..];

    // Extract quoted string or next few lines until a blank line or "适配工具"
    let lines: Vec<&str> = after_marker.lines().take(4).collect();
    let mut prompt = String::new();
    for line in lines {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("适配") || trimmed.starts_with("- ") {
            break;
        }
        // Remove surrounding quotes if present
        let clean = trimmed.trim_matches('"').trim_matches('"');
        if !clean.is_empty() {
            if !prompt.is_empty() {
                prompt.push_str(" ");
            }
            prompt.push_str(clean);
        }
    }
    prompt
}

/// Extract a named section from markdown content
fn extract_section(content: &str, section_name: &str) -> Option<String> {
    let lines: Vec<&str> = content.lines().collect();
    let mut in_section = false;
    let mut result = Vec::new();

    for (_i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed == section_name || trimmed.starts_with(&format!("## {}", section_name)) {
            in_section = true;
            continue;
        }
        if in_section {
            // Stop at next ## heading
            if trimmed.starts_with("## ") || trimmed.starts_with("# ") {
                break;
            }
            if !trimmed.is_empty() {
                result.push(trimmed.to_string());
            }
        }
    }

    if result.is_empty() {
        None
    } else {
        Some(result.join(" "))
    }
}
