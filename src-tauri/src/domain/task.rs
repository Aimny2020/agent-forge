#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct TaskRunId(String);

impl TaskRunId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProcessStatus {
    Starting,
    Running,
    Exited { code: Option<i32> },
}
