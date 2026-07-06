import { Card } from '../../../shared/ui/Card';
import { StatusBadge } from '../../../shared/ui/StatusBadge';

export function ProjectOverview() {
  return (
    <div className="content-grid">
      <Card><p className="eyebrow">PROJECT HEALTH</p><h2>工程状态</h2><div className="health-score">92<span>/100</span></div><StatusBadge tone="success">配置一致</StatusBadge></Card>
      <Card><p className="eyebrow">FOUNDATION</p><h2>配置摘要</h2><dl className="definition-list"><div><dt>Harness</dt><dd>1</dd></div><div><dt>Agents</dt><dd>4</dd></div><div><dt>Skills</dt><dd>12</dd></div><div><dt>MCP</dt><dd>3</dd></div></dl></Card>
    </div>
  );
}
