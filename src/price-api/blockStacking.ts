import { yearFromMonth } from "./monthRange.ts";
import { PriceApiError, type BlockPriceProvider, type BlockType, type EnergyComponentCode, type NormalizedProfilePriceApiRequest, type PriceApiResponseWithTrace, type PriceApiRow, type PriceApiTraceEntry, type PriceBlock, type ProfilePoint } from "./types.ts";

const ENERGY_COMPONENTS: EnergyComponentCode[] = ["base.sys", "base.epad"];

const QUARTER_FACTORS: Record<string, number> = {
  Q1: 1.35,
  Q2: 0.75,
  Q3: 0.8,
  Q4: 1.1,
};

const MONTH_FACTORS: Record<string, Record<string, number>> = {
  Q1: { "01": 0.38, "02": 0.37, "03": 0.25 },
  Q2: { "04": 0.4, "05": 0.32, "06": 0.28 },
  Q3: { "07": 0.25, "08": 0.33, "09": 0.42 },
  Q4: { "10": 0.28, "11": 0.34, "12": 0.38 },
};

export function calculateProfileComponentRows(
  request: NormalizedProfilePriceApiRequest,
  blockProvider: BlockPriceProvider,
  getCurrencyRate: (year: string) => number,
): PriceApiResponseWithTrace {
  const rowsByMonth = new Map<string, PriceApiRow>();
  const trace: PriceApiTraceEntry[] = [];

  for (const profilePoint of request.profile) {
    const currencyValue = getCurrencyRate(yearFromMonth(profilePoint.month));
    rowsByMonth.set(profilePoint.month, {
      month: profilePoint.month,
      "base.sys": 0,
      "base.epad": 0,
      "currency.sek": currencyValue,
    });
    trace.push({
      month: profilePoint.month,
      component: "currency.sek",
      source_block_type: "annual_currency",
      source_block_id: `currency.sek:${yearFromMonth(profilePoint.month)}`,
      block_price: currencyValue,
      block_mw_used: profilePoint.mw,
      virtual: false,
    });
  }

  for (const component of ENERGY_COMPONENTS) {
    const componentPrices = calculateEnergyComponentPrices(request, blockProvider, component);
    for (const [month, result] of componentPrices) {
      const row = rowsByMonth.get(month);
      if (!row) {
        throw new PriceApiError("invalid_request", `profile month ${month} was not initialized`);
      }
      row[component] = result.price;
      trace.push(...result.trace);
    }
  }

  return {
    response: {
      base_currency: "EUR",
      price_unit: "EUR/MWh",
      rows: request.profile.map((row) => rowsByMonth.get(row.month) as PriceApiRow),
    },
    trace,
  };
}

function calculateEnergyComponentPrices(
  request: NormalizedProfilePriceApiRequest,
  blockProvider: BlockPriceProvider,
  component: EnergyComponentCode,
): Map<string, { price: number; trace: PriceApiTraceEntry[] }> {
  const result = new Map<string, { price: number; trace: PriceApiTraceEntry[] }>();
  const byYear = groupBy(request.profile, (row) => yearFromMonth(row.month));

  for (const [year, yearProfile] of byYear) {
    const yearBlock = resolveBlock(blockProvider, component, "year", year);
    const yearMw = minimumMw(yearProfile);
    const residualAfterYear = new Map(yearProfile.map((row) => [row.month, row.mw - yearMw]));

    addLayer(result, component, yearProfile, yearBlock, yearMw);

    const byQuarter = groupBy(yearProfile, (row) => quarterPeriod(row.month));
    for (const [quarter, quarterProfile] of byQuarter) {
      const quarterResidualProfile = quarterProfile.map((row) => ({
        month: row.month,
        mw: residualAfterYear.get(row.month) ?? 0,
      }));
      const quarterMw = minimumMw(quarterResidualProfile);
      const quarterBlock = quarterMw > 0 ? resolveBlock(blockProvider, component, "quarter", quarter, yearBlock) : undefined;
      addLayer(result, component, quarterProfile, quarterBlock, quarterMw);

      for (const row of quarterProfile) {
        const monthMw = (residualAfterYear.get(row.month) ?? 0) - quarterMw;
        if (monthMw <= 0) {
          continue;
        }
        const monthBlock = resolveBlock(blockProvider, component, "month", row.month, quarterBlock ?? resolveBlock(blockProvider, component, "quarter", quarter, yearBlock));
        addLayer(result, component, [row], monthBlock, monthMw);
      }
    }
  }

  for (const row of request.profile) {
    const monthResult = result.get(row.month);
    if (!monthResult) {
      result.set(row.month, { price: 0, trace: [] });
      continue;
    }
    monthResult.price = weightedAverage(monthResult.trace);
  }

  return result;
}

