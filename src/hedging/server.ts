import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createPocSeedData } from "../database/pocSeedData.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import { PurchaseError, purchaseBaseloads } from "../purchase/baseloadsPurchase.ts";
import { renderHedgingTool } from "./HedgingToolView.ts";
import type { HedgingFeatureId } from "./features.ts";

export function createHedgingToolServer(database: PrototypeDatabase = createPocSeedData()) {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/hedging")) {
      writeHtml(response, 200, renderHedgingTool(database, readStateFromUrl(url)));
      return;
    }

    if (request.method === "POST" && url.pathname === "/hedging/buy-baseloads") {
      const body = await readForm(request);
      const portfolio_id = String(body.get("portfolio_id") ?? "");
      const period_id = String(body.get("period_id") ?? "");
      const mwText = String(body.get("mw") ?? "");
      const mw = Number(mwText);

      try {
        const purchase_result = purchaseBaseloads(database, {
          portfolio_id,
          period_id,
          mw,
          date: "2027-01-15",
        });
        writeHtml(
          response,
          200,
          renderHedgingTool(database, {
            portfolio_id,
            feature_id: "buy-baseloads",
            selected_period_id: period_id,
            mw: mwText,
            purchase_result,
          }),
        );
      } catch (error) {
        const message = error instanceof PurchaseError ? error.message : "Purchase failed";
        writeHtml(
          response,
          400,
          renderHedgingTool(database, {
            portfolio_id,
            feature_id: "buy-baseloads",
            selected_period_id: period_id,
            mw: mwText,
            error: message,
          }),
        );
      }
      return;
    }

    writeHtml(response, 404, "Not found");
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(readArg("--port") ?? "5175");
  const host = readArg("--host") ?? "127.0.0.1";
  const server = createHedgingToolServer();
  server.listen(port, host, () => {
    console.log(`Hedging tool listening on http://${host}:${port}/hedging`);
  });
}

async function readForm(request: IncomingMessage): Promise<URLSearchParams> {
  let rawBody = "";
  for await (const chunk of request) {
    rawBody += chunk;
  }
  return new URLSearchParams(rawBody);
}

function readStateFromUrl(url: URL) {
  return {
    portfolio_id: url.searchParams.get("portfolio_id") ?? undefined,
    feature_id: (url.searchParams.get("feature_id") as HedgingFeatureId | null) ?? undefined,
    selected_year: url.searchParams.get("selected_year") ?? undefined,
    selected_month: url.searchParams.get("selected_month") ?? undefined,
  };
}

function writeHtml(response: ServerResponse, statusCode: number, body: string): void {
  response.writeHead(statusCode, { "content-type": "text/html; charset=utf-8" });
  response.end(body);
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}
