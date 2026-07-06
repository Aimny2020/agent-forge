use crate::domain::health::SystemInfoPort;

pub struct PlatformSystem {
    version: &'static str,
    platform: &'static str,
}

impl PlatformSystem {
    pub fn current() -> Self {
        Self {
            version: env!("CARGO_PKG_VERSION"),
            platform: std::env::consts::OS,
        }
    }
}

impl SystemInfoPort for PlatformSystem {
    fn version(&self) -> &str {
        self.version
    }

    fn platform(&self) -> &str {
        self.platform
    }
}
