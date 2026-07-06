use crate::domain::error::DomainResult;

pub trait DatabasePort: Send + Sync {
    fn status(&self) -> DomainResult<DatabaseStatus>;
}

pub trait SystemInfoPort: Send + Sync {
    fn version(&self) -> &str;
    fn platform(&self) -> &str;
}

#[derive(Debug, Clone, serde::Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HealthReport {
    pub version: String,
    pub platform: String,
    pub database: DatabaseStatus,
    pub ready: bool,
}

impl HealthReport {
    pub fn new(
        version: impl Into<String>,
        platform: impl Into<String>,
        database: DatabaseStatus,
    ) -> Self {
        let ready = database == DatabaseStatus::Ready;
        Self {
            version: version.into(),
            platform: platform.into(),
            database,
            ready,
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum DatabaseStatus {
    Ready,
    Unavailable,
}

#[cfg(test)]
mod tests {
    use super::{DatabaseStatus, HealthReport};

    #[test]
    fn health_report_exposes_ready_database() {
        let report = HealthReport::new("0.1.0", "macos", DatabaseStatus::Ready);

        assert!(report.ready);
        assert_eq!(report.database, DatabaseStatus::Ready);
    }
}
