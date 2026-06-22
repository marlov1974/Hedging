import { directBlock } from "./blockProviders.ts";
import {
  PriceApiError,
  type AnnualCurrencyRate,
  type AnnualFuturesPrice,
  type BlockPriceProvider,
  type BlockType,
  type CurrencyProvider,
  type EnergyComponentCode,
  type FuturesPriceProvider,
  type NormalizedMarketPriceBlock,
  type PriceArea,
  type PriceBlock,
} from "./types.ts";

const STATIC_RETRIEVED_AT = "2026-06-22T00:00:00.000Z";
const STATIC_SOURCE_NAME = "synthetic-static-derivative-poc";
const STATIC_PRICE_AREA: PriceArea = "STO";

const ANNUAL_BASE_PRICES: Record<string, Record<EnergyComponentCode, number>> = {
  "2027": { "base.sys": 54.2, "base.epad": 5.4 },
  "2028": { "base.sys": 55.1, "base.epad": 5.7 },
  "2029": { "base.sys": 56.0, "base.epad": 6.0 },
  "2030": { "base.sys": 57.4, "base.epad": 6.3 },
};

const STATIC_CURRENCY_RATES: Record<string, number> = {
  "2027": 11.2,
  "2028": 11.35,
  "2029": 11.5,
  "2030": 11.65,
};

const QUARTER_ADJUSTMENTS: Record<string, number> = {
  Q1: 1.08,
  Q2: 0.96,
  Q3: 0.92,
  Q4: 1.04,
};

const MONTH_ADJUSTMENTS = [1.14, 1.1, 1.03, 0.97, 0.94, 0.9, 0.88, 0.91, 0.95, 1.0, 1.06, 1.12];

export class StaticDerivativePriceProvider implements FuturesPriceProvider, BlockPriceProvider {
  private readonly blocks: NormalizedMarketPriceBlock[];

  constructor(blocks: NormalizedMarketPriceBlock[] = createStaticDerivativePriceBlocks()) {
    this.blocks = blocks;
  }

  getNormalizedBlocks(): NormalizedMarketPriceBlock[] {
    return [...this.blocks];
  }

  getAnnualPrice(year: string, areaCode: PriceArea): AnnualFuturesPrice | undefined {
    const baseSys = this.findNormalizedBlock("base.sys", areaCode, "year", `${year}-01`, `${year}-12`);
    const baseEpad = this.findNormalizedBlock("base.epad", areaCode, "year", `${year}-01`, `${year}-12`);
    if (!baseSys || !baseEpad) {
      return undefined;
    }

    return {
      year,
      area_code: areaCode,
      "base.sys": baseSys.price,
      "base.epad": baseEpad.price,
    };
  }

  getBlock(component: EnergyComponentCode, priceArea: PriceArea, blockType: BlockType, period: string): PriceBlock | undefined {
    const range = periodRange(blockType, period);
    const block = this.findNormalizedBlock(component, priceArea, blockType, range.start_month, range.end_month);
    return block ? directBlock(component, blockType, period, block.price, priceArea) : undefined;
  }

  private findNormalizedBlock(
    component: EnergyComponentCode,
    priceArea: PriceArea,
    blockType: BlockType,
    startMonth: string,
    endMonth: string,
  ): NormalizedMarketPriceBlock | undefined {
    return this.blocks.find(
      (block) =>
        block.component === component &&
        block.price_area === priceArea &&
        block.block_type === blockType &&
        block.start_month === startMonth &&
        block.end_month === endMonth,
    );
  }
}

export class StaticCurrencyProvider implements CurrencyProvider {
  getAnnualRate(year: string, componentCode: "currency.sek"): AnnualCurrencyRate | undefined {
    const rate = STATIC_CURRENCY_RATES[year];
    if (!rate || componentCode !== "currency.sek") {
      return undefined;
    }

    return {
      year,
      component_code: "currency.sek",
      value: rate,
    };
  }
}

