-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- 技能配置属性表（移除了 is_enabled 字段）
CREATE TABLE IF NOT EXISTS skills_user_meta (
  skill_id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT,
  user_notes TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 项目技能关联启用表
CREATE TABLE IF NOT EXISTS project_skills (
  project_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  enabled_at TEXT NOT NULL,
  PRIMARY KEY (project_id, skill_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills_user_meta(skill_id) ON DELETE CASCADE
);


