import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Signal,
  ChevronDown,
  Star,
  Zap,
  Monitor,
  Globe2,
  Loader2,
  Wifi,
} from "lucide-react";
import { useServerStore, useConnectionStore } from "@stores";
import { getCountryFlag, formatLatency, groupByRegion, cn } from "@utils/helpers";
import { fetchServers, measureLatency } from "@utils/api";
import toast from "react-hot-toast";
import type { Server } from "@types";

export function Servers() {
  const { t } = useTranslation();
  const {
    servers,
    favorites,
    selectedRegion,
    searchQuery,
    isLoading,
    latencyMap,
    setServers,
    setLoading,
    setSelectedRegion,
    setSearchQuery,
    toggleFavorite,
    updateLatency,
  } = useServerStore();
  const { connect, status } = useConnectionStore();
  const isConnecting = status === "connecting";

  const [sortBy, setSortBy] = useState<"name" | "latency" | "load">("latency");
  const [showFavorites, setShowFavorites] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    try {
      const data = await fetchServers();
      setServers(data);
      // Measure latencies
      await refreshLatencies(data);
    } catch (error) {
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  };

  const refreshLatencies = async (serverList: Server[]) => {
    setIsRefreshing(true);
    const batchSize = 5;
    for (let i = 0; i < serverList.length; i += batchSize) {
      const batch = serverList.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (server) => {
          try {
            const latency = await measureLatency(server.id);
            if (latency !== null) {
              updateLatency(server.id, latency);
            }
          } catch {
            // Skip failed latency checks
          }
        })
      );
    }
    setIsRefreshing(false);
  };

  const handleRefresh = () => {
    refreshLatencies(servers);
  };

  const regions = useMemo(() => groupByRegion(servers), [servers]);

  const filteredServers = useMemo(() => {
    let result = [...servers];

    // Filter by favorites
    if (showFavorites) {
      result = result.filter((s) => favorites.includes(s.id));
    }

    // Filter by region
    if (selectedRegion) {
      result = result.filter((s) => s.country === selectedRegion);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.country.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "latency":
        result.sort((a, b) => {
          const latA = latencyMap.get(a.id) ?? Infinity;
          const latB = latencyMap.get(b.id) ?? Infinity;
          return latA - latB;
        });
        break;
      case "load":
        result.sort((a, b) => (b.load || 0) - (a.load || 0));
        break;
    }

    return result;
  }, [servers, favorites, selectedRegion, searchQuery, sortBy, latencyMap, showFavorites]);

  const handleConnect = async (server: Server) => {
    if (isConnecting) return;
    try {
      await connect(server);
      toast.success(`Connected to ${server.name}`);
    } catch (error) {
      toast.error("Failed to connect");
    }
  };

  const getLatencyColor = (latency: number | undefined) => {
    if (!latency) return "text-gray-500";
    if (latency < 50) return "text-success-500";
    if (latency < 100) return "text-yellow-500";
    return "text-danger-500";
  };

  const getLoadColor = (load: number | undefined) => {
    if (!load) return "text-gray-500";
    if (load < 50) return "text-success-500";
    if (load < 80) return "text-yellow-500";
    return "text-danger-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("servers.title")}</h1>
          <p className="text-gray-400 mt-1">
            {filteredServers.length} servers available
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Wifi className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Testing..." : "Test Latency"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("servers.search")}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Region Dropdown */}
          <div className="relative">
            <select
              value={selectedRegion || ""}
              onChange={(e) => setSelectedRegion(e.target.value || null)}
              className="appearance-none w-48 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">{t("servers.allRegions")}</option>
              {regions.map((region) => (
                <option key={region.name} value={region.name}>
                  {getCountryFlag(region.countryCode)} {region.name} ({region.count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none w-40 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="latency">Sort by Latency</option>
              <option value="name">Sort by Name</option>
              <option value="load">Sort by Load</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              showFavorites
                ? "bg-primary-500/20 text-primary-400"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            )}
          >
            <Star
              className={cn("w-4 h-4", showFavorites && "fill-current")}
            />
            {t("servers.favorites")}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      )}

      {/* Server Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServers.map((server) => {
            const latency = latencyMap.get(server.id);
            const isFav = favorites.includes(server.id);

            return (
              <div
                key={server.id}
                className={cn(
                  "group bg-gray-900 rounded-xl border p-4 transition-all duration-200 hover:border-gray-600",
                  isFav ? "border-primary-500/50" : "border-gray-800"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
                      {getCountryFlag(server.countryCode)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{server.name}</h3>
                      <p className="text-sm text-gray-400">
                        {server.city}, {server.country}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFavorite(server.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isFav
                        ? "text-yellow-400 hover:text-yellow-300"
                        : "text-gray-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Star className={cn("w-5 h-5", isFav && "fill-current")} />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Signal className={cn("w-4 h-4", getLatencyColor(latency))} />
                    <span className={cn("text-sm font-medium", getLatencyColor(latency))}>
                      {formatLatency(latency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className={cn("w-4 h-4", getLoadColor(server.load))} />
                    <span className={cn("text-sm", getLoadColor(server.load))}>
                      {server.load || 0}%
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {server.features.includes("p2p") && (
                      <span title="P2P Supported" className="text-green-400">
                        <Globe2 className="w-4 h-4" />
                      </span>
                    )}
                    {server.features.includes("streaming") && (
                      <span title="Streaming Optimized" className="text-blue-400">
                        <Monitor className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleConnect(server)}
                  disabled={isConnecting}
                  className="mt-4 w-full py-2 px-4 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredServers.length === 0 && (
        <div className="text-center py-20">
          <Globe2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">No servers found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
