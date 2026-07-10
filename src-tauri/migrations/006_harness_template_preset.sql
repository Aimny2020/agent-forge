ALTER TABLE harness_templates ADD COLUMN created_from_preset TEXT;

INSERT OR IGNORE INTO _migrations (version) VALUES (6);
