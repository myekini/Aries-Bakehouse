// Rounded pill selector — unselected (cream, brown border), selected (deep
// brown, cream text), unavailable (reduced opacity). Per design system §10/§7.
export default function PillSelector({ options, value, onChange, disabled = false, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: selected ? 'var(--color-choc)' : 'var(--color-white)',
              color: selected ? 'var(--color-white)' : 'var(--color-choc)',
              border: `1.5px solid ${selected ? 'var(--color-choc)' : 'var(--color-border)'}`,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
