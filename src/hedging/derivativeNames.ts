export function formatDerivativeName(component: string, months: string[], priceArea: string): string {
  const sortedMonths = [...months].sort();
  if (sortedMonths.length === 0) {
    return `${instrumentName(component, priceArea)} Unknown`;
  }

  const periodLabel = formatPeriod(sortedMonths);
  return `${instrumentName(component, priceArea)} ${periodLabel}`;
}

function formatPeriod(months: string[]): string {
  const first = parseMonth(months[0]);
  const last = parseMonth(months[months.length - 1]);

  if (months.length === 1) {
    return `Month ${months[0]}`;
  }

  if (months.length === 3 && first.year === last.year && first.month % 3 === 1 && last.month === first.month + 2) {
    return `Quarter ${first.year}-Q${Math.floor((first.month - 1) / 3) + 1}`;
  }

  if (months.length === 12 && first.year === last.year && first.month === 1 && last.month === 12) {
    return `Year ${first.year}`;
  }

  return `Period ${months[0]}..${months[months.length - 1]}`;
}

function parseMonth(month: string): { year: number; month: number } {
  const [yearText, monthText] = month.split("-");
  return { year: Number(yearText), month: Number(monthText) };
}

function instrumentName(component: string, priceArea: string): string {
  if (component === "base.sys") {
    return "Nordic Electricity Base Load Future";
  }
  if (component === "base.epad") {
    return `Nordic Electricity EPAD ${priceArea}`;
  }
  return `${priceArea} ${component}`;
}
