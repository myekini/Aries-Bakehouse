export function cn(...classes) {
  return classes.flatMap((value) => {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value;
    return Object.entries(value).filter(([, enabled]) => enabled).map(([key]) => key);
  }).join(' ');
}
