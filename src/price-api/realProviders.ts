import { readFile } from "node:fs/promises";
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

export type HttpFetch = (url: string) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json?(): Promise<unknown>;
}>;

type FuturesProviderConfig = {
  sourceUrl: string;
  sourceName?: string;
  fetchImpl?: HttpFetch;
};

type CurrencyProviderConfig = {
  sourceUrl: string;
  sourceName?: string;
  fetchImpl?: HttpFetch;
};

export class ConfiguredHttpFuturesPriceProvider implements FuturesPriceProvider, BlockPriceProvider {
  private readonly blocks: NormalizedMarketPriceBlock[];

  constructor(blocks: NormalizedMarketPriceBlock[]) {
    this.blocks = blocks;
  }

  static async fromConfig(config: FuturesProviderConfig): Promise<ConfiguredHttpFuturesPriceProvider> {
    const fetchImpl = config.fetchImpl ?? fetch;
    const response = await fetchImpl(config.sourceUrl);
    if (!response.ok) {
      throw new PriceApiError("provider_error", `Futures price source returned HTTP ${response.status}`);
    }
    return ConfiguredHttpFuturesPriceProvider.fromText(await response.text(), config.sourceName ?? "configured-http-futures");
  }

  static async fromFile(filePath: string, sourceName = "configured-file-futures"): Promise<ConfiguredHttpFuturesPriceProvider> {
    return ConfiguredHttpFuturesPriceProvider.fromText(await readFile(filePath, "utf8"), sourceName);
  }

  static fromText(text: string, sourceName = "configured-text-futures"): ConfiguredHttpFuturesPriceProvider {
    return new ConfiguredHttpFuturesPriceProvider(parseMarketPriceBlocks(text, sourceName));
  }

  getNormalizedBlocks(): NormalizedMarketPriceBlock[] {
    return [...this.blocks];
  }

  getAnnualPrice(year: string, areaCode: "STO"): AnnualFuturesPrice | undefined {
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
    if (!block) {
      return undefined;
    }
    return directBlock(component, blockType, period, block.price, priceArea);
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

export class RealCurrencyProvider implements CurrencyProvider {
  private readonly rate: number;
  private readonly sourceName: string;

  constructor(rate: number, sourceName: string) {
    this.rate = rate;
    this.sourceName = sourceName;
  }

  static async fromConfig(config: CurrencyProviderConfig): Promise<RealCurrencyProvider> {
    const fetchImpl = config.fetchImpl ?? fetch;
    const response = await fetchImpl(config.sourceUrl);
    if (!response.ok) {
      throw new PriceApiError("provider_error", `Currency source returned HTTP ${response.status}`);
    }
    const data = response.json ? await response.json() : JSON.parse(await response.text());
    return RealCurrencyProvider.fromResponse(data, config.sourceName ?? "configured-currency");
  }

  static fromResponse(data: unknown, sourceName = "configured-currency"): RealCurrencyProvider {
    const rate = parseSekRate(data);
    return new RealCurrencyProvider(rate, sourceName);
  }

  getAnnualRate(year: string, componentCode: "currency.sek"): AnnualCurrencyRate | undefined {
    if (componentCode !== "currency.sek") {
      return undefined;
    }
    return {
      year,
      component_code: "currency.sek",
      value: this.rate,
    };
  }

  getSourceName(): string {
    return this.sourceName;
  }
}

export function parseMarketPriceBlocks(text: string, sourceName: string): NormalizedMarketPriceBlock[] {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new PriceApiError("provider_error", "Futures price source is empty");
  }

  const rows = trimmed.startsWith("{") || trimmed.startsWith("[") ? parseJsonRows(trimmed) : parseCsvRows(trimmed);
  return rows.map((row) => normalizeBlockRow(row, sourceName));
}

function parseJsonRows(text: string): Record<string, unknown>[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && Array.isArray((data as { blocks?: unknown }).blocks)) {
    return (data as { blocks: Record<string, unknown>[] }).blocks;
  }
  throw new PriceApiError("provider_error", "Futures JSON must be an array or an object with blocks");
}

function parseCsvRows(text: string): Record<string, unknown>[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function normalizeBlockRow(row: Record<string, unknown>, sourceName: string): NormalizedMarketPriceBlock {
  const component = readString(row, "component");
  if (component !== "base.sys" && component !== "base.epad" && component !== "currency.sek") {
    throw new PriceApiError("provider_error", `Unsupported component ${component}`);
  }

  const priceArea = readString(row, "price_area");
  if (priceArea !== "STO") {
    throw new PriceApiError("provider_error", `Unsupported price area ${priceArea}`);
  }

  const blockType = readString(row, "block_type");
  if (blockType !== "year" && blockType !== "quarter" && blockType !== "month") {
    throw new PriceApiError("provider_error", `Unsupported block_type ${blockType}`);
  }

  const sourceInstrument = readString(row, "source_instrument");
  return {
    component,
    price_area: priceArea,
    block_type: blockType,
    block_id: optionalString(row, "block_id") ?? `${component}:${priceArea}:${blockType}:${sourceInstrument}`,
    start_month: readString(row, "start_month"),
    end_month: readString(row, "end_month"),
    price: readNumber(row, "price"),
    currency: readString(row, "currency"),
    price_unit: readString(row, "price_unit"),
    retrieved_at: optionalString(row, "retrieved_at") ?? new Date(0).toISOString(),
    source_name: optionalString(row, "source_name") ?? sourceName,
    source_instrument: sourceInstrument,
  };
}

function parseSekRate(data: unknown): number {
  if (!data || typeof data !== "object") {
    throw new PriceApiError("provider_error", "Currency response must be an object");
  }

  const objectData = data as Record<string, unknown>;
  if (typeof objectData.rate === "number") {
    return objectData.rate;
  }

  const rates = objectData.rates;
  if (rates && typeof rates === "object" && typeof (rates as Record<string, unknown>).SEK === "number") {
    return (rates as Record<string, number>).SEK;
  }

  throw new PriceApiError("provider_error", "Currency response did not contain a SEK rate");
}

function readString(row: Record<string, unknown>, fieldName: string): string {
  const value = row[fieldName];
  if (typeof value !== "string" || value.trim() === "") {
    throw new PriceApiError("provider_error", `${fieldName} is required`);
  }
  return value;
}

function optionalString(row: Record<string, unknown>, fieldName: string): string | undefined {
  const value = row[fieldName];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readNumber(row: Record<string, unknown>, fieldName: string): number {
  const value = row[fieldName];
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    throw new PriceApiError("provider_error", `${fieldName} must be numeric`);
  }
  return numericValue;
}

function periodRange(blockType: BlockType, period: string): { start_month: string; end_month: string } {
  if (blockType === "year") {
    return { start_month: `${period}-01`, end_month: `${period}-12` };
  }

  if (blockType === "month") {
    return { start_month: period, end_month: period };
  }

  const [year, quarter] = period.split("-");
  const quarterMonths: Record<string, [string, string]> = {
    Q1: ["01", "03"],
    Q2: ["04", "06"],
    Q3: ["07", "09"],
    Q4: ["10", "12"],
  };
  const months = quarterMonths[quarter];
  if (!months) {
    throw new PriceApiError("provider_error", `Unsupported quarter period ${period}`);
  }
  return { start_month: `${year}-${months[0]}`, end_month: `${year}-${months[1]}` };
}
