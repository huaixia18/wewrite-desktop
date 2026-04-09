use std::fs;

#[tauri::command]
pub fn migrate_articles(old_path: String, new_path: String) -> Result<serde_json::Value, String> {
    let old_dir = std::path::Path::new(&old_path);
    let new_dir = std::path::Path::new(&new_path);

    if !old_dir.exists() {
        return Ok(serde_json::json!({ "moved": 0, "skipped": 0, "errors": [] }));
    }

    fs::create_dir_all(new_dir).map_err(|e| format!("创建目标目录失败: {}", e))?;

    let entries = fs::read_dir(old_dir).map_err(|e| format!("读取源目录失败: {}", e))?;

    let mut moved = 0;
    let mut skipped = 0;
    let mut errors: Vec<String> = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let dest = new_dir.join(path.file_name().unwrap());
            match fs::copy(&path, &dest) {
                Ok(_) => moved += 1,
                Err(e) => {
                    errors.push(format!("{}: {}", path.display(), e));
                }
            }
        } else {
            skipped += 1;
        }
    }

    Ok(serde_json::json!({
        "moved": moved,
        "skipped": skipped,
        "errors": errors
    }))
}
