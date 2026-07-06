import { Card } from '../../shared/ui/Card';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function SkillsPage() {
  return <div className="page-stack"><header className="page-header"><div><p className="eyebrow">CAPABILITY CATALOG</p><h1>Skills 管理</h1><p className="page-description">查看可复用能力及其项目启用状态。</p></div><StatusBadge>12 Skills</StatusBadge></header><Card><h2>全局技能库</h2><p className="muted-copy">技能扫描将在后续阶段启用，当前展示页面框架。</p></Card></div>;
}
