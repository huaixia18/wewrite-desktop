use serde::{Deserialize, Serialize};

use crate::db;

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
