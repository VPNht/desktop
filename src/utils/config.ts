/*!
 * VPNht Desktop - Secure Configuration
 * This file contains encrypted/obfuscated configuration values
 */

/**
 * API Endpoint configuration
 * These values are built-time obfuscated
 */
export const CONFIG = {
  API: {
    // Base GraphQL endpoint - obfuscated
    GRAPHQL_ENDPOINT: atob('aHR0cHM6Ly9hcGkudnBuaHQuY29tL2dyYXBocWw='),
    // WebSocket endpoint - obfuscated  
    WS_ENDPOINT: atob('d3NzOi8vd3MudnBuaHQuY29t'),
    // Update endpoint
    UPDATE_ENDPOINT: atob('aHR0cHM6Ly91cGRhdGVzLnZwbmh0LmNvbQ=='),
  },
  
  // Security headers for HTTP requests
  SECURITY: {
    HEADERS: {
      'X-Client-Version': APP_VERSION,
      'X-Client-Platform': PLATFORM,
    },
  },
  
  // WireGuard configuration defaults
  WIREGUARD: {
    DEFAULT_PORT: 51820,
    DEFAULT_MTU: 1420,
    PERSISTENT_KEEPALIVE: 25,
  },
  
  // Timeout values
  TIMEOUTS: {
    CONNECTION: 30000,
    REQUEST: 10000,
    LATENCY_TEST: 5000,
  },
};

// App version (replaced at build time)
declare const APP_VERSION: string;
declare const PLATFORM: string;

/**
 * Decrypt API endpoint for runtime use
 * @param encrypted - Base64 encoded endpoint
 * @returns Decoded endpoint URL
 */
export function getEndpoint(encrypted: string): string {
  try {
    return atob(encrypted);
  } catch {
    console.error('Failed to decode endpoint');
    return '';
  }
}

/**
 * Validate configuration at runtime
 * Ensures all required configs are present
 */
export function validateConfig(): boolean {
  const required = [
    CONFIG.API.GRAPHQL_ENDPOINT,
    CONFIG.API.WS_ENDPOINT,
  ];
  
  return required.every((endpoint) => endpoint.length > 0);
}