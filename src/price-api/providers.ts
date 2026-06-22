import type {
  AnnualCurrencyRate,
  AnnualFuturesPrice,
  CurrencyProvider,
  FuturesPriceProvider,
} from "./types.ts";

const DEFAULT_FUTURES_FIXTURES: Record<string, AnnualFuturesPrice> = {
  "2027": {
    year: "2027",
    area_code: "STO",
    "base.sys": 51.25,
    "base.epad": 4.75,
  },
  "2028": {
    year: "2028",
    area_code: "STO",
    "base.sys": 52.5,
    "base.epad": 5.25,
  },
};

const DEFAULT_CURRENCY_FIXTURES: Record<string, AnnualCurrencyRate> = {
  "2027": {
    year: "2027",
    component_code: "currency.sek",
    value: 11.2,
  },
  "2028": {
    year: "2028",
    component_code: "currency.sek",
    value: 11.4,
  },
};

export class FixtureFuturesPriceProvider implements FuturesPriceProvider {
  private readonly annualPrices: Record<string, AnnualFuturesPrice>;

  constructor(annualPrices: Record<string, AnnualFuturesPrice> = DEFAULT_FUTURES_FIXTURES) {
    this.annualPrices = annualPrices;
  }

  getAnnualPrice(year: string, areaCode: "STO"): AnnualFuturesPrice | undefined {
    const price = this.annualPrices[year];
    if (!price || price.area_code !== areaCode) {
      return undefined;
    }
    return price;
  }
}

export class FixtureCurrencyProvider implements CurrencyProvider {
  private readonly annualRates: Record<string, AnnualCurrencyRate>;

  constructor(annualRates: Record<string, AnnualCurrencyRate> = DEFAULT_CURRENCY_FIXTURES) {
    this.annualRates = annualRates;
  }

  getAnnualRate(year: string, componentCode: "currency.sek"): AnnualCurrencyRate | undefined {
    const rate = this.annualRates[year];
    if (!rate || rate.component_code !== componentCode) {
      return undefined;
    }
    return rate;
  }
}
