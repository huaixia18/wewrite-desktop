use serde::{Deserialize, Serialize};
use std::process::Command;
use std::thread;
use std::time::Duration;

#[derive(Serialize, Deserialize)]
pub struct SearchResult {
    pub success: bool,
    pub data: serde_json::Value,
    pub error: Option<String>,
}

/// Run a Python script and return its stdout as string
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

    // Set working directory to scripts/ parent
    if let Some(scripts_dir) = std::path::Path::new(script_path).parent() {
        if let Some(skill_dir) = scripts_dir.parent() {
            cmd.current_dir(skill_dir);
        }
    }

    let output = cmd
        .output()
        .map_err(|e| format!("执行脚本失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("脚本执行失败 (exit {}): {}", output.status, stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    if stdout.trim().is_empty() {
        return Err("脚本未返回内容".to_string());
    }

    Ok(stdout.to_string())
}

/// Fetch hotspots via fetch_hotspots.py
#[tauri::command]
pub fn fetch_hotspots(skill_path: String, limit: usize) -> SearchResult {
    let script = std::path::Path::new(&skill_path)
        .join("scripts/fetch_hotspots.py");
    if !script.exists() {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(format!("脚本不存在: {}", script.display())),
        };
    }

    let script_str = script.to_string_lossy().to_string();
    let limit_str = limit.to_string();

    let handle = thread::spawn(move || {
        run_python_script(&script_str, &["--limit", &limit_str], 30)
    });

    match handle.join() {
        Ok(Ok(json_str)) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(v) => SearchResult { success: true, data: v, error: None },
                Err(e) => SearchResult {
                    success: false,
                    data: serde_json::Value::Null,
                    error: Some(format!("JSON 解析失败: {} | {}", e, &json_str[..json_str.len().min(300)])),
                },
            }
        }
        Ok(Err(e)) => SearchResult { success: false, data: serde_json::Value::Null, error: Some(e) },
        Err(_) => SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some("脚本执行超时或崩溃".to_string()),
        },
    }
}

/// Run SEO keyword analysis via seo_keywords.py
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
    let kw_str = keywords.join(" ");

    let handle = thread::spawn(move || {
        run_python_script(&script_str, &["--json", &kw_str], 20)
    });

    match handle.join() {
        Ok(Ok(json_str)) => {
            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(v) => SearchResult { success: true, data: v, error: None },
                Err(e) => SearchResult {
                    success: false,
                    data: serde_json::Value::Null,
                    error: Some(format!("JSON 解析失败: {}", e)),
                },
            }
        }
        Ok(Err(e)) => SearchResult { success: false, data: serde_json::Value::Null, error: Some(e) },
        Err(_) => SearchResult { success: false, data: serde_json::Value::Null, error: Some("脚本执行超时".to_string()) },
    }
}

