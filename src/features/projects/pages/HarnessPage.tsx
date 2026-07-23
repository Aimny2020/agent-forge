import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  ChevronRight,
  CircleCheck,
  FileCode2,
  FileText,
  Layers3,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  adoptProjectHarness,
  applyProjectHarness,
  createProjectHarnessFile,
  deleteProjectHarnessFile,
  getHarnessTemplates,
  getProjectHarnessStatus,
  previewProjectHarnessApplication,
  readProjectHarnessFile,
  unmanageProjectHarness,
  writeProjectHarnessFile,
} from '../../../shared/api/tauriClient';
import type { HarnessTemplateSummary, ProjectHarnessFile, ProjectHarnessFileDecision, ProjectHarnessStatus } from '../../../shared/api/types';
import { useProjectStore } from '../../../shared/store/projectStore';
import { Card } from '../../../shared/ui/Card';
import { PageState } from '../../../shared/ui/PageState';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import './project-harness.css';

function TemplateListItem({ template, selected, onSelect }: { template: HarnessTemplateSummary; selected: boolean; onSelect: () => void }) {
  const { t } = useTranslation();
  const languageLabel = (language: string) => language === 'zh-CN' ? t('projects.harness.languageChinese') : 'English';
  const workTypeLabel = (workType: string) => t(`projects.harness.${workType === 'code' || workType === 'document' || workType === 'presentation' ? workType : 'custom'}`);
  return (
    <button type="button" className={`project-harness-template-item${selected ? ' is-selected' : ''}`} onClick={onSelect}>
      <span className="project-harness-template-icon"><Layers3 size={17} /></span>
      <span className="project-harness-template-copy">
        <strong>{template.name}</strong>
        <span>{workTypeLabel(template.workType)} · {languageLabel(template.language)}</span>
      </span>
      <ChevronRight size={16} className="project-harness-template-arrow" />
    </button>
  );
}

