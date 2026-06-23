import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ClassicProjectionError,
  convertClassicHedgeToCanonical,
  deriveClassicFromCanonical,
  deriveClassicFromForecast,
} from "../../src/hedging/classicProjection.ts";

describe("Classic projection conversion", () => {
  it("converts the worked example to canonical MW values", () => {
    const result = convertClassicHedgeToCanonical({
      classic_offpeak_mwh: 50,
      classic_peak_mwh: 50,
      total_h: 744,
      peak_h: 320,
    });

    assert.equal(result.classic_offpeak_mw, 0.117925);
    assert.equal(result.classic_peak_mw, 0.15625);
    assert.equal(result.canonical_base_mw, 0.134409);
    assert.equal(result.allocation_peak_mw, 0.15625);
    assert.equal(result.canonical_peak_mw, 0.021841);
    assert.equal(result.total_mwh, 100);
    assert.equal(result.peak_pct, 0.5);
  });

  it("reads canonical worked example rows back to Classic Offpeak and Peak MWh", () => {
    const result = deriveClassicFromCanonical({
      canonical_base_mw: 100 / 744,
      allocation_peak_mw: 50 / 320,
      canonical_peak_mw: 50 / 320 - 100 / 744,
      total_h: 744,
      peak_h: 320,
    });

    assert.equal(result.classic_offpeak_mwh, 50);
    assert.equal(result.classic_peak_mwh, 50);
    assert.deepEqual(result.warnings, []);
  });

  it("allows negative canonical peak when Classic Peak MWh is below flat base", () => {
    const result = convertClassicHedgeToCanonical({
      classic_offpeak_mwh: 65,
      classic_peak_mwh: 35,
      total_h: 744,
      peak_h: 320,
    });

    assert.equal(result.canonical_base_mw, 0.134409);
    assert.equal(result.allocation_peak_mw, 0.109375);
    assert.equal(result.canonical_peak_mw, -0.025034);
  });

  it("derives Classic values from stored forecast shape", () => {
    const result = deriveClassicFromForecast({
      total_mwh: 100,
      peak_pct: 0.35,
      total_h: 744,
      peak_h: 320,
    });

    assert.equal(result.classic_offpeak_mwh, 65);
    assert.equal(result.classic_peak_mwh, 35);
  });

  it("rejects negative customer-facing Classic MWh values", () => {
    assert.throws(
      () =>
        convertClassicHedgeToCanonical({
          classic_offpeak_mwh: -1,
          classic_peak_mwh: 1,
          total_h: 744,
          peak_h: 320,
        }),
      (error) => error instanceof ClassicProjectionError && /Offpeak MWh/.test(error.message),
    );
    assert.throws(
      () =>
        convertClassicHedgeToCanonical({
          classic_offpeak_mwh: 1,
          classic_peak_mwh: -1,
          total_h: 744,
          peak_h: 320,
        }),
      (error) => error instanceof ClassicProjectionError && /Peak MWh/.test(error.message),
    );
  });

  it("rejects zero peak or offpeak hours", () => {
    assert.throws(
      () =>
        convertClassicHedgeToCanonical({
          classic_offpeak_mwh: 50,
          classic_peak_mwh: 50,
          total_h: 320,
          peak_h: 320,
        }),
      (error) => error instanceof ClassicProjectionError && /offpeak_h/.test(error.message),
    );
    assert.throws(
      () =>
        convertClassicHedgeToCanonical({
          classic_offpeak_mwh: 50,
          classic_peak_mwh: 50,
          total_h: 744,
          peak_h: 0,
        }),
      (error) => error instanceof ClassicProjectionError && /peak_h/.test(error.message),
    );
  });
});
