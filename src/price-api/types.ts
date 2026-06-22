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

export class PriceApiError extends Error {
  readonly code: "invalid_request" | "missing_data";

  constructor(code: "invalid_request" | "missing_data", message: string) {
    super(message);
    this.code = code;
    this.name = "PriceApiError";
  }
}

export type PriceApi = {
  getMonthlyPrices(request: PriceApiRequest): PriceApiResponse;
};
