export type PurchasePeriodType = "year" | "quarter" | "month";

export type PurchasePeriodOption = {
  period_id: string;
  period_type: PurchasePeriodType;
  start_month: string;
  end_month: string;
  label: string;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getBaseloadsPurchasePeriods(): PurchasePeriodOption[] {
  return [...yearOptions(), ...quarterOptions(), ...monthOptions()];
}

export function findPurchasePeriod(periodId: string): PurchasePeriodOption | undefined {
  return getBaseloadsPurchasePeriods().find((period) => period.period_id === periodId);
}

export function expandPeriodMonths(period: PurchasePeriodOption): string[] {
  const [startYear, startMonth] = parseMonth(period.start_month);
  const [endYear, endMonth] = parseMonth(period.end_month);
  const months: string[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const firstMonth = year === startYear ? startMonth : 1;
    const lastMonth = year === endYear ? endMonth : 12;
    for (let month = firstMonth; month <= lastMonth; month += 1) {
      months.push(formatMonth(year, month));
    }
  }

  return months;
}

function yearOptions(): PurchasePeriodOption[] {
  return [2027, 2028, 2029, 2030].map((year) => ({
    period_id: `year-${year}`,
    period_type: "year",
    start_month: `${year}-01`,
    end_month: `${year}-12`,
    label: `Year ${year}`,
  }));
}

function quarterOptions(): PurchasePeriodOption[] {
  const options: PurchasePeriodOption[] = [];

  for (let index = 0; index < 11; index += 1) {
    const year = 2027 + Math.floor(index / 4);
    const quarter = (index % 4) + 1;
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    options.push({
      period_id: `quarter-${year}-q${quarter}`,
      period_type: "quarter",
      start_month: formatMonth(year, startMonth),
      end_month: formatMonth(year, endMonth),
      label: `Q${quarter} ${year}`,
    });
  }

  return options;
}

function monthOptions(): PurchasePeriodOption[] {
  return Array.from({ length: 6 }, (_, index) => ({
    period_id: `month-2027-${String(index + 1).padStart(2, "0")}`,
    period_type: "month",
    start_month: formatMonth(2027, index + 1),
    end_month: formatMonth(2027, index + 1),
    label: `${MONTH_LABELS[index]} 2027`,
  }));
}

function parseMonth(month: string): [number, number] {
  const [yearText, monthText] = month.split("-");
  return [Number(yearText), Number(monthText)];
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
