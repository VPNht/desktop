import { GraphQLClient } from "graphql-request";
import type {
  Server,
  Protocol,
  ServerFeature,
  LatencyResult,
  IPInfo,
} from "@types";

const API_URL = import.meta.env.VITE_API_URL || "https://api.vpnht.com/graphql";

export const graphqlClient = new GraphQLClient(API_URL, {
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    graphqlClient.setHeader("Authorization", `Bearer ${token}`);
  } else {
    graphqlClient.setHeader("Authorization", "");
  }
}

// GraphQL Queries and Mutations
export const queries = {
  GET_SERVERS: `
    query GetServers {
      servers {
        id
        name
        country
        countryCode
        city
        lat
        lng
        hostname
        ip
        port
        publicKey
        supportedProtocols
        features
        isPremium
        isVirtual
      }
    }
  `,

  GET_USER: `
    query GetUser {
      me {
        id
        email
        subscription {
          plan
          expiresAt
          isActive
        }
      }
    }
  `,

  GET_LATENCY: `
    query GetLatency($serverIds: [ID!]!) {
      latencies(serverIds: $serverIds) {
        serverId
        latency
      }
    }
  `,

  GET_IP_INFO: `
    query GetIPInfo {
      ipInfo {
        ip
        country
        city
        isp
        isVpn
      }
    }
  `,
};

export const mutations = {
  LOGIN: `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        user {
          id
          email
          subscription {
            plan
            expiresAt
            isActive
          }
        }
        tokens {
          accessToken
          refreshToken
          expiresAt
        }
      }
    }
  `,

  SIGNUP: `
    mutation Signup($email: String!, $password: String!) {
      signup(email: $email, password: $password) {
        user {
          id
          email
          subscription {
            plan
            expiresAt
            isActive
          }
        }
        tokens {
          accessToken
          refreshToken
          expiresAt
        }
      }
    }
  `,

  REFRESH_TOKEN: `
    mutation RefreshToken($refreshToken: String!) {
      refreshToken(refreshToken: $refreshToken) {
        accessToken
        refreshToken
        expiresAt
      }
    }
  `,

  UPDATE_PREFERENCES: `
    mutation UpdatePreferences($preferences: UserPreferencesInput!) {
      updatePreferences(preferences: $preferences) {
        id
        preferences {
          language
          theme
          startup
          autoConnect
          minimizeToTray
          preferredProtocol
          killSwitch
          dnsLeakProtection
          disableIpv6
          obfuscation
          customDns
          customDnsServers
          mtu
        }
      }
    }
  `,
};

// API Functions
export async function fetchServers(): Promise<Server[]> {
  try {
    const data = await graphqlClient.request<{ servers: Server[] }>(queries.GET_SERVERS);
    return data.servers;
  } catch (error) {
    // Return mock data for development
    return getMockServers();
  }
}

export async function measureLatency(serverId: string): Promise<number | null> {
  try {
    const { invoke } = await import("@tauri-apps/api");
    const result = await invoke<LatencyResult>("measure_latency", { serverId });
    return result.latency;
  } catch {
    // Simulate latency for development
    return Math.floor(Math.random() * 150) + 20;
  }
}

export async function getIPInfo(): Promise<IPInfo | null> {
  try {
    const { invoke } = await import("@tauri-apps/api");
    return await invoke<IPInfo | null>("get_ip_info");
  } catch {
    return null;
  }
}

