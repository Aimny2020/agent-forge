export type DatabaseStatus = 'ready' | 'unavailable';

export interface HealthReport {
  version: string;
  platform: string;
  database: DatabaseStatus;
  ready: boolean;
}

export interface CommandFailure {
  code: string;
  message: string;
  details?: string;
}

export interface SkillMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
}

export interface Skill {
  id: string;
  metadata: SkillMetadata;
  html_content: string;
  category_id?: string;
  user_notes?: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}
