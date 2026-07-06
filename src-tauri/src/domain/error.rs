#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("database unavailable: {0}")]
    Database(String),
    #[error("application data directory is unavailable")]
    AppDataDirectory,
}

pub type DomainResult<T> = Result<T, DomainError>;
