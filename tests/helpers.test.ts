import { expect, describe, it, beforeEach } from "vitest";
import { formatBytes, formatDuration, validateEmail, validatePassword, groupByRegion } from "../src/utils/helpers";

describe("formatBytes", () => {
  it("should format bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });
});

describe("formatDuration", () => {
  it("should format duration correctly", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(1000 * 30)).toBe("30s");
    expect(formatDuration(1000 * 60 * 5)).toBe("5m 0s");
    expect(formatDuration(1000 * 60 * 60 * 2)).toBe("2h 0m 0s");
  });
});

describe("validateEmail", () => {
  it("should validate email format", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co.uk")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("should validate password strength", () => {
    // Too short
    const short = validatePassword("short");
    expect(short.valid).toBe(false);
    expect(short.errors.length).toBeGreaterThan(0);

    // Valid password
    const valid = validatePassword("Test123!");
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    // Missing special char
    const noSpecial = validatePassword("Test1234");
    expect(noSpecial.valid).toBe(false);
  });
});

describe("groupByRegion", () => {
  it("should group servers by region", () => {
    const servers = [
      { country: "United States", countryCode: "US" },
      { country: "United States", countryCode: "US" },
      { country: "United Kingdom", countryCode: "GB" },
      { country: "Germany", countryCode: "DE" },
    ];

    const regions = groupByRegion(servers);
    expect(regions).toHaveLength(3);
    
    const usRegion = regions.find((r) => r.name === "United States");
    expect(usRegion?.count).toBe(2);
  });
});
