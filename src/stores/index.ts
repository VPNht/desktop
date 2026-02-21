import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  ConnectionState,
  ConnectionStatus,
  Server,
  User,
  AuthTokens,
  UserPreferences,
  IPInfo,
} from "@types";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },

      setTokens: (tokens) => {
        set((state) => {
          state.tokens = tokens;
        });
      },

      login: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // Call Tauri command for secure login
          const { invoke } = await import("@tauri-apps/api");
          const result = await invoke<{ user: User; tokens: AuthTokens }>("auth_login", {
            email,
            password,
          });

          set((state) => {
            state.user = result.user;
            state.tokens = result.tokens;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
          });
          throw error;
        }
      },

      signup: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const { invoke } = await import("@tauri-apps/api");
          const result = await invoke<{ user: User; tokens: AuthTokens }>("auth_signup", {
            email,
            password,
          });

          set((state) => {
            state.user = result.user;
            state.tokens = result.tokens;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
          });
          throw error;
        }
      },

      logout: () => {
        set((state) => {
          state.user = null;
          state.tokens = null;
          state.isAuthenticated = false;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      updatePreferences: (preferences) => {
        set((state) => {
          if (state.user) {
            state.user.preferences = { ...state.user.preferences, ...preferences };
          }
        });
      },
    })),
    {
      name: "vpnht-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface ConnectionStoreState extends ConnectionState {
  connect: (server: Server) => Promise<void>;
  disconnect: () => Promise<void>;
  setStatus: (status: ConnectionStatus) => void;
  updateStats: (bytesReceived: number, bytesSent: number) => void;
  setError: (error: string | undefined) => void;
  setIPInfo: (ipInfo: IPInfo | undefined) => void;
  pending: boolean;
}

export const useConnectionStore = create<ConnectionStoreState>()(
  immer((set, get) => ({
    status: "disconnected",
    server: undefined,
    connectedAt: undefined,
    bytesReceived: 0,
    bytesSent: 0,
    error: undefined,
    ipInfo: undefined,
    pending: false,

    connect: async (server: Server) => {
      const { status, pending } = get();
      if (status === "connecting" || status === "connected" || pending) {
        return;
      }
      set((state) => {
        state.pending = true;
      });

      set((state) => {
        state.status = "connecting";
        state.server = server;
        state.error = undefined;
      });

      try {
        const { invoke } = await import("@tauri-apps/api");
        await invoke("vpn_connect", { serverId: server.id });

        set((state) => {
          state.status = "connected";
          state.connectedAt = new Date();
          state.bytesReceived = 0;
          state.bytesSent = 0;
          state.pending = false;
        });
      } catch (error) {
        set((state) => {
          state.status = "error";
          state.error = error instanceof Error ? error.message : "Connection failed";
          state.server = undefined;
          state.pending = false;
        });
        throw error;
      }
    },

    disconnect: async () => {
      const { status, pending } = get();
      if (status === "disconnecting" || status === "disconnected" || pending) {
        return;
      }
      set((state) => {
        state.pending = true;
      });

      set((state) => {
        state.status = "disconnecting";
      });

      try {
        const { invoke } = await import("@tauri-apps/api");
        await invoke("vpn_disconnect");

        set((state) => {
          state.status = "disconnected";
          state.server = undefined;
          state.connectedAt = undefined;
          state.bytesReceived = 0;
          state.bytesSent = 0;
          state.error = undefined;
          state.ipInfo = undefined;
          state.pending = false;
        });
      } catch (error) {
        set((state) => {
          state.status = "error";
          state.error = error instanceof Error ? error.message : "Disconnection failed";
          state.pending = false;
        });
        throw error;
      }
    },

    setStatus: (status) => {
      set((state) => {
        state.status = status;
      });
    },

    updateStats: (bytesReceived, bytesSent) => {
      set((state) => {
        state.bytesReceived = bytesReceived;
        state.bytesSent = bytesSent;
      });
    },

    setError: (error) => {
      set((state) => {
        state.error = error;
        if (error) {
          state.status = "error";
        }
      });
    },

    setIPInfo: (ipInfo) => {
      set((state) => {
        state.ipInfo = ipInfo;
      });
    },
  }))
);

interface ServerStoreState {
  servers: Server[];
  favorites: string[];
  selectedRegion: string | null;
  searchQuery: string;
  isLoading: boolean;
  latencyMap: Map<string, number>;
  lastUpdated: Date | null;
  setServers: (servers: Server[]) => void;
  addFavorite: (serverId: string) => void;
  removeFavorite: (serverId: string) => void;
  toggleFavorite: (serverId: string) => void;
  setSelectedRegion: (region: string | null) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  updateLatency: (serverId: string, latency: number) => void;
  fetchServers: () => Promise<void>;
  refreshLatencies: () => Promise<void>;
}

