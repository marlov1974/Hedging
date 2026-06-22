const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDerivativeName(component: string, months: string[], priceArea: string): string {
  const sortedMonths = [...months].sort();
  if (sortedMonths.length === 0) {
    return `${priceArea} ${component} Unknown`;
  }

  const periodLabel = formatPeriod(sortedMonths);
  return `${priceArea} ${component} ${periodLabel}`;
}

function formatPeriod(months: string[]): string {
  const first = parseMonth(months[0]);
  const last = parseMonth(months[months.length - 1]);

  if (months.length === 1) {
    return `${MONTH_NAMES[first.month - 1]}-${shortYear(first.year)}`;
  }

  if (months.length === 3 && first.year === last.year && first.month % 3 === 1 && last.month === first.month + 2) {
    return `Q${Math.floor((first.month - 1) / 3) + 1}-${shortYear(first.year)}`;
  }

  if (months.length === 12 && first.year === last.year && first.month === 1 && last.month === 12) {
    return `YR-${shortYear(first.year)}`;
  }

  return `${MONTH_NAMES[first.month - 1]}-${shortYear(first.year)}..${MONTH_NAMES[last.month - 1]}-${shortYear(last.year)}`;
}

function parseMonth(month: string): { year: number; month: number } {
  const [yearText, monthText] = month.split("-");
  return { year: Number(yearText), month: Number(monthText) };
}

function shortYear(year: number): string {
  return String(year).slice(2);
}