export function HarnessPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { activeProjectId } = useProjectStore();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'code' | 'document' | 'presentation' | 'custom'>('all');
  const [selectedFile, setSelectedFile] = useState('');
  const [draft, setDraft] = useState('');
  const [decisions, setDecisions] = useState<Record<string, ProjectHarnessFileDecision['action']>>({});
  const [newFilePath, setNewFilePath] = useState('docs/');

  useEffect(() => {
    setSelectedTemplate('');
    setSelectedFile('');
    setDraft('');
    setDecisions({});
    setNewFilePath('docs/');
  }, [activeProjectId]);

  const statusQuery = useQuery({
    queryKey: ['projectHarness', activeProjectId],
    queryFn: () => getProjectHarnessStatus(activeProjectId || ''),
    enabled: !!activeProjectId,
  });
  const templatesQuery = useQuery({
    queryKey: ['harnessTemplates'],
    queryFn: getHarnessTemplates,
    enabled: !!activeProjectId && statusQuery.data?.state !== 'managed',
  });
  const previewQuery = useQuery({
    queryKey: ['projectHarnessPreview', activeProjectId, selectedTemplate],
    queryFn: () => previewProjectHarnessApplication(activeProjectId || '', selectedTemplate),
    enabled: !!activeProjectId && !!selectedTemplate && statusQuery.data?.state !== 'managed',
  });

  const applyMutation = useMutation({
    mutationFn: () => applyProjectHarness({
      projectId: activeProjectId || '',
      templateId: selectedTemplate,
      decisions: Object.entries(decisions).map(([path, action]) => ({ path, action })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectHarness', activeProjectId] });
      setSelectedTemplate('');
      setDecisions({});
    },
  });
  const saveMutation = useMutation({
    mutationFn: () => writeProjectHarnessFile(activeProjectId || '', selectedFile, draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectHarness', activeProjectId] }),
  });
  const unmanageMutation = useMutation({
    mutationFn: () => unmanageProjectHarness(activeProjectId || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectHarness', activeProjectId] }),
  });
  const adoptMutation = useMutation({
    mutationFn: () => adoptProjectHarness(activeProjectId || ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectHarness', activeProjectId] }),
  });
  const createFileMutation = useMutation({
    mutationFn: () => createProjectHarnessFile(activeProjectId || '', newFilePath.trim()),
    onSuccess: (file) => {
      setNewFilePath('docs/');
      setSelectedFile(file.path);
      setDraft(file.content);
      queryClient.invalidateQueries({ queryKey: ['projectHarness', activeProjectId] });
    },
  });
  const deleteFileMutation = useMutation({
    mutationFn: (path: string) => deleteProjectHarnessFile(activeProjectId || '', path, true),
    onSuccess: () => {
      setSelectedFile('');
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['projectHarness', activeProjectId] });
    },
  });

  const templates = templatesQuery.data || [];
  const filteredTemplates = useMemo(() => templates.filter((template) => {
    const matchesFilter = templateFilter === 'all' || template.workType === templateFilter;
    const query = templateSearch.trim().toLowerCase();
    return matchesFilter && (!query || `${template.name} ${template.description}`.toLowerCase().includes(query));
  }), [templateFilter, templateSearch, templates]);
  const preview = previewQuery.data;
  const files = statusQuery.data?.files || [];
  const activeFile = files.find((file) => file.path === selectedFile);
  const hasUnresolvedConflicts = !!preview?.conflicts.some((conflict) => !decisions[conflict.path]);
  const agentsFile = preview?.templateFiles.find((file) => file.path === 'AGENTS.md');
  const selectedTemplateSummary = templates.find((template) => template.id === selectedTemplate);

  const selectTemplate = (template: HarnessTemplateSummary) => {
    setSelectedTemplate(template.id);
    setDecisions({});
  };
  const openFile = async (path: string) => {
    setSelectedFile(path);
    const file = await readProjectHarnessFile(activeProjectId || '', path);
    setDraft(file.content);
  };
  const setConflictAction = (path: string, action: ProjectHarnessFileDecision['action']) => {
    setDecisions((current) => ({ ...current, [path]: action }));
  };
  const statusLabel = statusQuery.data?.state === 'managed' ? t('projects.harness.managed') : statusQuery.data?.state === 'invalid' ? t('projects.harness.invalid') : statusQuery.data?.state === 'unmanaged_detected' ? t('projects.harness.unmanaged') : t('projects.harness.absent');

  if (!activeProjectId) return <PageState state="empty" title={t('projects.harness.noProjectTitle')} description={t('projects.harness.noProjectDescription')} />;
  if (statusQuery.isLoading) return <PageState state="loading" label={t('projects.harness.loading')} />;
  if (statusQuery.isError || !statusQuery.data) return <PageState state="error" title={t('projects.harness.loadErrorTitle')} description={t('projects.harness.loadErrorDescription')} onRetry={() => void statusQuery.refetch()} />;

  return (
    <div className="project-harness-page-container">
      <div className="project-harness-header">
        <div className="project-harness-header-title">
          <h2>{t('projects.harness.title')}</h2>
          <span className="project-harness-header-desc">{t('projects.harness.description')}</span>
        </div>
        <div className="project-harness-header-actions">
          {(statusQuery.data.state === 'managed' || statusQuery.data.state === 'invalid') && (
            <>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => void statusQuery.refetch()}
              >
                <RefreshCw size={15} /> {t('projects.harness.refresh')}
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => unmanageMutation.mutate()}
                disabled={unmanageMutation.isPending}
              >
                {t('projects.harness.unmanage')}
              </button>
            </>
          )}
          <StatusBadge tone={statusQuery.data.state === 'managed' ? 'success' : statusQuery.data.state === 'invalid' ? 'danger' : 'neutral'}>{statusLabel}</StatusBadge>
        </div>
      </div>

      {statusQuery.data.state === 'absent' && (
        <div className="project-harness-apply-workspace">
          <aside className="project-harness-template-rail">
            <div className="project-harness-rail-heading"><div><h3>{t('projects.harness.selectTemplate')}</h3></div><span className="project-harness-count">{filteredTemplates.length}</span></div>
            <label className="project-harness-search"><Search size={16} /><span className="sr-only">{t('projects.harness.search')}</span><input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder={t('projects.harness.search')} /></label>
            <div className="project-harness-filter-row" aria-label={t('projects.harness.filter')}>
              {(['all', 'code', 'document', 'presentation', 'custom'] as const).map((value) => <button type="button" key={value} className={templateFilter === value ? 'is-active' : ''} onClick={() => setTemplateFilter(value)}>{t(`projects.harness.${value === 'all' ? 'all' : value}`)}</button>)}
            </div>
            <div className="project-harness-template-list">
              {filteredTemplates.length ? filteredTemplates.map((template) => <TemplateListItem key={template.id} template={template} selected={selectedTemplate === template.id} onSelect={() => selectTemplate(template)} />) : <p className="project-harness-empty-copy">{t('projects.harness.noTemplates')}</p>}
            </div>
          </aside>

          <section className="project-harness-apply-main">
            {!selectedTemplateSummary ? (
              <div className="project-harness-select-empty"><div className="project-harness-empty-mark"><Layers3 size={25} /></div><h3>{t('projects.harness.selectTemplateTitle')}</h3><p>{t('projects.harness.selectTemplateDescription')}</p></div>
            ) : (
              <>
                <div className="project-harness-preview-header"><div><span className="project-harness-kicker">SELECTED TEMPLATE</span><h3>{selectedTemplateSummary.name}</h3><p>{selectedTemplateSummary.description || t('projects.harness.defaultTemplateDescription')}</p></div><div className="project-harness-template-meta"><span>{t(`projects.harness.${selectedTemplateSummary.workType === 'code' || selectedTemplateSummary.workType === 'document' || selectedTemplateSummary.workType === 'presentation' ? selectedTemplateSummary.workType : 'custom'}`)}</span><span>{selectedTemplateSummary.language === 'zh-CN' ? t('projects.harness.languageChinese') : 'English'}</span><span>{t('projects.harness.files', { count: selectedTemplateSummary.fileCount })}</span></div></div>
                <div className="project-harness-preview-grid">
                  <div className="project-harness-preview-panel"><div className="project-harness-panel-heading"><div><FileCode2 size={16} /><strong>{t('projects.harness.fileList')}</strong></div><span>{t('projects.harness.files', { count: preview?.templateFiles.length || selectedTemplateSummary.fileCount })}</span></div><div className="project-harness-preview-files">{(preview?.templateFiles || []).map((file) => <div key={file.path} className={file.path === 'AGENTS.md' ? 'is-entry' : ''}><FileText size={14} /><code>{file.path}</code>{file.path === 'AGENTS.md' && <span>{t('projects.harness.entry')}</span>}</div>)}</div></div>
                  <div className="project-harness-preview-panel project-harness-agents-panel"><div className="project-harness-panel-heading"><div><ShieldCheck size={16} /><strong>{t('projects.harness.entryCheck')}</strong></div>{previewQuery.isLoading ? <span>{t('projects.harness.checking')}</span> : preview?.missingAgentsReferences.length ? <span className="is-danger">{t('projects.harness.issues')}</span> : <span className="is-success"><CircleCheck size={14} /> {t('projects.harness.applicable')}</span>}</div>{preview?.missingAgentsReferences.length ? <div className="project-harness-inline-error"><AlertCircle size={16} /><div><strong>{t('projects.harness.missingReferences')}</strong>{preview.missingAgentsReferences.map((path) => <code key={path}>{path}</code>)}</div></div> : <p className="project-harness-check-copy">{t('projects.harness.referencesValid')}</p>}{agentsFile && <details><summary>{t('projects.harness.previewAgents')}</summary><pre>{agentsFile.content}</pre></details>}</div>
                </div>
                {preview?.conflicts.length ? <div className="project-harness-conflict-section"><div className="project-harness-panel-heading"><div><AlertCircle size={16} /><strong>{t('projects.harness.conflicts')}</strong></div><span>{t('projects.harness.resolved', { count: Object.keys(decisions).length, total: preview.conflicts.length })}</span></div><div className="project-harness-conflict-list">{preview.conflicts.map((conflict) => <div key={conflict.path} className="project-harness-conflict-row"><div><FileText size={15} /><code>{conflict.path}</code><span>{t('projects.harness.alreadyExists')}</span></div><div className="project-harness-conflict-actions">{(['keep', 'overwrite', 'skip'] as const).map((action) => <button type="button" key={action} className={decisions[conflict.path] === action ? 'is-selected' : ''} onClick={() => setConflictAction(conflict.path, action)}>{t(`projects.harness.${action}`)}</button>)}</div></div>)}</div></div> : null}
                <div className="project-harness-apply-footer"><div><strong>{preview?.conflicts.length ? t('projects.harness.conflictsResolved', { count: Object.keys(decisions).length }) : t('projects.harness.validationPassed')}</strong><span>{preview?.conflicts.length ? t('projects.harness.writeAfterConfirm') : t('projects.harness.independentInstance')}</span></div><button type="button" className="button button--primary" disabled={!preview || hasUnresolvedConflicts || !!preview.missingAgentsReferences.length || applyMutation.isPending} onClick={() => applyMutation.mutate()}><Check size={16} />{applyMutation.isPending ? t('projects.harness.applying') : t('projects.harness.apply')}</button></div>
                {applyMutation.isError && <p className="form-error">{String(applyMutation.error)}</p>}
              </>
            )}
          </section>
        </div>
      )}

      {statusQuery.data.state === 'unmanaged_detected' && <div className="project-harness-adopt-strip"><AlertCircle size={17} /><span>{t('projects.harness.unmanagedDescription')}</span><button type="button" className="button button--primary" onClick={() => adoptMutation.mutate()} disabled={adoptMutation.isPending}>{adoptMutation.isPending ? t('projects.harness.adopting') : t('projects.harness.adopt')}</button></div>}

      {(statusQuery.data.state === 'managed' || statusQuery.data.state === 'invalid') && (
        <ManagedHarnessEditor
          status={statusQuery.data}
          files={files}
          selectedFile={selectedFile}
          activeFile={activeFile}
          draft={draft}
          newFilePath={newFilePath}
          setNewFilePath={setNewFilePath}
          onOpenFile={(path) => void openFile(path)}
          onDraftChange={setDraft}
          onSave={() => saveMutation.mutate()}
          onDelete={(path) => { if (window.confirm(t('projects.harness.deleteFilePrompt', { path }))) deleteFileMutation.mutate(path); }}
          onCreate={() => createFileMutation.mutate()}
          savePending={saveMutation.isPending}
          deletePending={deleteFileMutation.isPending}
          createPending={createFileMutation.isPending}
        />
      )}
    </div>
  );
}

