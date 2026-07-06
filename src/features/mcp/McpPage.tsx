import { Card } from '../../shared/ui/Card';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function McpPage() {
  return <div className="page-stack"><header className="page-header"><div><p className="eyebrow">TOOL CONNECTIONS</p><h1>MCP 管理</h1><p className="page-description">集中管理服务器目录、连接状态与项目绑定。</p></div><StatusBadge tone="success">3 在线</StatusBadge></header><Card><h2>MCP 服务器</h2><p className="muted-copy">连接检测将在后续阶段启用，当前展示页面框架。</p></Card></div>;
}