export const useServerStore = create<ServerStoreState>()(
  persist(
    immer((set, get) => ({
      servers: [],
      favorites: [],
      selectedRegion: null,
      searchQuery: "",
      isLoading: false,
      latencyMap: new Map(),
      lastUpdated: null,

      setServers: (servers) => {
        set((state) => {
          state.servers = servers;
          state.lastUpdated = new Date();
        });
      },

      addFavorite: (serverId) => {
        set((state) => {
          if (!state.favorites.includes(serverId)) {
            state.favorites.push(serverId);
          }
        });
      },

      removeFavorite: (serverId) => {
        set((state) => {
          state.favorites = state.favorites.filter((id) => id !== serverId);
        });
      },

      toggleFavorite: (serverId) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.includes(serverId)) {
          removeFavorite(serverId);
        } else {
          addFavorite(serverId);
        }
      },

      setSelectedRegion: (region) => {
        set((state) => {
          state.selectedRegion = region;
        });
      },

      setSearchQuery: (query) => {
        set((state) => {
          state.searchQuery = query;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      updateLatency: (serverId, latency) => {
        set((state) => {
          state.latencyMap.set(serverId, latency);
        });
      },

      fetchServers: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const { invoke } = await import("@tauri-apps/api");
          const servers = await invoke<Server[]>("fetch_servers");

          set((state) => {
            state.servers = servers;
            state.lastUpdated = new Date();
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
          });
          throw error;
        }
      },

      refreshLatencies: async () => {
        const { servers } = get();
        if (servers.length === 0) return;

        try {
          const { invoke } = await import("@tauri-apps/api");
          const latencies = await invoke<Array<{ serverId: string; latency: number | null }>>(
            "measure_latencies",
            { serverIds: servers.map((s) => s.id) }
          );

          set((state) => {
            latencies.forEach(({ serverId, latency }) => {
              if (latency !== null) {
                state.latencyMap.set(serverId, latency);
              }
            });
          });
        } catch (error) {
          console.error("Failed to refresh latencies:", error);
        }
      },
    })),
    {
      name: "vpnht-server-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        selectedRegion: state.selectedRegion,
      }),
    }
  )
);

interface SettingsStoreState {
  language: string;
  theme: "light" | "dark" | "system";
  startup: boolean;
  minimizeToTray: boolean;
  autoConnect: boolean;
  killSwitch: boolean;
  dnsLeakProtection: boolean;
  disableIpv6: boolean;
  preferredProtocol: "wireguard" | "openvpn_udp" | "openvpn_tcp";
  obfuscation: boolean;
  customDns: boolean;
  customDnsServers: string[];
  mtu: number;
  setLanguage: (lang: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setStartup: (enabled: boolean) => void;
  setMinimizeToTray: (enabled: boolean) => void;
  setAutoConnect: (enabled: boolean) => void;
  setKillSwitch: (enabled: boolean) => void;
  setDnsLeakProtection: (enabled: boolean) => void;
  setDisableIpv6: (enabled: boolean) => void;
  setPreferredProtocol: (protocol: "wireguard" | "openvpn_udp" | "openvpn_tcp") => void;
  setObfuscation: (enabled: boolean) => void;
  setCustomDns: (enabled: boolean) => void;
  setCustomDnsServers: (servers: string[]) => void;
  setMtu: (mtu: number) => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    immer((set) => ({
      language: "en",
      theme: "system",
      startup: false,
      minimizeToTray: true,
      autoConnect: false,
      killSwitch: false,
      dnsLeakProtection: true,
      disableIpv6: true,
      preferredProtocol: "wireguard",
      obfuscation: false,
      customDns: false,
      customDnsServers: [],
      mtu: 1420,

      setLanguage: (lang) => {
        set((state) => {
          state.language = lang;
        });
      },

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });
      },

      setStartup: (enabled) => {
        set((state) => {
          state.startup = enabled;
        });
      },

      setMinimizeToTray: (enabled) => {
        set((state) => {
          state.minimizeToTray = enabled;
        });
      },

      setAutoConnect: (enabled) => {
        set((state) => {
          state.autoConnect = enabled;
        });
      },

      setKillSwitch: (enabled) => {
        set((state) => {
          state.killSwitch = enabled;
        });
      },

      setDnsLeakProtection: (enabled) => {
        set((state) => {
          state.dnsLeakProtection = enabled;
        });
      },

      setDisableIpv6: (enabled) => {
        set((state) => {
          state.disableIpv6 = enabled;
        });
      },

      setPreferredProtocol: (protocol) => {
        set((state) => {
          state.preferredProtocol = protocol;
        });
      },

      setObfuscation: (enabled) => {
        set((state) => {
          state.obfuscation = enabled;
        });
      },

      setCustomDns: (enabled) => {
        set((state) => {
          state.customDns = enabled;
        });
      },

      setCustomDnsServers: (servers) => {
        set((state) => {
          state.customDnsServers = servers;
        });
      },

      setMtu: (mtu) => {
        set((state) => {
          state.mtu = mtu;
        });
      },
    })),
    {
      name: "vpnht-settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
