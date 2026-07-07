CREATE TABLE IF NOT EXISTS skill_packages (
  skill_id TEXT PRIMARY KEY NOT NULL,
  source_kind TEXT NOT NULL,
  source_url TEXT,
  normalized_source TEXT,
  tracked_ref TEXT,
  installed_commit TEXT,
  trusted_commit TEXT,
  last_checked_at TEXT,
  FOREIGN KEY (skill_id) REFERENCES skills_user_meta(skill_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_packages_normalized_source
  ON skill_packages(normalized_source)
  WHERE normalized_source IS NOT NULL;

CREATE TABLE IF NOT EXISTS project_skill_states (
  project_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  installed_commit TEXT,
  sync_state TEXT NOT NULL DEFAULT 'current',
  PRIMARY KEY (project_id, skill_id),
  FOREIGN KEY (project_id, skill_id)
    REFERENCES project_skills(project_id, skill_id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO _migrations (version) VALUES (3);
