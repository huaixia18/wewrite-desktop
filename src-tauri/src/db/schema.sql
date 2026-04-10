-- WeWrite Desktop SQLite Schema

CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    framework TEXT,
    enhance_strategy TEXT,
    word_count INTEGER,
    composite_score REAL,
    writing_persona TEXT,
    closing_type TEXT,
    file_path TEXT NOT NULL,
    media_id TEXT,
    topic_keywords TEXT,
    dimensions TEXT,
    writing_config TEXT,
    seo_metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exemplars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    file_path TEXT NOT NULL,
    sentence_score REAL,
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playbook_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule TEXT NOT NULL,
    why TEXT,
    how_to_apply TEXT,
    confidence INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    css_path TEXT NOT NULL,
    preview_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    params TEXT,
    result TEXT,
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default config values
INSERT OR IGNORE INTO config (key, value) VALUES
    ('ai_provider', 'claude'),
    ('ai_model', 'claude-sonnet-4-6'),
    ('article_save_path', ''),
    ('humanizer_strictness', 'standard'),
    ('writing_persona', 'midnight-friend'),
    ('sentence_variance', '0.7'),
    ('paragraph_rhythm', 'chaotic'),
    ('emotional_arc', 'restrained_to_burst'),
    ('broken_sentence_rate', '0.04'),
    ('negative_emotion_floor', '0.20'),
    ('skip_publish', 'true'),
    ('skip_image_gen', 'true');
