use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct StepResult {
    pub step: u8,
    pub status: String,
    pub data: serde_json::Value,
    pub error: Option<String>,
}

/// Stub: run a pipeline step. In v1.0 this returns mock data.
/// Real AI calls will be implemented in v1.1 with SSE streaming.
#[tauri::command]
pub fn run_pipeline_step(step: u8, _params: serde_json::Value) -> Result<StepResult, String> {
    let data = match step {
        1 => serde_json::json!({
            "checks": [
                { "name": "AI API Key", "status": "unconfigured", "action": "go_settings" },
                { "name": "微信公众号凭证", "status": "skipped", "action": "configure" },
                { "name": "图片生成 API", "status": "skipped", "action": "configure" },
                { "name": "写作风格", "status": "unconfigured", "action": "guide" }
            ],
            "degradation": { "skip_publish": true, "skip_image_gen": true }
        }),
        2 => serde_json::json!({
            "topics": [
                { "title": "AI 写代码能替代初级程序员了吗？", "score": 88, "framework": "纯观点型", "seo_score": 85 },
                { "title": "用 Claude 写公众号三个月，我学到了什么", "score": 82, "framework": "复盘型", "seo_score": 78 },
                { "title": "为什么你的 AI 生成文章没人看", "score": 79, "framework": "痛点型", "seo_score": 80 }
            ]
        }),
        3 => serde_json::json!({
            "frameworks": [
                { "id": "pain_point", "name": "痛点型", "description": "先戳痛点，再给解法", "score": 85 },
                { "id": "story", "name": "故事型", "description": "用真实故事驱动观点", "score": 78 },
                { "id": "list", "name": "清单型", "description": "结构化干货清单", "score": 72 },
                { "id": "comparison", "name": "对比型", "description": "A vs B 拆解对比", "score": 68 },
                { "id": "hot_take", "name": "热点解读型", "description": "热点事件 + 深度观点", "score": 90 },
                { "id": "opinion", "name": "纯观点型", "description": "直接输出核心观点", "score": 75 },
                { "id": "review", "name": "复盘型", "description": "复盘经历，提炼经验", "score": 65 }
            ],
            "materials": []
        }),
        4 => serde_json::json!({
            "status": "streaming",
            "message": "请配置 AI API Key 后开始写作"
        }),
        5 => serde_json::json!({
            "status": "ready",
            "message": "请先完成写作步骤"
        }),
        _ => serde_json::json!({ "status": "not_implemented" }),
    };

    Ok(StepResult {
        step,
        status: "ok".to_string(),
        data,
        error: None,
    })
}
