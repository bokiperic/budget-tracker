import { describe, it, expect } from "vitest";
import { formatCurrency, currentYearMonth, monthRange } from "./format.js";

describe("formatCurrency", () => {
  // Output is locale-dependent, so assert behavior relative to known-good
  // inputs rather than hardcoding a specific locale's string.
  const usd = (n) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD" });

  it("formats numbers as USD currency", () => {
    expect(formatCurrency(1234.5)).toBe(usd(1234.5));
  });

  it("coerces numeric strings", () => {
    expect(formatCurrency("12")).toBe(usd(12));
  });

  it("falls back to 0 for null, undefined, and non-numeric input", () => {
    expect(formatCurrency(null)).toBe(usd(0));
    expect(formatCurrency(undefined)).toBe(usd(0));
    expect(formatCurrency("not a number")).toBe(usd(0));
  });
});

describe("currentYearMonth", () => {
  it("returns a YYYY-MM string", () => {
    expect(currentYearMonth()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});

describe("monthRange", () => {
  it("returns a half-open range covering the month", () => {
    expect(monthRange("2026-07")).toEqual({
      start: "2026-07-01",
      end: "2026-08-01",
    });
  });

  it("zero-pads the next month", () => {
    expect(monthRange("2026-09")).toEqual({
      start: "2026-09-01",
      end: "2026-10-01",
    });
  });

  it("rolls December over to January of the next year", () => {
    expect(monthRange("2026-12")).toEqual({
      start: "2026-12-01",
      end: "2027-01-01",
    });
  });
});
