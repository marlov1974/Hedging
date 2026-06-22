import { assertMonthString, compareMonths, expandMonthRange } from "./monthRange.ts";
import { PriceApiError, type NormalizedProfilePriceApiRequest, type ProfilePoint, type ProfilePriceApiRequest } from "./types.ts";

export function validateProfilePriceRequest(request: ProfilePriceApiRequest): NormalizedProfilePriceApiRequest {
  if (!request || typeof request !== "object") {
    throw new PriceApiError("invalid_request", "request body is required");
  }

  if (!request.price_area) {
    throw new PriceApiError("invalid_request", "price_area is required");
  }

  if (request.price_area !== "STO") {
    throw new PriceApiError("invalid_request", "unsupported price_area");
  }

  if (!Array.isArray(request.profile) || request.profile.length === 0) {
    throw new PriceApiError("invalid_request", "profile must contain at least one month");
  }

  const seenMonths = new Set<string>();
  const profile = request.profile.map((row, index) => normalizeProfilePoint(row, index));

  for (const row of profile) {
    if (seenMonths.has(row.month)) {
      throw new PriceApiError("invalid_request", `duplicate profile month ${row.month}`);
    }
    seenMonths.add(row.month);
  }

  profile.sort((left, right) => compareMonths(left.month, right.month));
  const expectedMonths = expandMonthRange(profile[0].month, profile[profile.length - 1].month);
  if (expectedMonths.length !== profile.length) {
    throw new PriceApiError("invalid_request", "profile months must be contiguous");
  }

  return {
    price_area: "STO",
    profile,
  };
}

function normalizeProfilePoint(row: ProfilePoint, index: number): ProfilePoint {
  if (!row || typeof row !== "object") {
    throw new PriceApiError("invalid_request", `profile row ${index} must be an object`);
  }

  const month = assertMonthString(row.month, `profile[${index}].month`);
  if (typeof row.mw !== "number" || !Number.isFinite(row.mw)) {
    throw new PriceApiError("invalid_request", `profile[${index}].mw must be a number`);
  }

  if (row.mw < 0) {
    throw new PriceApiError("invalid_request", "negative MW is not supported");
  }

  return { month, mw: row.mw };
}
