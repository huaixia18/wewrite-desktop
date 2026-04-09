use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct WechatVerifyResult {
    pub success: bool,
    pub message: String,
    pub access_token: Option<String>,
}

/// Verify WeChat app credentials by requesting an access token.
/// WeChat API: https://api.weixin.qq.com/cgi-bin/token
#[tauri::command]
pub async fn verify_wechat_connection(
    app_id: String,
    app_secret: String,
) -> Result<WechatVerifyResult, String> {
    if app_id.is_empty() || app_secret.is_empty() {
        return Ok(WechatVerifyResult {
            success: false,
            message: "AppID 和 AppSecret 不能为空".to_string(),
            access_token: None,
        });
    }

    let url = format!(
        "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={}&secret={}",
        app_id, app_secret
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let body: serde_json::Value = resp.json().await.map_err(|e| format!("解析响应失败: {}", e))?;

    if let Some(access_token) = body.get("access_token").and_then(|v| v.as_str()) {
        Ok(WechatVerifyResult {
            success: true,
            message: "连接成功".to_string(),
            access_token: Some(access_token.to_string()),
        })
    } else {
        let err_msg = body
            .get("errmsg")
            .and_then(|v| v.as_str())
            .unwrap_or("未知错误");
        Ok(WechatVerifyResult {
            success: false,
            message: format!("连接失败: {}", err_msg),
            access_token: None,
        })
    }
}
