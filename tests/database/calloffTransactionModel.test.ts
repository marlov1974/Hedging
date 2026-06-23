import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSyntheticCustomerProductFixture } from "../../src/database/fixtures.ts";
import {
  getCalloffWithTransactions,
  getTransactionsByPortfolio,
  getTransactionsByProduct,
  insertCalloff,
  insertProductConfiguration,
  insertProductConfigurationComponent,
  insertTransaction,
} from "../../src/database/repository.ts";
import { DatabaseError } from "../../src/database/types.ts";

describe("calloff and transaction database model", () => {
  it("inserts calloff with valid product and portfolio", () => {
    const database = createSyntheticCustomerProductFixture();

    const calloff = insertCalloff(database, validCalloff());

    assert.equal(calloff.calloff_id, "calloff-1");
    assert.equal(database.calloffs.size, 1);
  });

  it("rejects calloff with unknown product", () => {
    const database = createSyntheticCustomerProductFixture();

    assert.throws(
      () => insertCalloff(database, { ...validCalloff(), product_id: "missing-product" }),
      (error) => error instanceof DatabaseError && error.code === "not_found",
    );
  });

  it("rejects calloff with unknown portfolio", () => {
    const database = createSyntheticCustomerProductFixture();

    assert.throws(
      () => insertCalloff(database, { ...validCalloff(), portfolio_id: "missing-portfolio" }),
      (error) => error instanceof DatabaseError && error.code === "not_found",
    );
  });

  it("rejects calloff with invalid date", () => {
    const database = createSyntheticCustomerProductFixture();

    assert.throws(
      () => insertCalloff(database, { ...validCalloff(), date: "2027-01" }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });

  it("rejects calloff with invalid delivery month range", () => {
    const database = createSyntheticCustomerProductFixture();

    assert.throws(
      () => insertCalloff(database, { ...validCalloff(), delivery_start_month: "2027-03", delivery_end_month: "2027-01" }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });

  it("inserts transaction with valid calloff and product component", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);

    const transaction = insertTransaction(database, validTransaction());

    assert.equal(transaction.transaction_id, "transaction-1");
    assert.equal(database.transactions.size, 1);
  });

  it("rejects transaction with unknown calloff", () => {
    const database = createSyntheticCustomerProductFixture();

    assert.throws(
      () => insertTransaction(database, validTransaction()),
      (error) => error instanceof DatabaseError && error.code === "not_found",
    );
  });

  it("rejects transaction with unknown product component", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);

    assert.throws(
      () => insertTransaction(database, { ...validTransaction(), productcomponent_id: "missing-component" }),
      (error) => error instanceof DatabaseError && error.code === "not_found",
    );
  });

  it("rejects invalid transaction month format", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);

    assert.throws(
      () => insertTransaction(database, { ...validTransaction(), month: "2027-13" }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });

  it("rejects missing or non-numeric mw", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);

    assert.throws(
      () => insertTransaction(database, { ...validTransaction(), mw: undefined as unknown as number }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
    assert.throws(
      () => insertTransaction(database, { ...validTransaction(), transaction_id: "transaction-2", mw: "10" as unknown as number }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });

  it("rejects missing or non-numeric q_factor", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);

    assert.throws(
      () => insertTransaction(database, { ...validTransaction(), q_factor: undefined as unknown as number }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
    assert.throws(
      () =>
        insertTransaction(database, {
          ...validTransaction(),
          transaction_id: "transaction-2",
          q_factor: "0.95" as unknown as number,
        }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });

  it("gets calloff with transaction rows", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);
    insertTransaction(database, validTransaction());

    const result = getCalloffWithTransactions(database, "calloff-1");

    assert.equal(result?.calloff.product_id, "product-1");
    assert.equal(result?.transactions.length, 1);
    assert.equal(result?.transactions[0].mw, 10);
  });

  it("gets transactions by portfolio and product", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);
    insertTransaction(database, validTransaction());

    assert.equal(getTransactionsByPortfolio(database, "portfolio-1").length, 1);
    assert.equal(getTransactionsByProduct(database, "product-1").length, 1);
    assert.equal(getTransactionsByPortfolio(database, "missing-portfolio").length, 0);
  });

  it("rejects transaction product component outside the calloff product", () => {
    const database = createSyntheticCustomerProductFixture();
    seedCalloff(database);
    insertProductConfiguration(database, { product_id: "product-2", name: "Fixed" });
    insertProductConfigurationComponent(database, {
      productcomponent_id: "product-component-2",
      product_id: "product-2",
      name: "Other component",
      component: "fixed",
      productitem: "fixed",
    });

    assert.throws(
      () => insertTransaction(database, { ...validTransaction(), productcomponent_id: "product-component-2" }),
      (error) => error instanceof DatabaseError && error.code === "invalid_input",
    );
  });
});

function seedCalloff(database: ReturnType<typeof createSyntheticCustomerProductFixture>): void {
  insertCalloff(database, validCalloff());
}

function validCalloff() {
  return {
    calloff_id: "calloff-1",
    product_id: "product-1",
    portfolio_id: "portfolio-1",
    date: "2027-01-15",
    delivery_start_month: "2027-01",
    delivery_end_month: "2027-01",
  };
}

function validTransaction() {
  return {
    transaction_id: "transaction-1",
    calloff_id: "calloff-1",
    month: "2027-01",
    productcomponent_id: "product-component-1",
    mw: 10,
    q_factor: 0.95,
  };
}
