import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createPocSeedData } from "../database/pocSeedData.ts";
import type { PrototypeDatabase } from "../database/schema.ts";
import { PurchaseError, purchaseBaseloads } from "./baseloadsPurchase.ts";
import { renderBaseloadsPurchaseForm } from "./BaseloadsPurchaseView.ts";

export function createBaseloadsPurchaseServer(database: PrototypeDatabase = createPocSeedData()) {
  return createServer(async (request, response) => {
    if (request.method === "GET" && (request.url === "/" || request.url === "/purchase/baseloads")) {
      writeHtml(response, 200, renderBaseloadsPurchaseForm(database));
      return;
    }

    if (request.method === "POST" && request.url === "/purchase/baseloads") {
      const body = await readForm(request);
      const mw = Number(body.get("mw"));
      const period_id = String(body.get("period_id") ?? "");
      const portfolio_id = String(body.get("portfolio_id") ?? "");

      try {
        const result = purchaseBaseloads(database, {
          portfolio_id,
          mw,
          period_id,
          date: "2027-01-15",
        });
        writeHtml(response, 200, renderBaseloadsPurchaseForm(database, { result, selected_period_id: period_id, mw: String(mw) }));
      } catch (error) {
        const message = error instanceof PurchaseError ? error.message : "Purchase failed";
        writeHtml(response, 400, renderBaseloadsPurchaseForm(database, { error: message, selected_period_id: period_id, mw: String(body.get("mw") ?? "") }));
      }
      return;
    }

    writeHtml(response, 404, "Not found");
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(readArg("--port") ?? "5174");
  const server = createBaseloadsPurchaseServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Baseloads purchase flow listening on http://127.0.0.1:${port}/purchase/baseloads`);
  });
}

async function readForm(request: IncomingMessage): Promise<URLSearchParams> {
  let rawBody = "";
  for await (const chunk of request) {
    rawBody += chunk;
  }
  return new URLSearchParams(rawBody);
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
