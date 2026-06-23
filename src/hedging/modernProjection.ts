export class ModernProjectionError extends Error {
  readonly code: "invalid_input";

  constructor(message: string) {
    super(message);
    this.code = "invalid_input";
    this.name = "ModernProjectionError";
  }
}

export type ModernForecastValues = {
  modern_base_mwh: number;
  modern_peak_mwh: number;
  modern_base_mw: number;
  modern_peak_mw: number;
  total_mwh: number;
  peak_level_mwh: number;
  peak_pct: number;
};

export type StoredForecastValues = {
  mwh: number;
  peak_pct: number;
  peak_level_mwh: number;
  modern_base_mw: number;
  modern_peak_mw: number;
};

export type CanonicalHedgeValues = {
  modern_base_mwh: number;
  modern_peak_mwh: number;
  modern_base_mw: number;
  modern_peak_mw: number;
  allocation_peak_mw: number;
  canonical_base_mw: number;
  canonical_peak_mw: number;
  total_mwh: number;
  peak_level_mwh: number;
};

export function deriveModernFromForecast(input: {
  total_mwh: number;
  peak_pct: number;
  total_h: number;
  peak_h: number;
}): ModernForecastValues {
  validateCalendar(input.total_h, input.peak_h);
  if (input.total_mwh < 0) {
    throw new ModernProjectionError("total MWh must be greater than or equal to 0");
  }
  if (input.peak_pct < 0) {
    throw new ModernProjectionError("peak_pct must be greater than or equal to 0");
  }

  const offpeakH = input.total_h - input.peak_h;
  const peakLevelMwh = input.total_mwh * input.peak_pct;
  const offpeakMwh = input.total_mwh - peakLevelMwh;
  const modernBaseMw = offpeakMwh / offpeakH;
  const allocationPeakMw = peakLevelMwh / input.peak_h;
  const modernPeakMw = allocationPeakMw - modernBaseMw;
  const modernBaseMwh = modernBaseMw * input.total_h;
  const modernPeakMwh = modernPeakMw * input.peak_h;

  return {
    modern_base_mwh: roundMwh(modernBaseMwh),
    modern_peak_mwh: roundMwh(modernPeakMwh),
    modern_base_mw: roundMw(modernBaseMw),
    modern_peak_mw: roundMw(modernPeakMw),
    total_mwh: roundMwh(input.total_mwh),
    peak_level_mwh: roundMwh(peakLevelMwh),
    peak_pct: roundDecimal(input.peak_pct),
  };
}

export function convertModernForecastToStored(input: {
  modern_base_mwh: number;
  modern_peak_mwh: number;
  total_h: number;
  peak_h: number;
}): StoredForecastValues {
  const canonical = convertModernHedgeToCanonical(input);
  const peakPct = canonical.total_mwh === 0 ? 0 : canonical.peak_level_mwh / canonical.total_mwh;

  return {
    mwh: roundMwh(canonical.total_mwh),
    peak_pct: roundDecimal(peakPct),
    peak_level_mwh: roundMwh(canonical.peak_level_mwh),
    modern_base_mw: canonical.modern_base_mw,
    modern_peak_mw: canonical.modern_peak_mw,
  };
}

export function convertModernHedgeToCanonical(input: {
  modern_base_mwh: number;
  modern_peak_mwh: number;
  total_h: number;
  peak_h: number;
}): CanonicalHedgeValues {
  validateCalendar(input.total_h, input.peak_h);
  if (input.modern_base_mwh < 0) {
    throw new ModernProjectionError("Modern Base MWh must be greater than or equal to 0");
  }

  const modernBaseMw = input.modern_base_mwh / input.total_h;
  const modernPeakMw = input.modern_peak_mwh / input.peak_h;
  const allocationPeakMw = modernBaseMw + modernPeakMw;
  const totalMwh = input.modern_base_mwh + input.modern_peak_mwh;
  const peakLevelMwh = allocationPeakMw * input.peak_h;
  const canonicalBaseMw = totalMwh / input.total_h;
  const canonicalPeakMw = allocationPeakMw - canonicalBaseMw;

  if (totalMwh < 0) {
    throw new ModernProjectionError("total MWh must be greater than or equal to 0");
  }
  if (peakLevelMwh < 0) {
    throw new ModernProjectionError("peak level MWh must be greater than or equal to 0");
  }

  return {
    modern_base_mwh: roundMwh(input.modern_base_mwh),
    modern_peak_mwh: roundMwh(input.modern_peak_mwh),
    modern_base_mw: roundMw(modernBaseMw),
    modern_peak_mw: roundMw(modernPeakMw),
    allocation_peak_mw: roundMw(allocationPeakMw),
    canonical_base_mw: roundMw(canonicalBaseMw),
    canonical_peak_mw: roundMw(canonicalPeakMw),
    total_mwh: roundMwh(totalMwh),
    peak_level_mwh: roundMwh(peakLevelMwh),
  };
}

function validateCalendar(totalH: number, peakH: number): void {
  if (totalH <= 0) {
    throw new ModernProjectionError("calendar total_h must be greater than zero");
  }
  if (peakH <= 0) {
    throw new ModernProjectionError("calendar peak_h must be greater than zero");
  }
  if (totalH - peakH <= 0) {
    throw new ModernProjectionError("calendar offpeak_h must be greater than zero");
  }
}

function roundMwh(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function roundMw(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function roundDecimal(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
