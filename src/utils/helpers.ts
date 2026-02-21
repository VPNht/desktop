import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatLatency(latency: number | undefined): string {
  if (latency === undefined || latency === null) return "--";
  if (latency < 0) return "Timeout";
  return `${latency} ms`;
}

export function getLatencyClass(latency: number | undefined): string {
  if (latency === undefined || latency === null) return "lat";
  if (latency >= 150) return "lat";
  if (latency >= 100) return "lat";
  return "lat";
}

export function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getCountryCodeFromName(countryName: string): string {
  const countryMap: Record<string, string> = {
    "United States": "US",
    "United Kingdom": "GB",
    Canada: "CA",
    Germany: "DE",
    Netherlands: "NL",
    France: "FR",
    Spain: "ES",
    Italy: "IT",
    Switzerland: "CH",
    Sweden: "SE",
    Norway: "NO",
    Japan: "JP",
    Singapore: "SG",
    Australia: "AU",
    "Hong Kong": "HK",
    "South Korea": "KR",
    India: "IN",
    Thailand: "TH",
    UAE: "AE",
    Israel: "IL",
    "South Africa": "ZA",
    Turkey: "TR",
    Brazil: "BR",
    Argentina: "AR",
    Chile: "CL",
    Colombia: "CO",
    Mexico: "MX",
    Poland: "PL",
    "Czech Republic": "CZ",
    Hungary: "HU",
    Romania: "RO",
    Bulgaria: "BG",
    Ukraine: "UA",
    Finland: "FI",
    Denmark: "DK",
    Taiwan: "TW",
    Indonesia: "ID",
    Malaysia: "MY",
    Philippines: "PH",
    Vietnam: "VN",
    Ireland: "IE",
    Portugal: "PT",
    Greece: "GR",
    Latvia: "LV",
    Estonia: "EE",
    Lithuania: "LT",
    Austria: "AT",
    Belgium: "BE",
  };
  return countryMap[countryName] || "UNKNOWN";
}

export function groupByRegion(servers: { country: string; countryCode: string }[]) {
  const regions: Record<
    string,
    { name: string; countryCode: string; count: number }
  > = {};

  for (const server of servers) {
    if (!regions[server.country]) {
      regions[server.country] = {
        name: server.country,
        countryCode: server.countryCode,
        count: 0,
      };
    }
    regions[server.country].count++;
  }

  return Object.values(regions).sort((a, b) => a.name.localeCompare(b.name));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

export function generateWireGuardKeypair(): {
  privateKey: string;
  publicKey: string;
} {
  // In real implementation, this uses Tauri's crypto commands
  // This is a placeholder for UI development
  return {
    privateKey: "PLACEHOLDER_PRIVATE_KEY",
    publicKey: "PLACEHOLDER_PUBLIC_KEY",
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