interface ManagedHarnessEditorProps {
  status: ProjectHarnessStatus;
  files: ProjectHarnessFile[];
  selectedFile: string;
  activeFile?: ProjectHarnessFile;
  draft: string;
  newFilePath: string;
  setNewFilePath: (value: string) => void;
  onOpenFile: (path: string) => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onDelete: (path: string) => void;
  onCreate: () => void;
  savePending: boolean;
  deletePending: boolean;
  createPending: boolean;
}

function ManagedHarnessEditor({ status, files, selectedFile, activeFile, draft, newFilePath, setNewFilePath, onOpenFile, onDraftChange, onSave, onDelete, onCreate, savePending, deletePending, createPending }: ManagedHarnessEditorProps) {
  const { t } = useTranslation();
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  const handleCreate = () => {
    onCreate();
    setIsCreatingFile(false);
  };

  return (
    <Card className="project-harness-main-card">
      <div className="project-harness-editor-layout-new">
        {/* Column 1: Harness Files List */}
        <div className="project-harness-file-list-new">
          <div className="project-harness-file-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <h3 style={{ margin: 0 }}>{t('projects.harness.harnessFiles')}</h3>
            <button
              type="button"
              className="create-cat-btn"
              onClick={() => {
                setIsCreatingFile(true);
                setNewFilePath('docs/');
              }}
              title={t('projects.harness.newFile')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '4px' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-ink)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-muted)'; }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="project-harness-file-list-scroll">
            {files.map((file) => (
              <button type="button" key={file.path} className={selectedFile === file.path ? 'is-active' : ''} onClick={() => onOpenFile(file.path)}>
                <FileText size={15} />
                <span>{file.path}</span>
                {file.changedSinceApply && <i title={t('projects.harness.changed')} />}
              </button>
            ))}
            {isCreatingFile && (
              <div className="project-harness-file-item-creating" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.5rem' }}>
                <FileText size={15} style={{ color: 'var(--color-muted)' }} />
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(event) => setNewFilePath(event.target.value)}
                  placeholder={t('projects.harness.newFilePath')}
                  autoFocus
                  onBlur={() => {
                    setTimeout(() => {
                      if (!newFilePath.trim() || newFilePath === 'docs/') {
                        setIsCreatingFile(false);
                      }
                    }, 200);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      const val = newFilePath.trim();
                      if (val && val !== 'docs/') {
                        handleCreate();
                      } else {
                        setIsCreatingFile(false);
                      }
                    } else if (event.key === 'Escape') {
                      setIsCreatingFile(false);
                    }
                  }}
                  style={{ flex: 1, minWidth: 0, border: '1px solid var(--color-outline)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem', background: 'var(--color-canvas)', color: 'var(--color-ink)', outline: 'none' }}
                />
              </div>
            )}
          </div>
          {status.warnings.length > 0 && (
            <div className="project-harness-sidebar-warnings" style={{ margin: 'var(--space-2) 0', padding: 'var(--space-2)', border: '1px solid var(--color-outline)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-soft)' }}>
              {status.warnings.map((warning: string) => (
                <p key={warning} className="project-harness-warning" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', margin: '0.2rem 0', color: '#a15c00', fontSize: '0.78rem', lineHeight: '1.4' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <span>{warning}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Editor */}
        <div className="project-harness-editor-new">
          {activeFile ? (
            <>
              <div className="project-harness-editor-toolbar" style={{ padding: '0 0 var(--space-2) 0', borderBottom: '1px solid var(--color-outline)' }}>
                <code>{activeFile.path}</code>
                <div className="project-harness-actions">
                  <button type="button" className="button button--primary" onClick={onSave} disabled={savePending}><Save size={15} /> {t('common.save')}</button>
                  <button type="button" className="button button--secondary" disabled={deletePending} onClick={() => onDelete(activeFile.path)}>{t('common.delete')}</button>
                </div>
              </div>
              <div className="project-harness-editor-textarea-new">
                <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} spellCheck={false} aria-label={t('projects.harness.editFile', { path: activeFile.path })} />
              </div>
            </>
          ) : (
            <div className="project-harness-empty-editor">{t('projects.harness.chooseFile')}</div>
          )}
        </div>
      </div>
    </Card>
  );
}
