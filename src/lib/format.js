export function fmtNaira(n) {
  if (n === null || n === undefined) return 'Price TBC';
  return '₦' + Math.round(n).toLocaleString('en-NG');
}

// Line totals must not silently collapse a TBC unit price into "₦0" —
// that's the exact kind of decoration-over-truth the spec (§1) rules out.
export function fmtLineTotal(price, qty) {
  if (price === null || price === undefined) return 'Price TBC';
  return fmtNaira(price * qty);
}

export function tomorrowISODate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
