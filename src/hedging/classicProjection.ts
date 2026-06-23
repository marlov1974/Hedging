export class ClassicProjectionError extends Error {
  readonly code = "invalid_input";

  constructor(message: string) {
    super(message);
    this.name = "ClassicProjectionError";
  }
}

export type ClassicProjectionValues = {
  classic_offpeak_mwh: number;
  classic_peak_mwh: number;
  classic_offpeak_mw: number;
  classic_peak_mw: number;
  allocation_peak_mw: number;
  canonical_base_mw: number;
  canonical_peak_mw: number;
  total_mwh: number;
  peak_pct: number;
  warnings: string[];
};

export function deriveClassicFromForecast(input: {
  total_mwh: number;
  peak_pct: number;
  total_h: number;
  peak_h: number;
}): ClassicProjectionValues {
  validateCalendar(input.total_h, input.peak_h);
  if (input.total_mwh < 0) {
    throw new ClassicProjectionError("total MWh must be greater than or equal to 0");
  }
  if (input.peak_pct < 0) {
    throw new ClassicProjectionError("peak_pct must be greater than or equal to 0");
  }

  const classicPeakMwh = input.total_mwh * input.peak_pct;
  const classicOffpeakMwh = input.total_mwh - classicPeakMwh;
  return convertClassicHedgeToCanonical({
    classic_offpeak_mwh: classicOffpeakMwh,
    classic_peak_mwh: classicPeakMwh,
    total_h: input.total_h,
    peak_h: input.peak_h,
  });
}

export function convertClassicForecastToStored(input: {
  classic_offpeak_mwh: number;
  classic_peak_mwh: number;
  total_h: number;
  peak_h: number;
}): ClassicProjectionValues {
  return convertClassicHedgeToCanonical(input);
}

export function convertClassicHedgeToCanonical(input: {
  classic_offpeak_mwh: number;
  classic_peak_mwh: number;
  total_h: number;
  peak_h: number;
}): ClassicProjectionValues {
  validateCalendar(input.total_h, input.peak_h);
  if (input.classic_offpeak_mwh < 0) {
    throw new ClassicProjectionError("Offpeak MWh must be greater than or equal to 0");
  }
  if (input.classic_peak_mwh < 0) {
    throw new ClassicProjectionError("Peak MWh must be greater than or equal to 0");
  }

  const offpeakH = input.total_h - input.peak_h;
  const classicOffpeakMw = input.classic_offpeak_mwh / offpeakH;
  const classicPeakMw = input.classic_peak_mwh / input.peak_h;
  const totalMwh = input.classic_offpeak_mwh + input.classic_peak_mwh;
  const canonicalBaseMw = totalMwh / input.total_h;
  const allocationPeakMw = classicPeakMw;
  const canonicalPeakMw = allocationPeakMw - canonicalBaseMw;
  const peakPct = totalMwh === 0 ? 0 : input.classic_peak_mwh / totalMwh;

  return {
    classic_offpeak_mwh: roundMwh(input.classic_offpeak_mwh),
    classic_peak_mwh: roundMwh(input.classic_peak_mwh),
    classic_offpeak_mw: roundMw(classicOffpeakMw),
    classic_peak_mw: roundMw(classicPeakMw),
    allocation_peak_mw: roundMw(allocationPeakMw),
    canonical_base_mw: roundMw(canonicalBaseMw),
    canonical_peak_mw: roundMw(canonicalPeakMw),
    total_mwh: roundMwh(totalMwh),
    peak_pct: roundDecimal(peakPct),
    warnings: [],
  };
}

export function deriveClassicFromCanonical(input: {
  canonical_base_mw: number;
  allocation_peak_mw: number;
  canonical_peak_mw: number;
  total_h: number;
  peak_h: number;
  tolerance?: number;
}): ClassicProjectionValues {
  validateCalendar(input.total_h, input.peak_h);
  const offpeakH = input.total_h - input.peak_h;
  const totalMwh = input.canonical_base_mw * input.total_h;
  const classicPeakMwh = input.allocation_peak_mw * input.peak_h;
  const classicOffpeakMwh = totalMwh - classicPeakMwh;
  const peakPct = totalMwh === 0 ? 0 : classicPeakMwh / totalMwh;
  const warnings: string[] = [];
  const tolerance = input.tolerance ?? 0.000001;
  if (Math.abs(input.allocation_peak_mw - (input.canonical_base_mw + input.canonical_peak_mw)) > tolerance) {
    warnings.push("canonical relation A = B + P is outside tolerance");
  }

  return {
    classic_offpeak_mwh: roundMwh(classicOffpeakMwh),
    classic_peak_mwh: roundMwh(classicPeakMwh),
    classic_offpeak_mw: roundMw(classicOffpeakMwh / offpeakH),
    classic_peak_mw: roundMw(input.allocation_peak_mw),
    allocation_peak_mw: roundMw(input.allocation_peak_mw),
    canonical_base_mw: roundMw(input.canonical_base_mw),
    canonical_peak_mw: roundMw(input.canonical_peak_mw),
    total_mwh: roundMwh(totalMwh),
    peak_pct: roundDecimal(peakPct),
    warnings,
  };
}

function validateCalendar(totalH: number, peakH: number): void {
  if (totalH <= 0) {
    throw new ClassicProjectionError("calendar total_h must be greater than zero");
  }
  if (peakH <= 0) {
    throw new ClassicProjectionError("calendar peak_h must be greater than zero");
  }
  if (totalH - peakH <= 0) {
    throw new ClassicProjectionError("calendar offpeak_h must be greater than zero");
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
