import { createSchema, type PrototypeDatabase } from "./schema.ts";
import {
  insertCalendar,
  insertCustomer,
  insertCustomerForecast,
  insertCustomerPortfolio,
  insertPortfolioProductComponent,
  insertPriceComponent,
  insertProductConfiguration,
  insertProductConfigurationComponent,
  insertQFactorSet,
  insertQFactorValue,
} from "./repository.ts";

export const CALENDAR_SET_ID = "CAL_SE_TRADING";

export const COMPONENTS_BY_PRODUCT = new Map([
  ["Baseloads", ["base.sys", "base.epad"]],
  ["PeaksClassic", ["base.classic.sys", "base.classic.epad", "peak.classic.sys", "peak.classic.epad"]],
  ["PeaksModern", ["base.sys", "base.epad", "peak.modern.sys", "peak.modern.epad"]],
  [
    "ProfilesClassic",
    ["base.classic.sys", "base.classic.epad", "peak.classic.sys", "peak.classic.epad", "profile.sys", "profile.epad", "volume"],
  ],
  ["ProfilesModern", ["base.sys", "base.epad", "peak.modern.sys", "peak.modern.epad", "profile.sys", "profile.epad", "volume"]],
]);

export const Q_FACTOR_RANGES = new Map([
  ["base.sys", [1, 1]],
  ["base.epad", [1, 1]],
  ["base.classic.sys", [1, 1]],
  ["base.classic.epad", [1, 1]],
  ["peak.modern.sys", [1.2, 1.5]],
  ["peak.modern.epad", [1.2, 1.5]],
  ["peak.classic.sys", [2.2, 2.5]],
  ["peak.classic.epad", [2.2, 2.5]],
  ["profile.sys", [1.03, 1.09]],
  ["profile.epad", [1.03, 1.09]],
  ["volume", [0, 0]],
]);

const PRICE_BY_COMPONENT = new Map([
  ["base.sys", 80],
  ["base.epad", 5],
  ["base.classic.sys", 80],
  ["base.classic.epad", 5],
  ["peak.classic.sys", 20],
  ["peak.classic.epad", 3],
  ["peak.modern.sys", 12],
  ["peak.modern.epad", 2],
  ["profile.sys", 7],
  ["profile.epad", 2],
  ["volume", 4],
]);

const PRODUCT_SEEDS = [
  {
    product_id: "PRODUCT_BASELOADS",
    product_name: "Baseloads",
    customer_id: "CUST_BASELOADS",
    customer_number: "CN_BASELOADS",
    portfolio_id: "PORT_BASELOADS",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    product_id: "PRODUCT_PEAKS_CLASSIC",
    product_name: "PeaksClassic",
    customer_id: "CUST_PEAKS_CLASSIC",
    customer_number: "CN_PEAKS_CLASSIC",
    portfolio_id: "PORT_PEAKS_CLASSIC",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    product_id: "PRODUCT_PEAKS_MODERN",
    product_name: "PeaksModern",
    customer_id: "CUST_PEAKS_MODERN",
    customer_number: "CN_PEAKS_MODERN",
    portfolio_id: "PORT_PEAKS_MODERN",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    product_id: "PRODUCT_PROFILES_CLASSIC",
    product_name: "ProfilesClassic",
    customer_id: "CUST_PROFILES_CLASSIC",
    customer_number: "CN_PROFILES_CLASSIC",
    portfolio_id: "PORT_PROFILES_CLASSIC",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    product_id: "PRODUCT_PROFILES_MODERN",
    product_name: "ProfilesModern",
    customer_id: "CUST_PROFILES_MODERN",
    customer_number: "CN_PROFILES_MODERN",
    portfolio_id: "PORT_PROFILES_MODERN",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
];

export function createPocSeedData(): PrototypeDatabase {
  const database = createSchema();
  const months = listSeedMonths();

  for (const month of months) {
    const hours = calculateSwedishTradingHours(month);
    insertCalendar(database, {
      calendar_id: calendarIdForMonth(month),
      month,
      total_h: hours.total_h,
      peak_h: hours.peak_h,
    });
  }

  for (const product of PRODUCT_SEEDS) {
    insertCustomer(database, {
      customer_id: product.customer_id,
      name: `Synthetic ${product.product_name} Customer`,
      customer_number: product.customer_number,
    });

    insertCustomerPortfolio(database, {
      portfolio_id: product.portfolio_id,
      customer_id: product.customer_id,
      name: `Synthetic ${product.product_name} Portfolio`,
      customer_number: product.customer_number,
      price_area: "SE3",
      calendar_id: CALENDAR_SET_ID,
    });

    insertProductConfiguration(database, {
      product_id: product.product_id,
      name: product.product_name,
    });

    const componentCodes = COMPONENTS_BY_PRODUCT.get(product.product_name) ?? [];
    for (const componentCode of componentCodes) {
      const productComponentId = productComponentIdFor(product.product_id, componentCode);
      insertProductConfigurationComponent(database, {
        productcomponent_id: productComponentId,
        product_id: product.product_id,
        name: componentDisplayName(product.product_name, componentCode),
        component: componentCode,
        productitem: productItemFor(componentCode),
      });

      insertPriceComponent(database, {
        pricecomponent_id: priceComponentIdFor(product.product_id, componentCode),
        productcomponent_id: productComponentId,
        price: PRICE_BY_COMPONENT.get(componentCode) ?? 0,
        currency: "EUR",
      });

      const qFactorSetId = qFactorSetIdFor(product.portfolio_id, componentCode);
      insertQFactorSet(database, {
        qfactor_set_id: qFactorSetId,
        name: `${product.portfolio_id} ${componentCode} Q-factor`,
        component: componentCode,
        description: `Synthetic deterministic ${componentCode} Q-factor set`,
      });

      insertPortfolioProductComponent(database, {
        portfolio_productcomponent_id: portfolioProductComponentIdFor(product.portfolio_id, componentCode),
        portfolio_id: product.portfolio_id,
        productcomponent_id: productComponentId,
        qfactor_set_id: qFactorSetId,
      });

      months.forEach((month, monthIndex) => {
        insertQFactorValue(database, {
          qfactor_value_id: qFactorValueIdFor(qFactorSetId, month),
          qfactor_set_id: qFactorSetId,
          month,
          value: qFactorValueFor(componentCode, monthIndex),
        });
      });
    }

    months.forEach((month, monthIndex) => {
      insertCustomerForecast(database, {
        forecast_id: forecastIdFor(product.portfolio_id, month),
        portfolio_id: product.portfolio_id,
        month,
        mwh: forecastMwhFor(product.forecast_mwh, monthIndex),
        peak_pct: forecastPeakPctFor(product.peak_pct, monthIndex),
      });
    });
  }

  return database;
}

export function listSeedMonths(): string[] {
  const months: string[] = [];
  for (let year = 2027; year <= 2029; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      months.push(`${year}-${String(month).padStart(2, "0")}`);
    }
  }
  return months;
}

