import { DatabaseError } from "./types.ts";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const KNOWN_COMPONENT_CODES = new Set([
  "base",
  "sys",
  "epad",
  "base.sys",
  "base.epad",
  "peak",
  "offpeak",
  "profile.peak",
  "profile.15m",
  "volume",
  "volume.flex",
  "fixed",
  "calendar",
  "currency.sek",
]);

export function assertRequiredString(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DatabaseError("invalid_input", `${fieldName} is required`);
  }
}

export function assertMonth(value: string, fieldName: string): void {
  if (!MONTH_PATTERN.test(value)) {
    throw new DatabaseError("invalid_input", `${fieldName} must use YYYY-MM format`);
  }
}

export function assertDate(value: string, fieldName: string): void {
  if (!DATE_PATTERN.test(value)) {
    throw new DatabaseError("invalid_input", `${fieldName} must use YYYY-MM-DD format`);
  }
}

export function assertFiniteNumber(value: number, fieldName: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DatabaseError("invalid_input", `${fieldName} must be numeric`);
  }
}

export function assertKnownComponentCode(component: string): void {
  if (!KNOWN_COMPONENT_CODES.has(component)) {
    throw new DatabaseError("invalid_input", `unknown component code ${component}`);
  }
}
