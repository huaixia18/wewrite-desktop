use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct GenerateImageRequest {
    pub prompt: String,
    pub model: Option<String>,
    pub aspect_ratio: Option<String>,
    pub size: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageData {
    pub url: String,
    pub revised_prompt: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GenerateImageResult {
    pub images: Vec<ImageData>,
    pub raw_response: Option<String>,
}

/// Generate image via OpenAI-compatible API (dall-e, flux, etc.)
#[tauri::command]
pub async fn generate_image(
    prompt: String,
    model: Option<String>,
    aspect_ratio: Option<String>,
    size: Option<String>,
    api_key: Option<String>,
    base_url: Option<String>,
) -> Result<GenerateImageResult, String> {
    let key = api_key.ok_or("未配置图片生成 API Key")?;
    let base = base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string());
    let model_name = model.unwrap_or_else(|| "dall-e-3".to_string());

    let client = reqwest::Client::new();

    let mut body = serde_json::json!({
        "model": model_name,
        "prompt": prompt,
    });

    if let Some(ar) = aspect_ratio {
        body["aspect_ratio"] = serde_json::Value::String(ar);
    } else if let Some(sz) = size {
        body["size"] = serde_json::Value::String(sz);
    } else {
        body["size"] = serde_json::Value::String("1792x1024".to_string());
    }

    let url = format!("{}/images/generations", base.trim_end_matches('/'));

    let resp = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| format!("读取响应失败: {}", e))?;

    if !status.is_success() {
        return Err(format!("API 返回错误 ({}): {}", status, text));
    }

    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("解析 JSON 失败: {}", e))?;

    // Parse OpenAI response format
    let mut images = Vec::new();
    if let Some(data_arr) = json["data"].as_array() {
        for item in data_arr {
            let url = item["url"]
                .as_str()
                .unwrap_or("")
                .to_string();
            let revised_prompt = item["revised_prompt"]
                .as_str()
                .map(|s| s.to_string());
            if !url.is_empty() {
                images.push(ImageData { url, revised_prompt });
            }
        }
    }

    if images.is_empty() {
        return Err(format!("未返回图片数据: {}", text));
    }

    Ok(GenerateImageResult {
        images,
        raw_response: Some(text),
    })
}
