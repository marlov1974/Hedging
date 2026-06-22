import { createPriceApiFromProviderMode } from "./providerMode.ts";
import { PriceApiError } from "./types.ts";

const currentYear = new Date().getUTCFullYear();

try {
  const api = await createPriceApiFromProviderMode({
    env: {
      ...process.env,
      PRICE_PROVIDER_MODE: "real",
    },
  });
  const response = api.getMonthlyPrices({
    start_month: `${currentYear}-01`,
    end_month: `${currentYear}-01`,
  });
  console.log(JSON.stringify(response, null, 2));
} catch (error) {
  if (error instanceof PriceApiError) {
    console.error(`${error.code}: ${error.message}`);
    process.exitCode = error.code === "configuration_error" ? 0 : 1;
  } else {
    console.error(error);
    process.exitCode = 1;
  }
}
