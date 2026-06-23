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
import { getComponentMetadata } from "./canonicalComponents.ts";

export const CALENDAR_SET_ID = "CAL_SE_TRADING";

export const COMPONENTS_BY_PRODUCT = new Map([
  ["Baseloads", ["base.sys", "base.epad"]],
  ["Peaks.Classic", ["base.classic.sys", "base.classic.epad", "peak.classic.sys", "peak.classic.epad"]],
  ["Peaks.Modern", ["allocation.peak", "base.sys", "base.epad", "peak.premium.sys", "peak.premium.epad"]],
  [
    "Profiles.Classic",
    ["base.classic.sys", "base.classic.epad", "peak.classic.sys", "peak.classic.epad", "profile.sys", "profile.epad", "volume"],
  ],
  [
    "Profiles.Modern",
    ["allocation.peak", "base.sys", "base.epad", "peak.premium.sys", "peak.premium.epad", "profile.sys", "profile.epad", "volume"],
  ],
]);

export const Q_FACTOR_RANGES = new Map([
  ["allocation.peak", [0, 0]],
  ["base.sys", [1, 1]],
  ["base.epad", [1, 1]],
  ["base.classic.sys", [1, 1]],
  ["base.classic.epad", [1, 1]],
  ["peak.modern.sys", [1.2, 1.5]],
  ["peak.modern.epad", [1.2, 1.5]],
  ["peak.premium.sys", [1.2, 1.5]],
  ["peak.premium.epad", [1.2, 1.5]],
  ["peak.classic.sys", [2.2, 2.5]],
  ["peak.classic.epad", [2.2, 2.5]],
  ["profile.sys", [1.03, 1.09]],
  ["profile.epad", [1.03, 1.09]],
  ["volume", [0, 0]],
]);

const PRICE_BY_COMPONENT = new Map([
  ["allocation.peak", 0],
  ["base.sys", 80],
  ["base.epad", 5],
  ["base.classic.sys", 80],
  ["base.classic.epad", 5],
  ["peak.classic.sys", 20],
  ["peak.classic.epad", 3],
  ["peak.modern.sys", 12],
  ["peak.modern.epad", 2],
  ["peak.premium.sys", 12],
  ["peak.premium.epad", 2],
  ["profile.sys", 7],
  ["profile.epad", 2],
  ["volume", 4],
]);

const PRODUCT_SEEDS = [
  {
    seed_index: 0,
    product_id: "PRO00",
    product_name: "Baseloads",
    customer_id: "CUS00",
    customer_number: "CUS00",
    portfolio_id: "CUS00-0",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    seed_index: 1,
    product_id: "PRO01",
    product_name: "Peaks.Classic",
    customer_id: "CUS01",
    customer_number: "CUS01",
    portfolio_id: "CUS01-0",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    seed_index: 2,
    product_id: "PRO02",
    product_name: "Peaks.Modern",
    customer_id: "CUS02",
    customer_number: "CUS02",
    portfolio_id: "CUS02-0",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    seed_index: 3,
    product_id: "PRO03",
    product_name: "Profiles.Classic",
    customer_id: "CUS03",
    customer_number: "CUS03",
    portfolio_id: "CUS03-0",
    forecast_mwh: 1000,
    peak_pct: 0.5,
  },
  {
    seed_index: 4,
    product_id: "PRO04",
    product_name: "Profiles.Modern",
    customer_id: "CUS04",
    customer_number: "CUS04",
    portfolio_id: "CUS04-0",
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
      name: `${product.product_name} Customer`,
      customer_number: product.customer_number,
    });

    insertCustomerPortfolio(database, {
      portfolio_id: product.portfolio_id,
      customer_id: product.customer_id,
      name: `${product.product_name} Portfolio`,
      customer_number: product.customer_number,
      price_area: "SE3",
      calendar_id: CALENDAR_SET_ID,
    });

    insertProductConfiguration(database, {
      product_id: product.product_id,
      name: product.product_name,
    });

    const componentCodes = COMPONENTS_BY_PRODUCT.get(product.product_name) ?? [];
    for (const [componentIndex, componentCode] of componentCodes.entries()) {
      const productComponentId = productComponentIdFor(product.product_id, componentCode);
      insertProductConfigurationComponent(database, {
        productcomponent_id: productComponentId,
        product_id: product.product_id,
        name: componentDisplayName(product.product_name, componentCode),
        component: componentCode,
        productitem: productItemFor(componentCode),
        ...getComponentMetadata(componentCode),
      });

      insertPriceComponent(database, {
        pricecomponent_id: priceComponentIdFor(product.product_id, componentCode),
        productcomponent_id: productComponentId,
        price: PRICE_BY_COMPONENT.get(componentCode) ?? 0,
        currency: "EUR",
      });

      const qFactorSetId = qFactorSetIdFor(product.seed_index, componentIndex);
      insertQFactorSet(database, {
        qfactor_set_id: qFactorSetId,
        name: `${qFactorSetId} ${componentCode} Q-factor`,
        component: componentCode,
        description: `Deterministic ${componentCode} Q-factor set`,
      });

      insertPortfolioProductComponent(database, {
        portfolio_productcomponent_id: portfolioProductComponentIdFor(product.portfolio_id, componentCode),
        portfolio_id: product.portfolio_id,
        productcomponent_id: productComponentId,
        qfactor_set_id: qFactorSetId,
      });

      months.forEach((month, monthIndex) => {
        insertQFactorValue(database, {
          qfactor_value_id: qFactorValueIdFor(qFactorSetId, monthIndex),
          qfactor_set_id: qFactorSetId,
          month,
          value: qFactorValueFor(componentCode, monthIndex),
        });
      });
    }

    months.forEach((month, monthIndex) => {
      insertCustomerForecast(database, {
        forecast_id: forecastIdFor(product.seed_index, monthIndex),
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
  return `${productId}:${componentCode}`;
}

function priceComponentIdFor(productId: string, componentCode: string): string {
  return `PRI:${productId}:${componentCode}`;
}

function portfolioProductComponentIdFor(portfolioId: string, componentCode: string): string {
  return `${portfolioId}:${componentCode}`;
}

function qFactorSetIdFor(productIndex: number, componentIndex: number): string {
  return `Q${String(productIndex * 10 + componentIndex).padStart(2, "0")}`;
}

function qFactorValueIdFor(qFactorSetId: string, monthIndex: number): string {
  return `${qFactorSetId}-${String(monthIndex).padStart(2, "0")}`;
}

function forecastIdFor(productIndex: number, monthIndex: number): string {
  return `FOR${String(productIndex).padStart(2, "0")}-${String(monthIndex).padStart(2, "0")}`;
}

function componentDisplayName(productName: string, componentCode: string): string {
  return `${productName} ${componentCode}`;
}

function productItemFor(componentCode: string): string {
  if (componentCode === "allocation.peak") {
    return "allocation";
  }
  if (componentCode.startsWith("peak.premium.")) {
    return "peak";
  }
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
