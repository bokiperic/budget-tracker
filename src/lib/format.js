export function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function currentYearMonth() {
  return new Date().toISOString().slice(0, 7);
}
