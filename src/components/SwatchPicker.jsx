import { useRef } from 'react';

// Visual variant picker — each option is an ingredient thumbnail (the
// variant's real photo, falling back to its colour) with its name beneath.
// Same radiogroup contract as PillSelector so configs can swap freely.
// Follows the ARIA radio pattern: one tab stop, arrow keys move selection.
export default function SwatchPicker({ options, value, onChange, disabled = false, ariaLabel }) {
  const rootRef = useRef(null);

  function moveSelection(event, delta) {
    event.preventDefault();
    const index = options.findIndex((opt) => opt.id === value);
    const next = options[(index + delta + options.length) % options.length];
    onChange(next.id);
    rootRef.current?.querySelector(`[data-swatch-id="${next.id}"]`)?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') moveSelection(event, 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') moveSelection(event, -1);
  }

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={`swatch-picker${disabled ? ' swatch-picker--disabled' : ''}`}
    >
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-swatch-id={opt.id}
            disabled={disabled}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={handleKeyDown}
            className={`swatch-picker__option${selected ? ' is-selected' : ''}`}
          >
            <span className="swatch-picker__dot" style={!opt.image ? { background: opt.color } : undefined}>
              {opt.image && <img src={opt.image} alt="" loading="lazy" />}
            </span>
            {opt.ingredient && (
              <span className={`swatch-picker__ingredient swatch-picker__ingredient--${opt.ingredient}`} aria-hidden="true" />
            )}
            <span className="swatch-picker__label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