export function createStaticDerivativePriceBlocks(): NormalizedMarketPriceBlock[] {
  const blocks: NormalizedMarketPriceBlock[] = [];

  for (const [year, componentPrices] of Object.entries(ANNUAL_BASE_PRICES)) {
    for (const component of energyComponents()) {
      blocks.push(
        createBlock({
          component,
          blockType: "year",
          blockId: `${component}:STO:year:${year}`,
          startMonth: `${year}-01`,
          endMonth: `${year}-12`,
          price: componentPrices[component],
          sourceInstrument: `${component.toUpperCase()}:YR-${year}`,
        }),
      );
    }
  }

  for (const year of ["2027", "2028", "2029"]) {
    for (const quarter of ["Q1", "Q2", "Q3", "Q4"]) {
      if (year === "2029" && quarter === "Q4") {
        continue;
      }
      const [startMonth, endMonth] = quarterMonthRange(year, quarter);
      for (const component of energyComponents()) {
        blocks.push(
          createBlock({
            component,
            blockType: "quarter",
            blockId: `${component}:STO:quarter:${year}-${quarter}`,
            startMonth,
            endMonth,
            price: roundPrice(ANNUAL_BASE_PRICES[year][component] * QUARTER_ADJUSTMENTS[quarter]),
            sourceInstrument: `${component.toUpperCase()}:${year}-${quarter}`,
          }),
        );
      }
    }
  }

  for (const year of ["2027", "2028", "2029"]) {
    for (let monthNumber = 1; monthNumber <= 12; monthNumber += 1) {
      const month = `${year}-${String(monthNumber).padStart(2, "0")}`;
      const adjustment = MONTH_ADJUSTMENTS[monthNumber - 1];
      for (const component of energyComponents()) {
        blocks.push(
          createBlock({
            component,
            blockType: "month",
            blockId: `${component}:STO:month:${month}`,
            startMonth: month,
            endMonth: month,
            price: roundPrice(ANNUAL_BASE_PRICES[year][component] * adjustment),
            sourceInstrument: `${component.toUpperCase()}:M-${month}`,
          }),
        );
      }
    }
  }

  return blocks;
}

export function getStaticMonthlyReferencePrice(month: string, component: EnergyComponentCode, priceArea: PriceArea = STATIC_PRICE_AREA): number {
  const provider = new StaticDerivativePriceProvider();
  const block = provider.getBlock(component, priceArea, "month", month);
  if (!block) {
    throw new PriceApiError("missing_data", `Missing static monthly derivative price for ${component} ${priceArea} ${month}`);
  }
  return block.price;
}

function createBlock(input: {
  component: EnergyComponentCode;
  blockType: BlockType;
  blockId: string;
  startMonth: string;
  endMonth: string;
  price: number;
  sourceInstrument: string;
}): NormalizedMarketPriceBlock {
  return {
    component: input.component,
    price_area: STATIC_PRICE_AREA,
    block_type: input.blockType,
    block_id: input.blockId,
    start_month: input.startMonth,
    end_month: input.endMonth,
    price: input.price,
    currency: "EUR",
    price_unit: "EUR/MWh",
    retrieved_at: STATIC_RETRIEVED_AT,
    source_name: STATIC_SOURCE_NAME,
    source_instrument: input.sourceInstrument,
  };
}

function energyComponents(): EnergyComponentCode[] {
  return ["base.sys", "base.epad"];
}

function quarterMonthRange(year: string, quarter: string): [string, string] {
  const months: Record<string, [string, string]> = {
    Q1: ["01", "03"],
    Q2: ["04", "06"],
    Q3: ["07", "09"],
    Q4: ["10", "12"],
  };
  const range = months[quarter];
  if (!range) {
    throw new PriceApiError("provider_error", `Unsupported quarter ${quarter}`);
  }
  return [`${year}-${range[0]}`, `${year}-${range[1]}`];
}

function periodRange(blockType: BlockType, period: string): { start_month: string; end_month: string } {
  if (blockType === "year") {
    return { start_month: `${period}-01`, end_month: `${period}-12` };
  }
  if (blockType === "month") {
    return { start_month: period, end_month: period };
  }
  const [year, quarter] = period.split("-");
  const [startMonth, endMonth] = quarterMonthRange(year, quarter);
  return { start_month: startMonth, end_month: endMonth };
}

function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}
