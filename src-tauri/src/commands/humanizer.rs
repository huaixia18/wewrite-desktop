use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum Strictness {
    Relaxed,
    Standard,
    Strict,
}

#[derive(Serialize, Deserialize)]
pub struct HitLocation {
    pub paragraph_index: usize,
    pub sentence_index: usize,
    pub original: String,
    pub suggested: String,
}

#[derive(Serialize, Deserialize)]
pub struct HitRecord {
    pub rule_id: u8,
    pub pattern_name: String,
    pub layer: String,
    pub locations: Vec<HitLocation>,
    pub severity: f64,
}

#[derive(Serialize, Deserialize)]
pub struct HumanizeResult {
    pub original: String,
    pub fixed: String,
    pub hits: Vec<HitRecord>,
    pub hit_count: usize,
}

/// Core humanizer: detects and fixes AI writing patterns.
/// Implements a subset of the 29-rule Wikipedia AI writing detection system.
#[tauri::command]
pub fn humanize(content: String, strictness: Strictness) -> Result<HumanizeResult, String> {
    let mut fixed = content.clone();
    let mut hits: Vec<HitRecord> = Vec::new();

    // Rule 7: Overused AI vocabulary words
    let ai_vocab: &[(&str, &str)] = &[
        ("此外，", ""),
        ("值得注意的是，", ""),
        ("总体而言，", ""),
        ("综上所述，", ""),
        ("不可否认的是，", ""),
        ("毋庸置疑，", ""),
        ("与此同时，", ""),
        ("不得不说，", ""),
        ("可以说，", ""),
        ("深刻影响", "影响"),
        ("深远影响", "影响"),
        ("至关重要", "重要"),
        ("不可或缺", "必要"),
        ("举足轻重", "重要"),
        ("日新月异", "快速变化"),
        ("与时俱进", "跟上时代"),
    ];

    let min_severity = match strictness {
        Strictness::Relaxed => 0.7,
        Strictness::Standard => 0.4,
        Strictness::Strict => 0.0,
    };

    for (pattern, replacement) in ai_vocab {
        if fixed.contains(pattern) {
            let severity = 0.6;
            if severity >= min_severity {
                let paragraphs: Vec<&str> = fixed.split('\n').collect();
                let mut locations = Vec::new();
                for (pi, para) in paragraphs.iter().enumerate() {
                    if para.contains(pattern) {
                        locations.push(HitLocation {
                            paragraph_index: pi,
                            sentence_index: 0,
                            original: pattern.to_string(),
                            suggested: replacement.to_string(),
                        });
                    }
                }
                if !locations.is_empty() {
                    hits.push(HitRecord {
                        rule_id: 7,
                        pattern_name: format!("AI词汇: {}", pattern),
                        layer: "Language".to_string(),
                        locations,
                        severity,
                    });
                    if !replacement.is_empty() {
                        fixed = fixed.replace(pattern, replacement);
                    } else {
                        // Remove the filler phrase but keep rest of sentence
                        fixed = fixed.replace(pattern, "");
                    }
                }
            }
        }
    }

    // Rule 14: Em dash overuse — replace triple or double em dashes with comma or period
    let em_dash_count = fixed.matches('—').count();
    if em_dash_count > 2 {
        let severity = 0.5;
        if severity >= min_severity {
            hits.push(HitRecord {
                rule_id: 14,
                pattern_name: "破折号过度使用".to_string(),
                layer: "Style".to_string(),
                locations: vec![HitLocation {
                    paragraph_index: 0,
                    sentence_index: 0,
                    original: format!("全文含 {} 处破折号", em_dash_count),
                    suggested: "超过2处的破折号建议改为逗号或句号".to_string(),
                }],
                severity,
            });
        }
    }

    // Rule 28: Signposting — "让我们来看看" / "接下来" at start of paragraph
    let signposts = ["让我们来看看", "接下来，让", "首先，让我们", "下面我们来"];
    for sp in &signposts {
        if fixed.contains(sp) {
            let severity = 0.5;
            if severity >= min_severity {
                hits.push(HitRecord {
                    rule_id: 28,
                    pattern_name: format!("信号词: {}", sp),
                    layer: "Style".to_string(),
                    locations: vec![HitLocation {
                        paragraph_index: 0,
                        sentence_index: 0,
                        original: sp.to_string(),
                        suggested: "删除这个引导语，直接进入内容".to_string(),
                    }],
                    severity,
                });
                fixed = fixed.replace(sp, "");
            }
        }
    }

    let hit_count = hits.len();
    Ok(HumanizeResult {
        original: content,
        fixed,
        hits,
        hit_count,
    })
}

/// Analyze text quality metrics: sentence length variance, vocabulary temperature, etc.
#[tauri::command]
pub fn analyze_text(content: String) -> Result<serde_json::Value, String> {
    let sentences: Vec<&str> = content
        .split(|c| c == '。' || c == '！' || c == '？' || c == '…')
        .filter(|s| !s.trim().is_empty())
        .collect();

    let lengths: Vec<f64> = sentences.iter().map(|s| s.chars().count() as f64).collect();
    let n = lengths.len() as f64;
    if n == 0.0 {
        return Ok(serde_json::json!({ "error": "empty content" }));
    }
    let mean = lengths.iter().sum::<f64>() / n;
    let variance = lengths.iter().map(|l| (l - mean).powi(2)).sum::<f64>() / n;
    let std_dev = variance.sqrt();

    let paragraphs: Vec<&str> = content.split('\n').filter(|s| !s.trim().is_empty()).collect();
    let word_count: usize = content.chars().filter(|c| !c.is_whitespace()).count();

    Ok(serde_json::json!({
        "sentence_count": sentences.len(),
        "word_count": word_count,
        "paragraph_count": paragraphs.len(),
        "avg_sentence_length": mean,
        "sentence_length_std_dev": std_dev,
        "length_variance_ok": std_dev >= 15.0,
    }))
}
