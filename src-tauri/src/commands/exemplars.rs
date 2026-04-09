use serde::{Deserialize, Serialize};

use crate::db;

#[derive(Serialize, Deserialize)]
pub struct Exemplar {
    pub id: i64,
    pub title: String,
    pub category: String,
    pub file_path: String,
    pub sentence_score: Option<f64>,
    pub imported_at: String,
}

#[tauri::command]
pub fn list_exemplars() -> Result<Vec<Exemplar>, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, category, file_path, sentence_score, imported_at
             FROM exemplars ORDER BY imported_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Exemplar {
                id: row.get(0)?,
                title: row.get(1)?,
                category: row.get(2)?,
                file_path: row.get(3)?,
                sentence_score: row.get(4)?,
                imported_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut exemplars = Vec::new();
    for row in rows {
        exemplars.push(row.map_err(|e| e.to_string())?);
    }
    Ok(exemplars)
}

#[tauri::command]
pub fn import_exemplar(
    title: String,
    category: String,
    file_path: String,
) -> Result<i64, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO exemplars (title, category, file_path, imported_at) VALUES (?1, ?2, ?3, datetime('now'))",
        rusqlite::params![title, category, file_path],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn delete_exemplar(id: i64) -> Result<(), String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM exemplars WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
