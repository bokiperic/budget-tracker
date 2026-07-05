export function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function currentYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

// Half-open [start, end) date range covering a 'YYYY-MM' month.
export function monthRange(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, end };
}
