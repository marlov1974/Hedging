import type { PrototypeDatabase } from "../database/schema.ts";
import type { CustomerTransaction, ProductConfigurationComponent } from "../database/types.ts";

export function resolveConfiguredComponentPrice(
  database: PrototypeDatabase,
  component: ProductConfigurationComponent,
  qFactor: number,
): number {
  const derivedPeakPrice = derivePeakPriceFromBase(database, component, qFactor);
  if (derivedPeakPrice !== null) {
    return derivedPeakPrice;
  }
  return configuredPriceForComponent(database, component) ?? 0;
}

export function resolveTransactionComponentPrice(
  database: PrototypeDatabase,
  transaction: CustomerTransaction,
): number | null {
  if (transaction.price !== undefined) {
    return transaction.price;
  }

  const component = database.productConfigurationComponents.get(transaction.productcomponent_id);
  if (!component) {
    return null;
  }

  const derivedPeakPrice = derivePeakPriceFromBase(database, component, transaction.q_factor);
  if (derivedPeakPrice !== null) {
    return derivedPeakPrice;
  }

  return configuredPriceForComponent(database, component);
}

function derivePeakPriceFromBase(
  database: PrototypeDatabase,
  component: ProductConfigurationComponent,
  qFactor: number,
): number | null {
  const baseComponentCode = baseComponentForPeak(component.component);
  if (!baseComponentCode) {
    return null;
  }

  const baseComponent = [...database.productConfigurationComponents.values()].find(
    (candidate) => candidate.product_id === component.product_id && candidate.component === baseComponentCode,
  );
  if (!baseComponent) {
    return null;
  }

  const basePrice = configuredPriceForComponent(database, baseComponent);
  if (basePrice === null) {
    return null;
  }

  return basePrice * qFactor;
}

function baseComponentForPeak(componentCode: string): "base.sys" | "base.epad" | null {
  if (!componentCode.startsWith("peak.") && !componentCode.startsWith("peak_")) {
    return null;
  }
  if (componentCode.endsWith(".sys") || componentCode.endsWith("_sys")) {
    return "base.sys";
  }
  if (componentCode.endsWith(".epad") || componentCode.endsWith("_epad")) {
    return "base.epad";
  }
  return null;
}

function configuredPriceForComponent(database: PrototypeDatabase, component: ProductConfigurationComponent): number | null {
  return [...database.priceComponents.values()].find((candidate) => candidate.productcomponent_id === component.productcomponent_id)?.price ?? null;
}
