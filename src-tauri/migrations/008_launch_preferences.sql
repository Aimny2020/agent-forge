CREATE TABLE IF NOT EXISTS launch_preferences (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  macos_terminal TEXT NOT NULL,
  windows_terminal TEXT NOT NULL,
  launch_presentation TEXT NOT NULL,
  show_command_preview INTEGER NOT NULL,
  check_environment INTEGER NOT NULL,
  check_permissions INTEGER NOT NULL,
  allow_copy_command_fallback INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO _migrations (version) VALUES (8);
