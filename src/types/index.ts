// Re-export all types
export interface Server {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  hostname: string;
  ip: string;
  port: number;
  publicKey: string;
  supportedProtocols: Protocol[];
  features: ServerFeature[];
  latency?: number;
  load?: number;
  isPremium?: boolean;
  isVirtual?: boolean;
}

export type Protocol = "wireguard" | "openvpn_udp" | "openvpn_tcp";

export type ServerFeature = "p2p" | "streaming" | "double_vpn" | "tor_over_vpn" | "dedicated_ip";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "disconnecting" | "error";

export interface ConnectionState {
  status: ConnectionStatus;
  server?: Server;
  connectedAt?: Date;
  bytesReceived: number;
  bytesSent: number;
  error?: string;
  ipInfo?: IPInfo;
}

export interface IPInfo {
  ip: string;
  country: string;
  city: string;
  isp: string;
  isVpn: boolean;
}

export interface User {
  id: string;
  email: string;
  subscription: {
    plan: "free" | "basic" | "premium" | "ultimate";
    expiresAt: Date;
    isActive: boolean;
  };
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  theme: "light" | "dark" | "system";
  startup: {
    launchOnStartup: boolean;
    autoConnect: boolean;
    minimizeToTray: boolean;
  };
  connection: {
    preferredProtocol: Protocol;
    killSwitch: boolean;
    dnsLeakProtection: boolean;
    disableIpv6: boolean;
    obfuscation: boolean;
    customDns?: string[];
    mtu?: number;
  };
  favorites: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LatencyResult {
  serverId: string;
  latency: number | null;
  timestamp: Date;
}
