use crate::{utc_timestamp, Result};
use serde_json::{Map, Value};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

const MAX_LOG_BYTES: u64 = 256 * 1024;

pub fn read_config(path: &Path) -> Map<String, Value> {
    let Ok(raw) = fs::read_to_string(path) else {
        return Map::new();
    };
    match serde_json::from_str::<Value>(&raw) {
        Ok(Value::Object(map)) => map,
        _ => Map::new(),
    }
}

pub fn save_config_merge(path: &Path, incoming: &Map<String, Value>) -> Result<Map<String, Value>> {
    let mut merged = read_config(path);
    for (k, v) in incoming {
        merged.insert(k.clone(), v.clone());
    }
    let json = serde_json::to_string_pretty(&Value::Object(merged.clone()))?;
    atomic_write(path, json.as_bytes())?;
    Ok(merged)
}

pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut tmp = path.as_os_str().to_os_string();
    tmp.push(".tmp");
    let tmp_path = std::path::PathBuf::from(tmp);

    fs::write(&tmp_path, bytes)?;
    if fs::rename(&tmp_path, path).is_err() {
        fs::write(path, bytes)?;
        let _ = fs::remove_file(&tmp_path);
    }
    Ok(())
}

pub fn append_log(log_file: &Path, msg: &str, echo_stdout: bool) {
    let line = format!("[{}] {}\n", utc_timestamp(), msg);
    if let Ok(meta) = fs::metadata(log_file) {
        if meta.len() > MAX_LOG_BYTES {
            let _ = fs::write(log_file, b"");
        }
    }
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(log_file) {
        let _ = f.write_all(line.as_bytes());
    }
    if echo_stdout {
        let _ = std::io::stdout().write_all(line.as_bytes());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn atomic_write_and_merge_config() {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("agy_cfg_test_{stamp}"));
        let cfg_path = dir.join("theme_config.json");

        let mut init = Map::new();
        init.insert("themeName".into(), json!("Furina Live"));
        init.insert("dimming".into(), json!(37));
        save_config_merge(&cfg_path, &init).unwrap();

        let mut patch = Map::new();
        patch.insert("dimming".into(), json!(45));
        patch.insert("wpMode".into(), json!("video"));
        let merged = save_config_merge(&cfg_path, &patch).unwrap();

        assert_eq!(merged.get("themeName"), Some(&json!("Furina Live")));
        assert_eq!(merged.get("dimming"), Some(&json!(45)));
        assert_eq!(merged.get("wpMode"), Some(&json!("video")));
        assert!(!cfg_path.with_extension("json.tmp").exists());

        let log_path = dir.join("daemon.log");
        append_log(&log_path, "line1", false);
        assert!(fs::read_to_string(&log_path).unwrap().contains("line1"));

        let _ = fs::remove_dir_all(&dir);
    }
}
