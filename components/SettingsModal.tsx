'use client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exactSpecs: boolean;
  setExactSpecs: (value: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (value: 'light' | 'dark') => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  exactSpecs,
  setExactSpecs,
  theme,
  setTheme,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('pakr-specs-mode', exactSpecs ? 'detailed' : 'general');
    localStorage.setItem('pakr-theme', theme);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">SETTINGS</span>
          <button type="button" onClick={onClose} className="settings-close">×</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <div className="settings-label">Display</div>
            <label className="settings-option">
              <input
                type="radio"
                name="specsMode"
                checked={!exactSpecs}
                onChange={() => setExactSpecs(false)}
                className="settings-radio"
              />
              <span>General specs (default)</span>
            </label>
            <label className="settings-option">
              <input
                type="radio"
                name="specsMode"
                checked={exactSpecs}
                onChange={() => setExactSpecs(true)}
                className="settings-radio"
              />
              <span>Detailed specs</span>
            </label>
          </div>

          <div className="settings-section">
            <div className="settings-label">Theme</div>
            <label className="settings-option">
              <input
                type="radio"
                name="theme"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                className="settings-radio"
              />
              <span>Light mode (default)</span>
            </label>
            <label className="settings-option">
              <input
                type="radio"
                name="theme"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                className="settings-radio"
              />
              <span>Dark mode</span>
            </label>
          </div>
        </div>

        <div className="settings-footer">
          <button type="button" onClick={handleSave} className="settings-save">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
