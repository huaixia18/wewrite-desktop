mod commands;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::config::get_config,
            commands::config::save_config,
            commands::articles::list_articles,
            commands::articles::open_article_folder,
            commands::articles::get_default_save_path,
            commands::humanizer::humanize,
            commands::humanizer::analyze_text,
            commands::exemplars::list_exemplars,
            commands::exemplars::import_exemplar,
            commands::exemplars::delete_exemplar,
            commands::pipeline::run_pipeline_step,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
