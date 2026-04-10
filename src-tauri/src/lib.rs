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
            commands::articles::save_article,
            commands::articles::write_temp_file,
            commands::humanizer::humanize,
            commands::humanizer::analyze_text,
            commands::exemplars::list_exemplars,
            commands::exemplars::import_exemplar,
            commands::exemplars::delete_exemplar,
            commands::pipeline::run_pipeline_step,
            commands::pipeline::write_article_streaming,
            commands::images::generate_image,
            commands::wechat::verify_wechat_connection,
            commands::migrate::migrate_articles,
            commands::search::fetch_hotspots,
            commands::search::seo_keywords,
            commands::search::collect_materials,
            commands::search::check_python_env,
            commands::search::humanness_score,
            commands::search::read_visual_prompts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
