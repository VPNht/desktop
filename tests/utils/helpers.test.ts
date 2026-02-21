import { describe, it, expect, vi } from "vitest";
import {
  formatBytes,
  formatDuration,
  validateEmail,
  validatePassword,
  groupByRegion,
  getCountryFlag,
  getCountryCodeFromName,
  formatLatency,
  formatSpeed,
  debounce,
  cn,
} from "../../src/utils/helpers";

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
  it("formats KB", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });
  it("formats MB", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });
  it("formats GB", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });
  it("respects decimal places", () => {
    expect(formatBytes(1536, 1)).toBe("1.5 KB");
  });
});

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(30000)).toBe("30s");
  });
  it("formats minutes and seconds", () => {
    expect(formatDuration(300000)).toBe("5m 0s");
  });
  it("formats hours", () => {
    expect(formatDuration(7200000)).toBe("2h 0m 0s");
  });
  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co.uk")).toBe(true);
  });
  it("rejects invalid emails", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    const result = validatePassword("short");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  it("accepts strong passwords", () => {
    const result = validatePassword("Test123!");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  it("rejects passwords missing special char", () => {
    const result = validatePassword("Test1234");
    expect(result.valid).toBe(false);
  });
  it("rejects passwords missing uppercase", () => {
    const result = validatePassword("test123!");
    expect(result.valid).toBe(false);
  });
  it("rejects passwords missing number", () => {
    const result = validatePassword("Testtest!");
    expect(result.valid).toBe(false);
  });
});

describe("groupByRegion", () => {
  it("groups servers by country", () => {
    const servers = [
      { country: "United States", countryCode: "US" },
      { country: "United States", countryCode: "US" },
      { country: "Germany", countryCode: "DE" },
    ];
    const regions = groupByRegion(servers);
    expect(regions).toHaveLength(2);
    const us = regions.find((r) => r.name === "United States");
    expect(us?.count).toBe(2);
  });
  it("returns empty for empty input", () => {
    expect(groupByRegion([])).toHaveLength(0);
  });
  it("sorts alphabetically", () => {
    const servers = [
      { country: "Zambia", countryCode: "ZM" },
      { country: "Argentina", countryCode: "AR" },
    ];
    const regions = groupByRegion(servers);
    expect(regions[0].name).toBe("Argentina");
    expect(regions[1].name).toBe("Zambia");
  });
});

describe("getCountryFlag", () => {
  it("returns flag emoji for country code", () => {
    const flag = getCountryFlag("US");
    expect(flag).toBe("🇺🇸");
  });
  it("returns flag for GB", () => {
    const flag = getCountryFlag("GB");
    expect(flag).toBe("🇬🇧");
  });
});

describe("getCountryCodeFromName", () => {
  it("maps known countries", () => {
    expect(getCountryCodeFromName("United States")).toBe("US");
    expect(getCountryCodeFromName("Germany")).toBe("DE");
  });
  it("returns UNKNOWN for unmapped countries", () => {
    expect(getCountryCodeFromName("Narnia")).toBe("UNKNOWN");
  });
});

describe("formatLatency", () => {
  it("formats valid latency", () => {
    expect(formatLatency(42)).toBe("42 ms");
  });
  it("handles undefined", () => {
    expect(formatLatency(undefined)).toBe("--");
  });
  it("handles negative (timeout)", () => {
    expect(formatLatency(-1)).toBe("Timeout");
  });
});

describe("formatSpeed", () => {
  it("formats bytes per second", () => {
    expect(formatSpeed(1024)).toBe("1 KB/s");
  });
});

describe("debounce", () => {
  it("debounces function calls", async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 100));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });
});
