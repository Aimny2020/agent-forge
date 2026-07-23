import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import type { Skill } from '../../../shared/api/types';
import { useTranslation } from 'react-i18next';

interface Props {
  skill: Skill;
  onClose: () => void;
  onConfirm: (force: boolean) => Promise<void>;
}

export function ConfirmDeleteModal({ skill, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const [occupiedProjects, setOccupiedProjects] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDelete = async (force: boolean) => {
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await onConfirm(force);
      onClose();
    } catch (err: any) {
      const msg = err.message || '';
      const details = err.details || '';
      if (msg.includes('enabled in projects') || details.includes('enabled in projects')) {
        const target = msg.includes('enabled in projects') ? msg : details;
        const match = target.match(/enabled in projects: (.*)/);
        const list = match ? match[1].split(', ') : [];
        setOccupiedProjects(list);
      } else {
        setErrorMessage(details || msg || t('skills.deleteFailed'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isOccupied = occupiedProjects !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-body compact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOccupied ? (
              <ShieldAlert size={20} style={{ color: 'var(--color-danger)' }} />
            ) : (
              <AlertTriangle size={20} style={{ color: '#ff9800' }} />
            )}
            <h3>{isOccupied ? t('skills.occupiedTitle') : t('skills.deleteTitle')}</h3>
          </div>
          <button className="close-btn" onClick={onClose} disabled={isDeleting}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-3)' }}>
          {isOccupied ? (
            <>
              <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                {t('skills.occupiedIntro')}
              </p>
              <div className="occupied-projects-list">
                <ul>
                  {occupiedProjects.map((proj) => (
                    <li key={proj} style={{ fontSize: '0.88rem', color: 'var(--color-ink)', marginBottom: '4px' }}>
                      {proj}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: '1.5' }}>
                {t('skills.occupiedDetail')}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                {t('skills.deletePrompt', { name: skill.metadata.name })}
              </p>
              <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                {t('skills.deleteWarning')}
              </p>
            </>
          )}

          {errorMessage && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '12px', margin: '12px 0 0 0' }}>
              {errorMessage}
            </p>
          )}
        </div>

        <div className="actions-footer" style={{ padding: 'var(--space-2) var(--space-3) var(--space-3)' }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </button>
          {isOccupied ? (
            <button
              type="button"
              className="button button--danger"
              onClick={() => handleDelete(true)}
              disabled={isDeleting}
            >
              {isDeleting ? t('skills.removingAndDeleting') : t('skills.removeAndDelete')}
            </button>
          ) : (
            <button
              type="button"
              className="button button--danger"
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
            >
              {isDeleting ? t('skills.deleting') : t('skills.confirmDelete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