/// Collect real materials via DuckDuckGo search (no API key needed)
#[tauri::command]
pub fn collect_materials(skill_path: String, topic: String, framework: String, keywords: Vec<String>) -> SearchResult {
    // Check python3 + requests/bs4
    let pkg_check = Command::new("python3")
        .args(["-c", "import requests, bs4; print('ok')"])
        .output();

    if pkg_check.is_err() || !String::from_utf8_lossy(&pkg_check.as_ref().ok().map(|o| &o.stdout[..]).unwrap_or(&[][..])).contains("ok") {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some("缺少 Python 依赖，请运行: pip install requests beautifulsoup4".to_string()),
        };
    }

    // Build search query based on framework
    let search_query = if framework.contains("热点") || framework.contains("观点") {
        format!("\"{}\" 观点 OR 评论 OR 分析 site:mp.weixin.qq.com OR site:36kr.com", topic)
    } else if framework.contains("痛点") || framework.contains("清单") {
        format!("\"{}\" 教程 OR 工具 OR 实操 OR 数据 报告", topic)
    } else if framework.contains("故事") || framework.contains("复盘") {
        format!("\"{}\" 采访 OR 专访 OR 细节 OR 真实经历", topic)
    } else if framework.contains("对比") {
        format!("\"{}\" vs 评测 OR 体验 OR 踩坑 OR 缺点 site:v2ex.com OR site:zhihu.com", topic)
    } else {
        format!("\"{}\" 分析 OR 观点 OR 教程", topic)
    };

    // Inject keywords if provided
    let kw_filter = if !keywords.is_empty() {
        format!(" + {}", keywords.iter().take(3).cloned().collect::<Vec<_>>().join(" OR "))
    } else {
        String::new()
    };

    let full_query = format!("{}{}", search_query, kw_filter);

    let python_code = format!(r##"
import sys
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote

query = "{}"

headers = {{
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}}

try:
    search_url = "https://html.duckduckgo.com/html/?q=" + quote(query)
    resp = requests.get(search_url, headers=headers, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")

    materials = []
    for result in soup.select(".result")[:8]:
        title_el = result.select_one(".result__title a")
        snippet_el = result.select_one(".result__snippet")
        if title_el and snippet_el:
            title = title_el.get_text(strip=True)
            snippet = snippet_el.get_text(strip=True)
            href = title_el.get("href", "")
            # Skip generic sites
            if any(x in href for x in ["baidu", "sina", "sohu"]):
                continue
            materials.append({{
                "title": title[:200],
                "snippet": snippet[:500],
                "url": href[:300]
            }})

    print(json.dumps({{
        "success": True,
        "materials": materials,
        "query": query,
        "source": "duckduckgo"
    }}))
except Exception as e:
    print(json.dumps({{
        "success": False,
        "error": str(e),
        "materials": []
    }}))
"##, full_query.replace('"', r#"\""#));

    let handle = thread::spawn(move || {
        let output = Command::new("python3")
            .arg("-c")
            .arg(&python_code)
            .output()
            .map_err(|e| format!("执行失败: {}", e))?;
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
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

/// Check Python environment and skill scripts availability
#[tauri::command]
pub fn check_python_env(skill_path: String) -> SearchResult {
    // Check python3
    let python_check = Command::new("python3").arg("--version").output();
    if python_check.is_err() {
        return SearchResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some("Python3 未安装".to_string()),
        };
    }
    let python_ver = String::from_utf8_lossy(
        &python_check.ok().map(|o| o.stdout).unwrap_or_default()
    ).trim().to_string();

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

    let scripts_ok = hotspots.exists() && seo.exists();

    SearchResult {
        success: deps_ok && scripts_ok,
        data: serde_json::json!({
            "python_version": python_ver,
            "deps_ok": deps_ok,
            "has_hotspots_script": hotspots.exists(),
            "has_seo_script": seo.exists(),
        }),
        error: if !deps_ok {
            Some("缺少 Python 依赖: pip install requests beautifulsoup4".to_string())
        } else if !scripts_ok {
            Some(format!("技能脚本目录不完整，请检查路径: {}", skill_path))
        } else {
            None
        },
    }
}
"##,
        skill_path: String,
    }
}
"##, search_query.replace('"', r#"\""#));

I'm realizing there's a fundamental problem with this approach—I'm embedding Python code as a string in Rust, which is becoming unwieldy and error-prone. Instead, I should create a standalone Python helper script that the Rust code can invoke cleanly with arguments, keeping the logic separate from the Rust codebase.
</think>

语法复杂了，改用更干净的方案——创建一个独立的 Python 辅助脚本，Tauri 只做 subprocess 调用：
<minimax:tool_call>
<invoke name="Write">
<parameter name="content">#!/usr/bin/env python3
"""
wewrite_search.py — 素材采集辅助脚本
由 Tauri 桌面应用通过 subprocess 调用

用法：
  python3 wewrite_search.py hotspots --limit 30
  python3 wewrite_search.py keywords "AI大模型" "科技"
  python3 wewrite_search.py materials "AI Agent" "热点解读" "AI,大模型,工具"
"""

import sys
import json
import argparse
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}
TIMEOUT = 15


def cmd_hotspots(limit: int):
    """抓取热搜 via fetch_hotspots.py"""
    import os as _os
    script_dir = _os.path.dirname(_os.path.abspath(__file__))
    # Try to import from same dir first
    sys.path.insert(0, script_dir)
    try:
        from fetch_hotspots import fetch_all
        results = fetch_all(limit=limit)
        print(json.dumps({"success": True, "hotspots": results}))
    except ImportError:
        # Fallback: direct web scraping of Weibo
        try:
            resp = requests.get(
                "https://weibo.com/ajax/side/hotSearch",
                headers=HEADERS,
                timeout=TIMEOUT
            )
            data = resp.json()
            items = data.get("data", {}).get("realtime", [])[:limit]
            results = [
                {
                    "title": it.get("word", ""),
                    "hot": it.get("raw_hot", 0),
                    "source": "weibo",
                    "url": f"https://s.weibo.com/weibo?q={quote(it.get('word', ''))}",
                }
                for it in items
                if it.get("word")
            ]
            print(json.dumps({"success": True, "hotspots": results}))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e), "hotspots": []}))


