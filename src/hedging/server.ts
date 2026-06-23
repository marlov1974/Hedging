import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createPocSeedData } from "../database/pocSeedData.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import { acceptForecastHedgeProfile, buildForecastHedgeProfile, ForecastHedgeError } from "./forecastHedge.ts";
import { ForecastFeatureError, updateForecastRows } from "./forecastFeature.ts";
import { PurchaseError, purchaseBaseloads } from "../purchase/baseloadsPurchase.ts";
import { renderHedgingTool } from "./HedgingToolView.ts";
import type { HedgingFeatureId } from "./features.ts";
import type { PerspectiveId } from "./applicationConfig.ts";

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
      const perspective_id = readPerspectiveFromForm(body);
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
            perspective_id,
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
            perspective_id,
            feature_id: "buy-baseloads",
            selected_period_id: period_id,
            mw: mwText,
            error: message,
          }),
        );
      }
      return;
    }

    if (request.method === "POST" && url.pathname === "/hedging/forecast") {
      const body = await readForm(request);
      const portfolio_id = String(body.get("portfolio_id") ?? "");
      const perspective_id = readPerspectiveFromForm(body);
      const selected_year = String(body.get("selected_year") ?? "");
      const months = body.getAll("month").map((month) => String(month));

      try {
        updateForecastRows(database, {
          portfolio_id,
          perspective_id,
          rows: months.map((month) => ({
            portfolio_id,
            month,
            perspective_id,
            modern_base_mwh: perspective_id === "classic" ? undefined : String(body.get(`modern_base_mwh_${month}`) ?? ""),
            modern_peak_mwh: perspective_id === "classic" ? undefined : String(body.get(`modern_peak_mwh_${month}`) ?? ""),
            classic_offpeak_mwh:
              perspective_id === "classic" ? String(body.get(`classic_offpeak_mwh_${month}`) ?? "") : undefined,
            classic_peak_mwh: perspective_id === "classic" ? String(body.get(`classic_peak_mwh_${month}`) ?? "") : undefined,
          })),
        });

        writeHtml(
          response,
          200,
          renderHedgingTool(database, {
            portfolio_id,
            perspective_id,
            feature_id: "forecast",
            selected_year,
            forecast_message: "Forecast saved.",
          }),
        );
      } catch (error) {
        const message = error instanceof ForecastFeatureError ? error.message : "Forecast save failed";
        writeHtml(
          response,
          400,
          renderHedgingTool(database, {
            portfolio_id,
            perspective_id,
            feature_id: "forecast",
            selected_year,
            error: message,
          }),
        );
      }
      return;
    }

    if (request.method === "POST" && url.pathname === "/hedging/forecast-hedge/generate") {
      const body = await readForm(request);
      const portfolio_id = String(body.get("portfolio_id") ?? "");
      const perspective_id = readPerspectiveFromForm(body);
      const start_month = String(body.get("start_month") ?? "");
      const end_month = String(body.get("end_month") ?? "");
      const percentage = String(body.get("percentage") ?? "");

      try {
        const profile = buildForecastHedgeProfile(database, {
          portfolio_id,
          start_month,
          end_month,
          percentage,
          perspective_id,
        });
        writeHtml(
          response,
          200,
          renderHedgingTool(database, {
            portfolio_id,
            perspective_id,
            feature_id: "forecast-hedge",
            forecast_hedge_profile: profile,
          }),
        );
      } catch (error) {
        const message = error instanceof ForecastHedgeError ? error.message : "Forecast hedge profile generation failed";
        writeHtml(
          response,
          400,
          renderHedgingTool(database, {
            portfolio_id,
            perspective_id,
            feature_id: "forecast-hedge",
            forecast_hedge_input: { start_month, end_month, percentage },
            error: message,
          }),
        );
      }
      return;
    }

    if (request.method === "POST" && url.pathname === "/hedging/forecast-hedge/accept") {
      const body = await readForm(request);
      const portfolio_id = String(body.get("portfolio_id") ?? "");
      const perspective_id = readPerspectiveFromForm(body);
      const start_month = String(body.get("start_month") ?? "");
      const end_month = String(body.get("end_month") ?? "");
      const percentage = String(body.get("percentage") ?? "");
      const months = body.getAll("month").map((month) => String(month));

      try {
        const result = acceptForecastHedgeProfile(database, {
          portfolio_id,
          start_month,
          end_month,
          percentage,
          perspective_id,
          rows: months.map((month) => ({
            month,
            modern_base_mwh: perspective_id === "classic" ? undefined : String(body.get(`modern_base_mwh_${month}`) ?? ""),
            modern_peak_mwh: perspective_id === "classic" ? undefined : String(body.get(`modern_peak_mwh_${month}`) ?? ""),
            classic_offpeak_mwh:
              perspective_id === "classic" ? String(body.get(`classic_offpeak_mwh_${month}`) ?? "") : undefined,
            classic_peak_mwh: perspective_id === "classic" ? String(body.get(`classic_peak_mwh_${month}`) ?? "") : undefined,
          })),
        });
        writeHtml(
          response,
          200,
          renderHedgingTool(database, {
            portfolio_id,
            perspective_id,
            feature_id: "forecast-hedge",
            forecast_hedge_profile: result.profile,
            forecast_hedge_result: result,
          }),
        );
      } catch (error) {
        const message = error instanceof ForecastHedgeError ? error.message : "Forecast hedge accept failed";
        let profile;
        try {
          profile = buildForecastHedgeProfile(database, { portfolio_id, start_month, end_month, percentage, perspective_id });
        } catch {
          profile = undefined;
        }
        writeHtml(
          response,
          400,
          renderHedgingTool(database, {
            portfolio_id,
            perspective_id,
            feature_id: "forecast-hedge",
            forecast_hedge_profile: profile,
            forecast_hedge_input: { start_month, end_month, percentage },
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
    perspective_id: (url.searchParams.get("perspective_id") as PerspectiveId | null) ?? undefined,
    feature_id: (url.searchParams.get("feature_id") as HedgingFeatureId | null) ?? undefined,
    selected_year: url.searchParams.get("selected_year") ?? undefined,
    selected_month: url.searchParams.get("selected_month") ?? undefined,
    selected_table: url.searchParams.get("selected_table") ?? undefined,
    selected_view: url.searchParams.get("selected_view") ?? undefined,
  };
}

function readPerspectiveFromForm(body: URLSearchParams): PerspectiveId | undefined {
  return (body.get("perspective_id") as PerspectiveId | null) ?? undefined;
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