function getMockServers(): Server[] {
  return [
    // North America
    { id: "us-nyc", name: "New York", country: "United States", countryCode: "US", city: "New York", lat: 40.7128, lng: -74.0060, hostname: "us-nyc.vpnht.com", ip: "192.168.1.1", port: 443, publicKey: "abc123...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 45 },
    { id: "us-la", name: "Los Angeles", country: "United States", countryCode: "US", city: "Los Angeles", lat: 34.0522, lng: -118.2437, hostname: "us-la.vpnht.com", ip: "192.168.1.2", port: 443, publicKey: "def456...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 62 },
    { id: "us-mia", name: "Miami", country: "United States", countryCode: "US", city: "Miami", lat: 25.7617, lng: -80.1918, hostname: "us-mia.vpnht.com", ip: "192.168.1.3", port: 443, publicKey: "ghi789...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p"], load: 38 },
    { id: "us-chi", name: "Chicago", country: "United States", countryCode: "US", city: "Chicago", lat: 41.8781, lng: -87.6298, hostname: "us-chi.vpnht.com", ip: "192.168.1.4", port: 443, publicKey: "jkl012...", supportedProtocols: ["wireguard", "openvpn_udp", "openvpn_tcp"], features: ["streaming"], load: 55 },
    { id: "us-dal", name: "Dallas", country: "United States", countryCode: "US", city: "Dallas", lat: 32.7767, lng: -96.7970, hostname: "us-dal.vpnht.com", ip: "192.168.1.5", port: 443, publicKey: "mno345...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 41 },
    { id: "us-sea", name: "Seattle", country: "United States", countryCode: "US", city: "Seattle", lat: 47.6062, lng: -122.3321, hostname: "us-sea.vpnht.com", ip: "192.168.1.6", port: 443, publicKey: "pqr678...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 48 },
    { id: "ca-tor", name: "Toronto", country: "Canada", countryCode: "CA", city: "Toronto", lat: 43.6532, lng: -79.3832, hostname: "ca-tor.vpnht.com", ip: "192.168.1.7", port: 443, publicKey: "stu901...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 52 },
    { id: "ca-van", name: "Vancouver", country: "Canada", countryCode: "CA", city: "Vancouver", lat: 49.2827, lng: -123.1207, hostname: "ca-van.vpnht.com", ip: "192.168.1.8", port: 443, publicKey: "vwx234...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 35 },
    { id: "ca-mon", name: "Montreal", country: "Canada", countryCode: "CA", city: "Montreal", lat: 45.5017, lng: -73.5673, hostname: "ca-mon.vpnht.com", ip: "192.168.1.9", port: 443, publicKey: "yza567...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["streaming"], load: 44 },

    // Europe
    { id: "uk-lon", name: "London", country: "United Kingdom", countryCode: "GB", city: "London", lat: 51.5074, lng: -0.1278, hostname: "uk-lon.vpnht.com", ip: "192.168.2.1", port: 443, publicKey: "bcd890...", supportedProtocols: ["wireguard", "openvpn_udp", "openvpn_tcp"], features: ["p2p", "streaming"], load: 58 },
    { id: "uk-man", name: "Manchester", country: "United Kingdom", countryCode: "GB", city: "Manchester", lat: 53.4808, lng: -2.2426, hostname: "uk-man.vpnht.com", ip: "192.168.2.2", port: 443, publicKey: "efg123...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 42 },
    { id: "de-ber", name: "Berlin", country: "Germany", countryCode: "DE", city: "Berlin", lat: 52.5200, lng: 13.4050, hostname: "de-ber.vpnht.com", ip: "192.168.2.3", port: 443, publicKey: "hij456...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 63 },
    { id: "de-fra", name: "Frankfurt", country: "Germany", countryCode: "DE", city: "Frankfurt", lat: 50.1109, lng: 8.6821, hostname: "de-fra.vpnht.com", ip: "192.168.2.4", port: 443, publicKey: "klm789...", supportedProtocols: ["wireguard", "openvpn_udp", "openvpn_tcp"], features: ["p2p", "streaming"], load: 71 },
    { id: "nl-ams", name: "Amsterdam", country: "Netherlands", countryCode: "NL", city: "Amsterdam", lat: 52.3676, lng: 4.9041, hostname: "nl-ams.vpnht.com", ip: "192.168.2.5", port: 443, publicKey: "nop012...", supportedProtocols: ["wireguard"], features: ["p2p", "double_vpn"], load: 66 },
    { id: "fr-par", name: "Paris", country: "France", countryCode: "FR", city: "Paris", lat: 48.8566, lng: 2.3522, hostname: "fr-par.vpnht.com", ip: "192.168.2.6", port: 443, publicKey: "qrs345...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 54 },
    { id: "es-mad", name: "Madrid", country: "Spain", countryCode: "ES", city: "Madrid", lat: 40.4168, lng: -3.7038, hostname: "es-mad.vpnht.com", ip: "192.168.2.7", port: 443, publicKey: "tuv678...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 47 },
    { id: "it-rom", name: "Rome", country: "Italy", countryCode: "IT", city: "Rome", lat: 41.9028, lng: 12.4964, hostname: "it-rom.vpnht.com", ip: "192.168.2.8", port: 443, publicKey: "wxy901...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["streaming"], load: 51 },
    { id: "ch-zur", name: "Zurich", country: "Switzerland", countryCode: "CH", city: "Zurich", lat: 47.3769, lng: 8.5417, hostname: "ch-zur.vpnht.com", ip: "192.168.2.9", port: 443, publicKey: "zab234...", supportedProtocols: ["wireguard"], features: ["p2p", "streaming"], isPremium: true, load: 39 },
    { id: "se-sto", name: "Stockholm", country: "Sweden", countryCode: "SE", city: "Stockholm", lat: 59.3293, lng: 18.0686, hostname: "se-sto.vpnht.com", ip: "192.168.2.10", port: 443, publicKey: "cde567...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "tor_over_vpn"], load: 56 },
    { id: "no-osl", name: "Oslo", country: "Norway", countryCode: "NO", city: "Oslo", lat: 59.9139, lng: 10.7522, hostname: "no-osl.vpnht.com", ip: "192.168.2.11", port: 443, publicKey: "fgh890...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 37 },

    // Asia Pacific
    { id: "jp-tok", name: "Tokyo", country: "Japan", countryCode: "JP", city: "Tokyo", lat: 35.6762, lng: 139.6503, hostname: "jp-tok.vpnht.com", ip: "192.168.3.1", port: 443, publicKey: "ijk123...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 68 },
    { id: "jp-osk", name: "Osaka", country: "Japan", countryCode: "JP", city: "Osaka", lat: 34.6937, lng: 135.5023, hostname: "jp-osk.vpnht.com", ip: "192.168.3.2", port: 443, publicKey: "lmn456...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 49 },
    { id: "sg-sin", name: "Singapore", country: "Singapore", countryCode: "SG", city: "Singapore", lat: 1.3521, lng: 103.8198, hostname: "sg-sin.vpnht.com", ip: "192.168.3.3", port: 443, publicKey: "opq789...", supportedProtocols: ["wireguard", "openvpn_udp", "openvpn_tcp"], features: ["p2p", "streaming"], load: 72 },
    { id: "au-syd", name: "Sydney", country: "Australia", countryCode: "AU", city: "Sydney", lat: -33.8688, lng: 151.2093, hostname: "au-syd.vpnht.com", ip: "192.168.3.4", port: 443, publicKey: "rst012...", supportedProtocols: ["wireguard"], features: ["p2p", "streaming"], load: 61 },
    { id: "au-mel", name: "Melbourne", country: "Australia", countryCode: "AU", city: "Melbourne", lat: -37.8136, lng: 144.9631, hostname: "au-mel.vpnht.com", ip: "192.168.3.5", port: 443, publicKey: "uvw345...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p"], load: 53 },
    { id: "hk-hkg", name: "Hong Kong", country: "Hong Kong", countryCode: "HK", city: "Hong Kong", lat: 22.3193, lng: 114.1694, hostname: "hk-hkg.vpnht.com", ip: "192.168.3.6", port: 443, publicKey: "xyz678...", supportedProtocols: ["wireguard"], features: ["streaming"], load: 74 },
    { id: "kr-seo", name: "Seoul", country: "South Korea", countryCode: "KR", city: "Seoul", lat: 37.5665, lng: 126.9780, hostname: "kr-seo.vpnht.com", ip: "192.168.3.7", port: 443, publicKey: "abc901...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 57 },
    { id: "in-mum", name: "Mumbai", country: "India", countryCode: "IN", city: "Mumbai", lat: 19.0760, lng: 72.8777, hostname: "in-mum.vpnht.com", ip: "192.168.3.8", port: 443, publicKey: "def234...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 69 },
    { id: "th-bkk", name: "Bangkok", country: "Thailand", countryCode: "TH", city: "Bangkok", lat: 13.7563, lng: 100.5018, hostname: "th-bkk.vpnht.com", ip: "192.168.3.9", port: 443, publicKey: "ghi567...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 43 },

    // Middle East & Africa
    { id: "ae-dxb", name: "Dubai", country: "UAE", countryCode: "AE", city: "Dubai", lat: 25.2048, lng: 55.2708, hostname: "ae-dxb.vpnht.com", ip: "192.168.4.1", port: 443, publicKey: "jkl890...", supportedProtocols: ["wireguard"], features: ["streaming"], isPremium: true, load: 40 },
    { id: "il-tlv", name: "Tel Aviv", country: "Israel", countryCode: "IL", city: "Tel Aviv", lat: 32.0853, lng: 34.7818, hostname: "il-tlv.vpnht.com", ip: "192.168.4.2", port: 443, publicKey: "mno123...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 45 },
    { id: "za-jnb", name: "Johannesburg", country: "South Africa", countryCode: "ZA", city: "Johannesburg", lat: -26.2041, lng: 28.0473, hostname: "za-jnb.vpnht.com", ip: "192.168.4.3", port: 443, publicKey: "pqr456...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 50 },
    { id: "tr-ist", name: "Istanbul", country: "Turkey", countryCode: "TR", city: "Istanbul", lat: 41.0082, lng: 28.9784, hostname: "tr-ist.vpnht.com", ip: "192.168.4.4", port: 443, publicKey: "stu789...", supportedProtocols: ["wireguard"], features: ["p2p", "streaming"], load: 48 },

    // South America
    { id: "br-sao", name: "São Paulo", country: "Brazil", countryCode: "BR", city: "São Paulo", lat: -23.5505, lng: -46.6333, hostname: "br-sao.vpnht.com", ip: "192.168.5.1", port: 443, publicKey: "vwx012...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 64 },
    { id: "ar-bue", name: "Buenos Aires", country: "Argentina", countryCode: "AR", city: "Buenos Aires", lat: -34.6037, lng: -58.3816, hostname: "ar-bue.vpnht.com", ip: "192.168.5.2", port: 443, publicKey: "yza345...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 46 },
    { id: "cl-san", name: "Santiago", country: "Chile", countryCode: "CL", city: "Santiago", lat: -33.4489, lng: -70.6693, hostname: "cl-san.vpnht.com", ip: "192.168.5.3", port: 443, publicKey: "bcd678...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 41 },
    { id: "co-bog", name: "Bogotá", country: "Colombia", countryCode: "CO", city: "Bogotá", lat: 4.7110, lng: -74.0721, hostname: "co-bog.vpnht.com", ip: "192.168.5.4", port: 443, publicKey: "efg901...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 44 },
    { id: "mx-mex", name: "Mexico City", country: "Mexico", countryCode: "MX", city: "Mexico City", lat: 19.4326, lng: -99.1332, hostname: "mx-mex.vpnht.com", ip: "192.168.5.5", port: 443, publicKey: "hij234...", supportedProtocols: ["wireguard", "openvpn_udp"], features: ["p2p", "streaming"], load: 58 },

    // Central/Eastern Europe
    { id: "pl-waw", name: "Warsaw", country: "Poland", countryCode: "PL", city: "Warsaw", lat: 52.2297, lng: 21.0122, hostname: "pl-waw.vpnht.com", ip: "192.168.6.1", port: 443, publicKey: "klm567...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 52 },
    { id: "cz-prg", name: "Prague", country: "Czech Republic", countryCode: "CZ", city: "Prague", lat: 50.0755, lng: 14.4378, hostname: "cz-prg.vpnht.com", ip: "192.168.6.2", port: 443, publicKey: "nop890...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 47 },
    { id: "hu-bud", name: "Budapest", country: "Hungary", countryCode: "HU", city: "Budapest", lat: 47.4979, lng: 19.0402, hostname: "hu-bud.vpnht.com", ip: "192.168.6.3", port: 443, publicKey: "qrs123...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 43 },
    { id: "ro-buc", name: "Bucharest", country: "Romania", countryCode: "RO", city: "Bucharest", lat: 44.4268, lng: 26.1025, hostname: "ro-buc.vpnht.com", ip: "192.168.6.4", port: 443, publicKey: "tuv456...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 45 },
    { id: "bg-sof", name: "Sofia", country: "Bulgaria", countryCode: "BG", city: "Sofia", lat: 42.6977, lng: 23.3219, hostname: "bg-sof.vpnht.com", ip: "192.168.6.5", port: 443, publicKey: "wxy789...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 40 },
    { id: "ua-iev", name: "Kyiv", country: "Ukraine", countryCode: "UA", city: "Kyiv", lat: 50.4504, lng: 30.5245, hostname: "ua-iev.vpnht.com", ip: "192.168.6.6", port: 443, publicKey: "zab012...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 55 },
    { id: "fi-hel", name: "Helsinki", country: "Finland", countryCode: "FI", city: "Helsinki", lat: 60.1699, lng: 24.9384, hostname: "fi-hel.vpnht.com", ip: "192.168.6.7", port: 443, publicKey: "cde345...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 38 },
    { id: "dk-cph", name: "Copenhagen", country: "Denmark", countryCode: "DK", city: "Copenhagen", lat: 55.6761, lng: 12.5683, hostname: "dk-cph.vpnht.com", ip: "192.168.6.8", port: 443, publicKey: "fgh678...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 42 },

    // Additional Asia
    { id: "tw-tpe", name: "Taipei", country: "Taiwan", countryCode: "TW", city: "Taipei", lat: 25.0330, lng: 121.5654, hostname: "tw-tpe.vpnht.com", ip: "192.168.7.1", port: 443, publicKey: "ijk901...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 48 },
    { id: "id-jkt", name: "Jakarta", country: "Indonesia", countryCode: "ID", city: "Jakarta", lat: -6.2088, lng: 106.8456, hostname: "id-jkt.vpnht.com", ip: "192.168.7.2", port: 443, publicKey: "lmn234...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 51 },
    { id: "my-kul", name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", city: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, hostname: "my-kul.vpnht.com", ip: "192.168.7.3", port: 443, publicKey: "opq567...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 44 },
    { id: "ph-man", name: "Manila", country: "Philippines", countryCode: "PH", city: "Manila", lat: 14.5995, lng: 120.9842, hostname: "ph-man.vpnht.com", ip: "192.168.7.4", port: 443, publicKey: "rst890...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 47 },
    { id: "vn-sgn", name: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", city: "Ho Chi Minh", lat: 10.8231, lng: 106.6297, hostname: "vn-sgn.vpnht.com", ip: "192.168.7.5", port: 443, publicKey: "uvw123...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 42 },

    // Additional Europe
    { id: "ie-dub", name: "Dublin", country: "Ireland", countryCode: "IE", city: "Dublin", lat: 53.3498, lng: -6.2603, hostname: "ie-dub.vpnht.com", ip: "192.168.8.1", port: 443, publicKey: "xyz456...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 45 },
    { id: "pt-lis", name: "Lisbon", country: "Portugal", countryCode: "PT", city: "Lisbon", lat: 38.7223, lng: -9.1393, hostname: "pt-lis.vpnht.com", ip: "192.168.8.2", port: 443, publicKey: "abc789...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 43 },
    { id: "gr-ath", name: "Athens", country: "Greece", countryCode: "GR", city: "Athens", lat: 37.9838, lng: 23.7275, hostname: "gr-ath.vpnht.com", ip: "192.168.8.3", port: 443, publicKey: "def012...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 46 },
    { id: "lv-rig", name: "Riga", country: "Latvia", countryCode: "LV", city: "Riga", lat: 56.9496, lng: 24.1052, hostname: "lv-rig.vpnht.com", ip: "192.168.8.4", port: 443, publicKey: "ghi345...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 39 },
    { id: "ee-tal", name: "Tallinn", country: "Estonia", countryCode: "EE", city: "Tallinn", lat: 59.4370, lng: 24.7536, hostname: "ee-tal.vpnht.com", ip: "192.168.8.5", port: 443, publicKey: "jkl678...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 41 },
    { id: "lt-vil", name: "Vilnius", country: "Lithuania", countryCode: "LT", city: "Vilnius", lat: 54.6872, lng: 25.2797, hostname: "lt-vil.vpnht.com", ip: "192.168.8.6", port: 443, publicKey: "mno901...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 38 },
    { id: "at-vie", name: "Vienna", country: "Austria", countryCode: "AT", city: "Vienna", lat: 48.2082, lng: 16.3738, hostname: "at-vie.vpnht.com", ip: "192.168.8.7", port: 443, publicKey: "pqr234...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 44 },
    { id: "be-bru", name: "Brussels", country: "Belgium", countryCode: "BE", city: "Brussels", lat: 50.8503, lng: 4.3517, hostname: "be-bru.vpnht.com", ip: "192.168.8.8", port: 443, publicKey: "stu567...", supportedProtocols: ["wireguard"], features: ["p2p"], load: 47 },
  ].map(s => ({ ...s, latency: Math.floor(Math.random() * 150) + 10, supportedProtocols: s.supportedProtocols as Protocol[], features: s.features as ServerFeature[] }));
}