function addLayer(
  result: Map<string, { price: number; trace: PriceApiTraceEntry[] }>,
  component: EnergyComponentCode,
  profile: ProfilePoint[],
  block: PriceBlock | undefined,
  mw: number,
): void {
  if (mw <= 0) {
    return;
  }

  if (!block) {
    throw new PriceApiError("missing_data", `Missing block fixture for ${component}`);
  }

  for (const row of profile) {
    const monthResult = result.get(row.month) ?? { price: 0, trace: [] };
    monthResult.trace.push({
      month: row.month,
      component,
      source_block_type: block.block_type,
      source_block_id: block.id,
      block_price: block.price,
      block_mw_used: mw,
      virtual: block.virtual,
      virtual_rule_id: block.virtual_rule_id,
    });
    result.set(row.month, monthResult);
  }
}

export function resolveBlock(
  provider: BlockPriceProvider,
  component: EnergyComponentCode,
  blockType: BlockType,
  period: string,
  widerBlock?: PriceBlock,
): PriceBlock | undefined {
  const direct = provider.getBlock(component, "STO", blockType, period);
  if (direct) {
    return direct;
  }

  if (blockType === "quarter") {
    const sourceBlock = widerBlock ?? resolveBlock(provider, component, "year", period.slice(0, 4));
    if (!sourceBlock) {
      return undefined;
    }
    const quarter = period.slice(-2);
    return virtualBlock(component, blockType, period, sourceBlock.price * QUARTER_FACTORS[quarter], `quarter_from_year:${quarter}`, sourceBlock.id);
  }

  if (blockType === "month") {
    const quarter = quarterFromMonth(period);
    const sourceBlock = widerBlock ?? resolveBlock(provider, component, "quarter", `${yearFromMonth(period)}-${quarter}`);
    if (!sourceBlock) {
      return undefined;
    }
    const month = period.slice(5, 7);
    return virtualBlock(component, blockType, period, sourceBlock.price * MONTH_FACTORS[quarter][month], `month_from_quarter:${quarter}:${month}`, sourceBlock.id);
  }

  return undefined;
}

function virtualBlock(
  component: EnergyComponentCode,
  blockType: BlockType,
  period: string,
  price: number,
  virtualRuleId: string,
  sourceBlockId: string,
): PriceBlock {
  return {
    id: `virtual:${component}:STO:${blockType}:${period}`,
    component,
    price_area: "STO",
    block_type: blockType,
    period,
    price,
    virtual: true,
    virtual_rule_id: virtualRuleId,
    source_block_id: sourceBlockId,
  };
}

function weightedAverage(trace: PriceApiTraceEntry[]): number {
  const totalMw = trace.reduce((sum, entry) => sum + entry.block_mw_used, 0);
  if (totalMw === 0) {
    return 0;
  }
  return trace.reduce((sum, entry) => sum + entry.block_price * entry.block_mw_used, 0) / totalMw;
}

function minimumMw(profile: ProfilePoint[]): number {
  return Math.min(...profile.map((row) => row.mw));
}

function quarterPeriod(month: string): string {
  return `${yearFromMonth(month)}-${quarterFromMonth(month)}`;
}

function quarterFromMonth(month: string): string {
  const monthNumber = Number(month.slice(5, 7));
  return `Q${Math.floor((monthNumber - 1) / 3) + 1}`;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}
