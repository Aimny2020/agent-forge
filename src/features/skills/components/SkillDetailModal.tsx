import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Skill, Category } from '../../../shared/api/types';

interface Props {
  skill: Skill;
  categories: Category[];
  onClose: () => void;
  onUpdate: (categoryId: string | null, userNotes: string | null) => void;
}

export function SkillDetailModal({ skill, categories, onClose, onUpdate }: Props) {
  const [notes, setNotes] = useState(skill.user_notes || '');
  const [catId, setCatId] = useState(skill.category_id || '');

  const handleSave = () => {
    onUpdate(catId || null, notes || null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>技能详情</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-grid-content">
          <div className="modal-markdown-area">
            <h1>{skill.metadata.name}</h1>
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: skill.html_content }}
            />
          </div>
          <div className="modal-meta-editor">
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
