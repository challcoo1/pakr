'use client';

import { SystemCheck } from '@/types';

interface SystemCheckDisplayProps {
  systemCheck: SystemCheck | null;
  isChecking: boolean;
}

export default function SystemCheckDisplay({
  systemCheck,
  isChecking,
}: SystemCheckDisplayProps) {
  if (!isChecking && !systemCheck) return null;

  return (
    <div className="system-check">
      {isChecking && !systemCheck && (
        <div className="system-check-loading">
          <span className="inline-block w-3 h-3 border-2 border-muted border-t-burnt rounded-full animate-spin" />
          Checking gear compatibility...
        </div>
      )}
      {systemCheck && (
        <>
          <div className="system-check-header">
            <span className={`system-check-level system-check-${systemCheck.systemLevel}`}>
              {systemCheck.systemLevel === 'excellent' && 'Excellent system'}
              {systemCheck.systemLevel === 'good' && 'Good system'}
              {systemCheck.systemLevel === 'fair' && 'Fair system'}
              {systemCheck.systemLevel === 'poor' && 'System issues'}
            </span>
            <span className="system-check-summary">{systemCheck.summary}</span>
          </div>
          {systemCheck.compatibilityNotes.length > 0 && (
            <div className="system-check-notes">
              {systemCheck.compatibilityNotes.map((note, idx) => (
                <div key={idx} className={`system-check-note system-check-note-${note.status}`}>
                  <span className="system-check-note-items">{note.items.join(' + ')}</span>
                  <span className="system-check-note-text">{note.note}</span>
                </div>
              ))}
            </div>
          )}
          {systemCheck.warnings.length > 0 && (
            <div className="system-check-warnings">
              {systemCheck.warnings.map((warning, idx) => (
                <div key={idx} className="system-check-warning">
                  <div className="system-check-warning-items">{warning.items.join(' + ')}</div>
                  <div className="system-check-warning-issue">{warning.issue}</div>
                  <div className="system-check-warning-suggestion">{warning.suggestion}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
