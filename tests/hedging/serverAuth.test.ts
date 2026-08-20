import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { Server } from "node:http";
import { createHedgingToolServer } from "../../src/hedging/server.ts";

const ORIGINAL_PASSWORD = process.env.HEDGING_PASSWORD;

afterEach(() => {
  if (ORIGINAL_PASSWORD === undefined) {
    delete process.env.HEDGING_PASSWORD;
  } else {
    process.env.HEDGING_PASSWORD = ORIGINAL_PASSWORD;
  }
});

describe("Hedging server Basic Auth", () => {
  it("rejects missing auth when HEDGING_PASSWORD is set", async () => {
    process.env.HEDGING_PASSWORD = "test-password";
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/hedging`);

      assert.equal(response.status, 401);
      assert.equal(response.headers.get("www-authenticate"), 'Basic realm="Hedging"');
    });
  });

  it("rejects wrong password", async () => {
    process.env.HEDGING_PASSWORD = "test-password";
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/hedging`, {
        headers: { authorization: basicAuth("any-user", "wrong-password") },
      });

      assert.equal(response.status, 401);
      assert.equal(response.headers.get("www-authenticate"), 'Basic realm="Hedging"');
    });
  });

  it("accepts correct password with any username", async () => {
    process.env.HEDGING_PASSWORD = "test-password";
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/hedging`, {
        headers: { authorization: basicAuth("synthetic-user", "test-password") },
      });
      const body = await response.text();

      assert.equal(response.status, 200);
      assert.match(body, /Baseloads Portfolio/);
    });
  });

  it("keeps local development behavior when HEDGING_PASSWORD is unset", async () => {
    delete process.env.HEDGING_PASSWORD;
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/hedging`);
      const body = await response.text();

      assert.equal(response.status, 200);
      assert.match(body, /Baseloads Portfolio/);
    });
  });

  it("accepts Baseloads to Modern conversion posts", async () => {
    delete process.env.HEDGING_PASSWORD;
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/hedging/upgrade-baseloads-to-modern`, {
        method: "POST",
        body: new URLSearchParams({
          portfolio_id: "CUS00-0",
          period_id: "month-2027-01",
          price_area: "STO",
          target_percentage_of_forecast: "50",
        }),
      });
      const body = await response.text();

      assert.equal(response.status, 200);
      assert.match(body, /Conversion created/);
      assert.match(body, /MARKET_REBALANCE/);
      assert.match(body, /CUSTOMER_CONVERSION/);
    });
  });
});

async function withServer(test: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = createHedgingToolServer();
  await listen(server);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    await test(`http://127.0.0.1:${address.port}`);
  } finally {
    await close(server);
  }
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function basicAuth(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}
