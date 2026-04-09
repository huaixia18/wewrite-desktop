use serde_json::Value;
use std::collections::HashMap;

use crate::db;

#[tauri::command]
pub fn get_config() -> Result<HashMap<String, String>, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM config")
        .map_err(|e| e.to_string())?;
    let mut map = HashMap::new();
    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;
    for row in rows {
        let (k, v) = row.map_err(|e| e.to_string())?;
        map.insert(k, v);
    }
    Ok(map)
}

#[tauri::command]
pub fn save_config(updates: Value) -> Result<(), String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    let obj = updates.as_object().ok_or("expected object")?;
    for (key, val) in obj {
        let value = match val {
            Value::String(s) => s.clone(),
            other => other.to_string(),
        };
        conn.execute(
            "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?1, ?2, datetime('now'))",
            rusqlite::params![key, value],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