def cmd_keywords(keywords: list[str]):
    """SEO 关键词分析 via seo_keywords.py"""
    import os as _os
    script_dir = _os.path.dirname(_os.path.abspath(__file__))
    sys.path.insert(0, script_dir)
    try:
        from seo_keywords import analyze_keywords
        results = [analyze_keywords(kw) for kw in keywords]
        print(json.dumps({"success": True, "keywords": results}))
    except ImportError:
        # Fallback: simple search volume proxy via Baidu
        try:
            baidu_results = []
            for kw in keywords:
                url = f"https://www.baidu.com/s?wd={quote(kw)}"
                resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
                soup = BeautifulSoup(resp.text, "html.parser")
                # Try to get result count
                result_text = soup.select_one(".nums_text")
                count = result_text.get_text(strip=True) if result_text else ""
                baidu_results.append({
                    "keyword": kw,
                    "baidu_count": count,
                    "related": [],
                })
            print(json.dumps({"success": True, "keywords": baidu_results}))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e), "keywords": []}))


def cmd_materials(topic: str, framework: str, keywords: list[str]):
    """采集真实素材 via DuckDuckGo 搜索"""
    # Build search query based on framework
    kw_extra = " OR ".join(keywords[:3]) if keywords else ""

    if "热点" in framework or "观点" in framework:
        base_q = f'"{topic}" (观点 OR 评论 OR 分析) (site:mp.weixin.qq.com OR site:36kr.com OR site:zhihu.com)'
    elif "痛点" in framework or "清单" in framework:
        base_q = f'"{topic}" (教程 OR 工具 OR 实操 OR 数据 报告 OR 使用方法)'
    elif "故事" in framework or "复盘" in framework:
        base_q = f'"{topic}" (采访 OR 专访 OR 细节 OR 真实经历 OR 案例)'
    elif "对比" in framework:
        base_q = f'"{topic}" (评测 OR 体验 OR 踩坑 OR 缺点) (site:v2ex.com OR site:zhihu.com OR site:douban.com)'
    else:
        base_q = f'"{topic}" (分析 OR 观点 OR 教程 OR 方法)'

    if kw_extra:
        query = f"({base_q}) AND ({kw_extra})"
    else:
        query = base_q

    try:
        search_url = "https://html.duckduckgo.com/html/?q=" + quote(query)
        resp = requests.get(search_url, headers=HEADERS, timeout=TIMEOUT)
        soup = BeautifulSoup(resp.text, "html.parser")

        materials = []
        seen_titles = set()
        for result in soup.select(".result")[:10]:
            title_el = result.select_one(".result__title a")
            snippet_el = result.select_one(".result__snippet")
            if not (title_el and snippet_el):
                continue
            title = title_el.get_text(strip=True)[:200]
            snippet = snippet_el.get_text(strip=True)[:500]
            url = title_el.get("href", "")[:300]

            # Skip low-quality sources
            skip_domains = ["baidu.com", "sina.com", "sohu.com", "ifeng.com",
                           "163.com", "qq.com", "baike.baidu"]
            if any(d in url for d in skip_domains):
                continue
            if title in seen_titles:
                continue
            seen_titles.add(title)

            materials.append({
                "title": title,
                "snippet": snippet,
                "url": url,
            })

        # Also try WeChat search via Sogou
        try:
            sogou_url = f"https://weixin.sogou.com/weixin?type=2&query={quote(topic)}&ie=utf8"
            sogou_resp = requests.get(sogou_url, headers=HEADERS, timeout=TIMEOUT)
            sogou_soup = BeautifulSoup(sogou_resp.text, "html.parser")
            for item in sogou_soup.select(".txt-box")[:5]:
                t_el = item.select_one(".tit a")
                p_el = item.select_one(".txt-info")
                if not t_el:
                    continue
                title = t_el.get_text(strip=True)[:200]
                snippet = p_el.get_text(strip=True)[:300] if p_el else ""
                url = t_el.get("href", "")
                if title not in seen_titles:
                    seen_titles.add(title)
                    materials.append({
                        "title": title,
                        "snippet": snippet,
                        "url": url,
                    })
        except Exception:
            pass  # Sogou is optional, don't fail if it doesn't work

        print(json.dumps({
            "success": True,
            "topic": topic,
            "framework": framework,
            "materials": materials,
            "query_used": query,
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "materials": []}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WeWrite 素材采集工具")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_h = sub.add_parser("hotspots", help="抓取热搜")
    p_h.add_argument("--limit", type=int, default=30)

    p_kw = sub.add_parser("keywords", help="SEO 关键词分析")
    p_kw.add_argument("keywords", nargs="+", help="关键词列表")

    p_mat = sub.add_parser("materials", help="采集素材")
    p_mat.add_argument("topic", help="主题")
    p_mat.add_argument("framework", help="框架类型")
    p_mat.add_argument("keywords", nargs="*", default=[], help="附加关键词")

    args = parser.parse_args()

    if args.cmd == "hotspots":
        cmd_hotspots(args.limit)
    elif args.cmd == "keywords":
        cmd_keywords(args.keywords)
    elif args.cmd == "materials":
        cmd_materials(args.topic, args.framework, args.keywords)
