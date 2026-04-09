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
