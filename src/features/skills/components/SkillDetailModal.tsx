import React, { useState } from 'react';
import { Download, Package, ShieldCheck, X } from 'lucide-react';
import { Skill, SkillMember, Category, SkillUpdateStatus } from '../../../shared/api/types';

interface Props {
  skill: Skill;
  categories: Category[];
  onClose: () => void;
  onUpdate: (categoryId: string | null, userNotes: string | null) => void;
  initialMember?: SkillMember;
  updateStatus?: SkillUpdateStatus;
  onTrust?: () => void;
  onInstallUpdate?: () => void;
}

export function SkillDetailModal({
  skill,
  categories,
  onClose,
  onUpdate,
  initialMember,
  updateStatus = skill.update_status,
  onTrust,
  onInstallUpdate,
}: Props) {
  const [notes, setNotes] = useState(skill.user_notes || '');
  const [catId, setCatId] = useState(skill.category_id || '');
  const [selectedMember, setSelectedMember] = useState<SkillMember | undefined>(initialMember);
  const activeMetadata = selectedMember?.metadata ?? skill.metadata;
  const activeHtml = selectedMember?.html_content ?? skill.html_content;

  const handleSave = () => {
    onUpdate(catId || null, notes || null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{skill.kind === 'pack' ? '技能扩展包' : '技能详情'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-grid-content">
          <div className="modal-markdown-area">
            {selectedMember && <button className="member-back" onClick={() => setSelectedMember(undefined)}>← 返回 {skill.metadata.name}</button>}
            <h1>{activeMetadata.name}</h1>
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: activeHtml }}
            />
            {!activeHtml && skill.kind === 'pack' && <p className="empty-copy">从右侧选择一个子 Skill 查看完整说明。</p>}
          </div>
          <div className="modal-meta-editor">
            {skill.kind === 'pack' && (
              <div className="pack-members">
                <div className="pack-members__heading"><Package size={15} />{skill.members.length} 个 Skills</div>
                {skill.members.map((member) => (
                  <button
                    key={member.id}
                    className={selectedMember?.id === member.id ? 'pack-member is-active' : 'pack-member'}
                    onClick={() => setSelectedMember(member)}
                  >
                    <strong>{member.metadata.name}</strong>
                    <span>{member.metadata.description}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="package-actions">
              {updateStatus === 'available' && onInstallUpdate && (
                <button className="button button--secondary" onClick={onInstallUpdate}>
                  <Download size={15} /> 安装更新
                </button>
              )}
              {skill.has_executable_content && !skill.trusted && onTrust && (
                <button className="button button--secondary" onClick={onTrust}>
                  <ShieldCheck size={15} /> 信任此版本
                </button>
              )}
            </div>
            {skill.warnings.length > 0 && (
              <div className="skill-warnings">
                <strong>检测警告</strong>
                {skill.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            )}
            <div className="form-group">
              <label>设置分类</label>
              <select value={catId} onChange={(e) => setCatId(e.target.value)}>
                <option value="">未分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-fill">
              <label>技能使用说明与备注</label>
              <textarea
                placeholder="在此添加该技能的个性化使用备注或说明..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ minHeight: '18rem' }}
              />
            </div>
            <div className="actions-footer">
              <button className="button button--secondary" onClick={onClose}>
                取消
              </button>
              <button className="button button--primary" onClick={handleSave}>
                保存更改
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
