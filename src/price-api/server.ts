import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createDefaultPriceApi } from "./priceApi.ts";
import { PriceApiError, type PriceApi } from "./types.ts";

export function createPriceApiServer(api: PriceApi = createDefaultPriceApi()) {
  return createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/price-api/monthly") {
      writeJson(response, 404, { error: "not_found" });
      return;
    }

    try {
      const body = await readJson(request);
      writeJson(response, 200, api.getMonthlyPrices(body));
    } catch (error) {
      if (error instanceof PriceApiError) {
        writeJson(response, error.code === "invalid_request" ? 400 : 422, {
          error: error.code,
          message: error.message,
        });
        return;
      }

      writeJson(response, 500, { error: "internal_error" });
    }
  });
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let rawBody = "";
  for await (const chunk of request) {
    rawBody += chunk;
  }
  return JSON.parse(rawBody || "{}");
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
