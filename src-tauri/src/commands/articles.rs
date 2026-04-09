use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::db;

#[derive(Serialize, Deserialize)]
pub struct SaveArticleResult {
    pub file_path: String,
    pub id: i64,
}

fn slugify(title: &str) -> String {
    title
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == ' ' || c == '-' {
                if c == ' ' { '-' } else { c }
            } else {
                '-'
            }
        })
        .collect::<String>()
        .to_lowercase()
}

fn default_save_path() -> String {
    dirs::document_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from(".")))
        .join("WeWrite")
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
pub fn save_article(params: Value) -> Result<SaveArticleResult, String> {
    let title = params["title"]
        .as_str()
        .ok_or("缺少 title")?
        .to_string();
    let content = params["content"]
        .as_str()
        .ok_or("缺少 content")?
        .to_string();
    let framework = params["framework"].as_str().map(String::from);

    let conn = db::open().map_err(|e| e.to_string())?;

    // Get save path from config, fallback to default
    let save_path = {
        let mut stmt = conn
            .prepare("SELECT value FROM config WHERE key = 'save_path'")
            .map_err(|e| e.to_string())?;
        let row: Option<String> = stmt
            .query_row([], |row| row.get(0))
            .ok()
            .filter(|v: &String| !v.is_empty());
        row.unwrap_or_else(default_save_path)
    };

    let slug = slugify(&title);
    let date = chrono_lite_date();
    let filename = format!("{}-{}.md", date, slug);
    let dir = std::path::Path::new(&save_path);

    std::fs::create_dir_all(dir).map_err(|e| format!("创建目录失败: {}", e))?;

    let file_path = dir.join(&filename);
    std::fs::write(&file_path, &content).map_err(|e| format!("写入文件失败: {}", e))?;

    let word_count = content.chars().count() as i64;
    conn.execute(
        "INSERT INTO articles (date, title, slug, framework, word_count, file_path, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))",
        rusqlite::params![
            &date,
            &title,
            &slug,
            &framework,
            word_count,
            file_path.to_string_lossy().to_string(),
        ],
    )
    .map_err(|e| format!("保存记录失败: {}", e))?;

    let id = conn.last_insert_rowid();
    Ok(SaveArticleResult {
        file_path: file_path.to_string_lossy().to_string(),
        id,
    })
}

fn chrono_lite_date() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let days = now / 86400;
    // Days since 1970-01-01
    let mut year: u64 = 1970;
    let mut remaining = days;
    loop {
        let leap = if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { 366 } else { 365 };
        if remaining < leap { break; }
        remaining -= leap;
        year += 1;
    }
    let is_leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let days_in_months: &[u64] = if is_leap {
        &[31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        &[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };
    let mut month: u64 = 1;
    for d in days_in_months {
        if remaining < *d { break; }
        remaining -= d;
        month += 1;
    }
    let day = remaining + 1;
    format!("{:04}-{:02}-{:02}", year, month, day)
}

#[derive(Serialize, Deserialize)]
pub struct ArticleMeta {
    pub id: i64,
    pub date: String,
    pub title: String,
    pub slug: String,
    pub framework: Option<String>,
    pub word_count: Option<i64>,
    pub composite_score: Option<f64>,
    pub writing_persona: Option<String>,
    pub file_path: String,
    pub created_at: String,
}

#[tauri::command]
pub fn list_articles() -> Result<Vec<ArticleMeta>, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, date, title, slug, framework, word_count, composite_score, writing_persona, file_path, created_at
             FROM articles ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(ArticleMeta {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                slug: row.get(3)?,
                framework: row.get(4)?,
                word_count: row.get(5)?,
                composite_score: row.get(6)?,
                writing_persona: row.get(7)?,
                file_path: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut articles = Vec::new();
    for row in rows {
        articles.push(row.map_err(|e| e.to_string())?);
    }
    Ok(articles)
}

#[tauri::command]
pub fn open_article_folder(file_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&file_path);
    let folder = if path.is_dir() {
        path.to_path_buf()
    } else {
        path.parent()
            .ok_or("no parent directory")?
            .to_path_buf()
    };
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&folder)
        .spawn()
        .map_err(|e| e.to_string())?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(&folder)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_default_save_path() -> Result<String, String> {
    let path = dirs::document_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from(".")))
        .join("WeWrite");
    Ok(path.to_string_lossy().to_string())
}
