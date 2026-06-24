import { DatabaseError } from "./types.ts";
import { isPersistableComponentCode, isProjectedOnlyComponentCode } from "./canonicalComponents.ts";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

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
  if (isProjectedOnlyComponentCode(component)) {
    throw new DatabaseError("invalid_input", `projected-only component code ${component} cannot be persisted`);
  }
  if (!isPersistableComponentCode(component)) {
    throw new DatabaseError("invalid_input", `unknown component code ${component}`);
  }
}
