use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub fn get_db_path() -> PathBuf {
    let base = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("com.wewrite.desktop");
    std::fs::create_dir_all(&base).ok();
    base.join("wewrite.db")
}

pub fn init_db(conn: &Connection) -> Result<()> {
    conn.execute_batch(include_str!("schema.sql"))?;
    Ok(())
}

pub fn open() -> Result<Connection> {
    let path = get_db_path();
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    init_db(&conn)?;
    Ok(conn)
}
