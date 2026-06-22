import { createPriceApi, createDefaultPriceApi } from "./priceApi.ts";
import { ConfiguredHttpFuturesPriceProvider, RealCurrencyProvider, type HttpFetch } from "./realProviders.ts";
import { StaticCurrencyProvider, StaticDerivativePriceProvider } from "./staticDerivativePrices.ts";
import { PriceApiError, type PriceApi } from "./types.ts";

const DEFAULT_CURRENCY_SOURCE_URL = "https://api.frankfurter.dev/v2/rate/EUR/SEK";

export type ProviderModeEnvironment = Record<string, string | undefined>;

export async function createPriceApiFromProviderMode(options: {
  env?: ProviderModeEnvironment;
  fetchImpl?: HttpFetch;
} = {}): Promise<PriceApi> {
  const env = options.env ?? process.env;
  const mode = env.PRICE_PROVIDER_MODE ?? "fixture";

  if (mode === "fixture") {
    return createDefaultPriceApi();
  }

  if (mode === "static") {
    const staticDerivativeProvider = new StaticDerivativePriceProvider();
    return createPriceApi({
      futuresPriceProvider: staticDerivativeProvider,
      currencyProvider: new StaticCurrencyProvider(),
      blockPriceProvider: staticDerivativeProvider,
    });
  }

  if (mode !== "real") {
    throw new PriceApiError("configuration_error", `Unsupported PRICE_PROVIDER_MODE ${mode}`);
  }

  const futuresProvider = await createRealFuturesProvider(env, options.fetchImpl);
  const currencyProvider = await RealCurrencyProvider.fromConfig({
    sourceUrl: env.PRICE_API_CURRENCY_SOURCE_URL ?? DEFAULT_CURRENCY_SOURCE_URL,
    sourceName: "frankfurter-eur-sek",
    fetchImpl: options.fetchImpl,
  });

  return createPriceApi({
    futuresPriceProvider: futuresProvider,
    currencyProvider,
    blockPriceProvider: futuresProvider,
  });
}

async function createRealFuturesProvider(env: ProviderModeEnvironment, fetchImpl?: HttpFetch): Promise<ConfiguredHttpFuturesPriceProvider> {
  if (env.PRICE_API_FUTURES_SOURCE_URL) {
    return ConfiguredHttpFuturesPriceProvider.fromConfig({
      sourceUrl: env.PRICE_API_FUTURES_SOURCE_URL,
      sourceName: "configured-futures-url",
      fetchImpl,
    });
  }

  if (env.PRICE_API_FUTURES_SOURCE_FILE) {
    return ConfiguredHttpFuturesPriceProvider.fromFile(env.PRICE_API_FUTURES_SOURCE_FILE);
  }

  throw new PriceApiError(
    "configuration_error",
    "real provider mode requires PRICE_API_FUTURES_SOURCE_URL or PRICE_API_FUTURES_SOURCE_FILE",
  );
}
