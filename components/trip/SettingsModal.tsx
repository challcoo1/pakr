'use client';

interface SettingsModalProps {
  isOpen: boolean;
  exactSpecs: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
  onExactSpecsChange: (value: boolean) => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onSave: () => void;
}

export default function SettingsModal({
  isOpen,
  exactSpecs,
  theme,
  onClose,
  onExactSpecsChange,
  onThemeChange,
  onSave,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">SETTINGS</span>
          <button type="button" onClick={onClose} className="settings-close">
            ×
          </button>
        </div>

        <div className="settings-content">
          {/* Display Mode */}
          <div className="settings-section">
            <div className="settings-label">Display</div>
            <label className="settings-option">
              <input
                type="radio"
                name="specsMode"
                checked={!exactSpecs}
                onChange={() => onExactSpecsChange(false)}
                className="settings-radio"
              />
              <span>General specs (default)</span>
            </label>
            <label className="settings-option">
              <input
                type="radio"
                name="specsMode"
                checked={exactSpecs}
                onChange={() => onExactSpecsChange(true)}
                className="settings-radio"
              />
              <span>Detailed specs</span>
            </label>
          </div>

          {/* Theme */}
          <div className="settings-section">
            <div className="settings-label">Theme</div>
            <label className="settings-option">
              <input
                type="radio"
                name="theme"
                checked={theme === 'light'}
                onChange={() => onThemeChange('light')}
                className="settings-radio"
              />
              <span>Light mode (default)</span>
            </label>
            <label className="settings-option">
              <input
                type="radio"
                name="theme"
                checked={theme === 'dark'}
                onChange={() => onThemeChange('dark')}
                className="settings-radio"
              />
              <span>Dark mode</span>
            </label>
          </div>
        </div>

        <div className="settings-footer">
          <button type="button" onClick={onSave} className="settings-save">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