export function calculateSwedishTradingHours(month: string): { total_h: number; peak_h: number; offpeak_h: number } {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  let weekdays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayOfWeek = new Date(Date.UTC(year, monthNumber - 1, day)).getUTCDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays += 1;
    }
  }

  const total_h = daysInMonth * 24;
  const peak_h = weekdays * 16;
  return { total_h, peak_h, offpeak_h: total_h - peak_h };
}

function calendarIdForMonth(month: string): string {
  return `${CALENDAR_SET_ID}:${month}`;
}

function productComponentIdFor(productId: string, componentCode: string): string {
  return `${productId}:${componentSlug(componentCode)}`;
}

function priceComponentIdFor(productId: string, componentCode: string): string {
  return `PRICE:${productId}:${componentSlug(componentCode)}`;
}

function portfolioProductComponentIdFor(portfolioId: string, componentCode: string): string {
  return `PPC:${portfolioId}:${componentSlug(componentCode)}`;
}

function qFactorSetIdFor(portfolioId: string, componentCode: string): string {
  return `QFS:${portfolioId}:${componentSlug(componentCode)}`;
}

function qFactorValueIdFor(qFactorSetId: string, month: string): string {
  return `QFV:${qFactorSetId}:${month}`;
}

function forecastIdFor(portfolioId: string, month: string): string {
  return `FORECAST:${portfolioId}:${month}`;
}

function componentSlug(componentCode: string): string {
  return componentCode.replaceAll(".", "_");
}

function componentDisplayName(productName: string, componentCode: string): string {
  return `${productName} ${componentCode}`;
}

function productItemFor(componentCode: string): string {
  return componentCode.split(".")[0];
}

function qFactorValueFor(componentCode: string, monthIndex: number): number {
  const range = Q_FACTOR_RANGES.get(componentCode);
  if (!range) {
    return 0;
  }

  const [min, max] = range;
  if (min === max) {
    return min;
  }

  const cyclePosition = monthIndex % 12;
  return Number((min + (cyclePosition / 11) * (max - min)).toFixed(6));
}

function forecastMwhFor(baseMwh: number, monthIndex: number): number {
  const seasonalProfile = [1230, 1210, 1110, 995, 930, 900, 760, 820, 960, 1040, 1150, 840];
  const yearOffset = Math.floor(monthIndex / 12) * 8;
  const month = monthIndex % 12;
  return baseMwh + seasonalProfile[month] - 1000 + yearOffset;
}

function forecastPeakPctFor(basePeakPct: number, monthIndex: number): number {
  const seasonalPercentProfile = [50, 51, 53, 56, 59, 60, 52, 52, 58, 55, 52, 42];
  const month = monthIndex % 12;
  return Number((basePeakPct + seasonalPercentProfile[month] / 100 - 0.5).toFixed(2));
}
