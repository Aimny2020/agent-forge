import { PageState } from '../../shared/ui/PageState';

export function TasksPage() {
  return <div className="page-stack"><header className="page-header"><div><p className="eyebrow">AGENT RUNS</p><h1>任务中心</h1><p className="page-description">查看运行队列、终端会话和历史记录。</p></div></header><PageState state="empty" title="当前没有运行任务" description="PTY 与 Agent 启动将在后续阶段实现。" /></div>;
}
