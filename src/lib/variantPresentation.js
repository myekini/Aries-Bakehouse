const INGREDIENT_KIND = {
  oreo: 'oreos',
  'coconut-flakes': 'coconut',
  'coconut-crunch': 'coconut',
  chocolate: 'double-chocolate',
  'dark-chocolate': 'double-chocolate',
  'white-chocolate': 'double-chocolate',
};

const VARIANT_COLORS = {
  plain: 'var(--color-border)',
  oreo: '#321A17',
  oreos: '#321A17',
  'double-chocolate': 'var(--color-cocoa)',
  chocolate: 'var(--color-cocoa)',
  'dark-chocolate': 'var(--color-choc)',
  'white-chocolate': 'var(--color-white)',
  coconut: 'var(--color-white)',
  'coconut-flakes': 'var(--color-white)',
  'coconut-crunch': 'var(--color-white)',
  'nuts-crunch': '#B48765',
  biscoff: 'var(--color-caramel)',
  raisins: 'var(--color-error)',
  'red-velvet': 'var(--color-error)',
};

export function ingredientKindFor(id) {
  return INGREDIENT_KIND[id] || id;
}

export function variantColorFor(id, fallback) {
  return fallback || VARIANT_COLORS[id] || 'var(--color-border)';
}
