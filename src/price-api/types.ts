export type MonthString = `${number}-${number}`;

export type PriceApiRequest = {
  start_month: string;
  end_month: string;
};

export type PriceApiRow = {
  month: string;
  "base.sys": number;
  "base.epad": number;
  "currency.sek": number;
};

export type PriceApiResponse = {
  base_currency: "EUR";
  price_unit: "EUR/MWh";
  rows: PriceApiRow[];
};

export type PriceArea = "STO";

export type EnergyComponentCode = "base.sys" | "base.epad";

export type PriceComponentCode = EnergyComponentCode | "currency.sek";

export type BlockType = "year" | "quarter" | "month";

export type AnnualFuturesPrice = {
  year: string;
  area_code: "STO";
  "base.sys": number;
  "base.epad": number;
};

export type AnnualCurrencyRate = {
  year: string;
  component_code: "currency.sek";
  value: number;
};

export interface FuturesPriceProvider {
  getAnnualPrice(year: string, areaCode: "STO"): AnnualFuturesPrice | undefined;
}

export interface CurrencyProvider {
  getAnnualRate(year: string, componentCode: "currency.sek"): AnnualCurrencyRate | undefined;
}

export type ProfilePoint = {
  month: string;
  mw: number;
};

export type ProfilePriceApiRequest = {
  price_area: string;
  profile: ProfilePoint[];
};

export type NormalizedProfilePriceApiRequest = {
  price_area: PriceArea;
  profile: ProfilePoint[];
};

export type PriceBlock = {
  id: string;
  component: EnergyComponentCode;
  price_area: PriceArea;
  block_type: BlockType;
  period: string;
  price: number;
  virtual: boolean;
  virtual_rule_id?: string;
  source_block_id?: string;
};

export type NormalizedMarketPriceBlock = {
  component: PriceComponentCode;
  price_area: PriceArea;
  block_type: BlockType;
  block_id: string;
  start_month: string;
  end_month: string;
  price: number;
  currency: string;
  price_unit: string;
  retrieved_at: string;
  source_name: string;
  source_instrument: string;
};

export interface BlockPriceProvider {
  getBlock(component: EnergyComponentCode, priceArea: PriceArea, blockType: BlockType, period: string): PriceBlock | undefined;
}

export type PriceApiTraceEntry = {
  month: string;
  component: PriceComponentCode;
  source_block_type: BlockType | "annual_currency";
  source_block_id: string;
  block_price: number;
  block_mw_used: number;
  virtual: boolean;
  virtual_rule_id?: string;
};

export type PriceApiResponseWithTrace = {
  response: PriceApiResponse;
  trace: PriceApiTraceEntry[];
};

export class PriceApiError extends Error {
  readonly code: "invalid_request" | "missing_data" | "configuration_error" | "provider_error";

  constructor(code: "invalid_request" | "missing_data" | "configuration_error" | "provider_error", message: string) {
    super(message);
    this.code = code;
    this.name = "PriceApiError";
  }
}

export type PriceApi = {
  getMonthlyPrices(request: PriceApiRequest): PriceApiResponse;
  getProfilePrices(request: ProfilePriceApiRequest): PriceApiResponse;
  getProfilePricesWithTrace(request: ProfilePriceApiRequest): PriceApiResponseWithTrace;
};
