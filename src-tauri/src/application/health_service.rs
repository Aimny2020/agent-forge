use std::sync::Arc;

use crate::domain::error::DomainResult;
use crate::domain::health::{DatabasePort, HealthReport, SystemInfoPort};

pub struct HealthService {
    database: Arc<dyn DatabasePort>,
    system: Arc<dyn SystemInfoPort>,
}

impl HealthService {
    pub fn new(database: Arc<dyn DatabasePort>, system: Arc<dyn SystemInfoPort>) -> Self {
        Self { database, system }
    }

    pub fn check(&self) -> DomainResult<HealthReport> {
        Ok(HealthReport::new(
            self.system.version(),
            self.system.platform(),
            self.database.status()?,
        ))
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::HealthService;
    use crate::domain::error::DomainResult;
    use crate::domain::health::{DatabasePort, DatabaseStatus, SystemInfoPort};

    struct ReadyDatabase;

    impl DatabasePort for ReadyDatabase {
        fn status(&self) -> DomainResult<DatabaseStatus> {
            Ok(DatabaseStatus::Ready)
        }
    }

    struct MacSystem;

    impl SystemInfoPort for MacSystem {
        fn version(&self) -> &str {
            "0.1.0"
        }

        fn platform(&self) -> &str {
            "macos"
        }
    }

    #[test]
    fn health_service_combines_system_and_database_status() {
        let service = HealthService::new(Arc::new(ReadyDatabase), Arc::new(MacSystem));

        let report = service.check().expect("health check should succeed");

        assert_eq!(report.version, "0.1.0");
        assert_eq!(report.platform, "macos");
        assert_eq!(report.database, DatabaseStatus::Ready);
        assert!(report.ready);
    }
}
