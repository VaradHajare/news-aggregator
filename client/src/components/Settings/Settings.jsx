import './Settings.css';

const HEADLINE_FONTS = [
  { value: 'cormorant',   label: 'Cormorant',    family: '"Cormorant Garamond", serif' },
  { value: 'playfair',    label: 'Playfair',     family: '"Playfair Display", serif' },
  { value: 'spectral',    label: 'Spectral',     family: '"Spectral", serif' },
  { value: 'lora',        label: 'Lora',         family: '"Lora", serif' },
  { value: 'merriweather',label: 'Merriweather', family: '"Merriweather", serif' },
  { value: 'ebgaramond',  label: 'EB Garamond',  family: '"EB Garamond", serif' },
  { value: 'sourceserif', label: 'Source Serif', family: '"Source Serif 4", serif' },
];

const PAPER_TONES = [
  { value: 'warm',      label: 'Warm' },
  { value: 'ivory',     label: 'Ivory' },
  { value: 'newsprint', label: 'Newsprint' },
  { value: 'slate',     label: 'Slate' },
];

const FONT_SIZES = [
  { value: 'small',  label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
];

export default function Settings({ settings, onUpdate, onClose }) {
  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <aside className="panel settings-panel">
        <div className="panel-header">
          <h2 className="panel-title">Settings</h2>
          <button className="panel-close-btn" onClick={onClose} aria-label="Close settings">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="panel-body">
          <div className="setting-group">
            <p className="setting-label">Headline Font</p>
            <div className="font-grid">
              {HEADLINE_FONTS.map((opt) => (
                <button
                  key={opt.value}
                  className={`font-btn${settings.headlineFont === opt.value ? ' active' : ''}`}
                  onClick={() => onUpdate('headlineFont', opt.value)}
                  style={{ fontFamily: opt.family }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <p className="setting-label">Paper Tone</p>
            <div className="tone-row">
              {PAPER_TONES.map((opt) => (
                <button
                  key={opt.value}
                  className={`tone-btn${settings.paperTone === opt.value ? ' active' : ''}`}
                  data-tone={opt.value}
                  onClick={() => onUpdate('paperTone', opt.value)}
                  aria-label={opt.label}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          <div className="setting-group">
            <p className="setting-label">Font Size</p>
            <div className="option-row">
              {FONT_SIZES.map((opt) => (
                <button
                  key={opt.value}
                  className={`option-btn${settings.fontSize === opt.value ? ' active' : ''}`}
                  onClick={() => onUpdate('fontSize', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
