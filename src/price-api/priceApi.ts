import { assertMonthString, expandMonthRange, yearFromMonth } from "./monthRange.ts";
import { FixtureBlockPriceProvider } from "./blockProviders.ts";
import { calculateProfileComponentRows } from "./blockStacking.ts";
import { FixtureCurrencyProvider, FixtureFuturesPriceProvider } from "./providers.ts";
import { validateProfilePriceRequest } from "./profileRequest.ts";
import {
  PriceApiError,
  type BlockPriceProvider,
  type CurrencyProvider,
  type FuturesPriceProvider,
  type PriceApi,
  type PriceApiRequest,
  type PriceApiResponse,
  type PriceApiResponseWithTrace,
  type ProfilePriceApiRequest,
} from "./types.ts";

type PriceApiProviders = {
  futuresPriceProvider: FuturesPriceProvider;
  currencyProvider: CurrencyProvider;
  blockPriceProvider?: BlockPriceProvider;
};

export function createPriceApi(providers: PriceApiProviders): PriceApi {
  const blockPriceProvider = providers.blockPriceProvider ?? new FixtureBlockPriceProvider();

  return {
    getMonthlyPrices(request: PriceApiRequest): PriceApiResponse {
      const startMonth = assertMonthString(request.start_month, "start_month");
      const endMonth = assertMonthString(request.end_month, "end_month");
      const months = expandMonthRange(startMonth, endMonth);

      return {
        base_currency: "EUR",
        price_unit: "EUR/MWh",
        rows: months.map((month) => {
          const year = yearFromMonth(month);
          const futures = providers.futuresPriceProvider.getAnnualPrice(year, "STO");
          if (!futures) {
            throw new PriceApiError("missing_data", `Missing annual futures fixture data for ${year}`);
          }

          const currency = providers.currencyProvider.getAnnualRate(year, "currency.sek");
          if (!currency) {
            throw new PriceApiError("missing_data", `Missing annual currency fixture data for ${year}`);
          }

          return {
            month,
            "base.sys": futures["base.sys"],
            "base.epad": futures["base.epad"],
            "currency.sek": currency.value,
          };
        }),
      };
    },
    getProfilePrices(request: ProfilePriceApiRequest): PriceApiResponse {
      return this.getProfilePricesWithTrace(request).response;
    },
    getProfilePricesWithTrace(request: ProfilePriceApiRequest): PriceApiResponseWithTrace {
      const normalizedRequest = validateProfilePriceRequest(request);
      return calculateProfileComponentRows(normalizedRequest, blockPriceProvider, (year) => {
        const currency = providers.currencyProvider.getAnnualRate(year, "currency.sek");
        if (!currency) {
          throw new PriceApiError("missing_data", `Missing annual currency fixture data for ${year}`);
        }
        return currency.value;
      });
    },
  };
}

export function createDefaultPriceApi(): PriceApi {
  return createPriceApi({
    futuresPriceProvider: new FixtureFuturesPriceProvider(),
    currencyProvider: new FixtureCurrencyProvider(),
  });
}
