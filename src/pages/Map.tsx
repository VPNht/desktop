import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useServerStore, useConnectionStore } from "@stores";
import { getCountryFlag, cn } from "@utils/helpers";
import { Shield, Zap, Signal } from "lucide-react";
import toast from "react-hot-toast";
import type { Server } from "@types";

export function Map() {
  const { t } = useTranslation();
  const { servers, latencyMap, favorites } = useServerStore();
  const { connect, status } = useConnectionStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = status === "connected";

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
    });

    // Add navigation controls
    map.current.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers when servers change
  useEffect(() => {
    if (!map.current || servers.length === 0) return;

    // Clear existing markers
    const markers = document.querySelectorAll(".maplibregl-marker");
    markers.forEach((marker) => marker.remove());

    // Add new markers
    servers.forEach((server) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer transition-transform hover:scale-110";

      const latency = latencyMap.get(server.id);
      const isFavorite = favorites.includes(server.id);

      // Determine marker color based on latency
      let markerColor = "bg-gray-500";
      if (latency) {
        if (latency < 50) markerColor = "bg-green-500";
        else if (latency < 100) markerColor = "bg-yellow-500";
        else markerColor = "bg-red-500";
      }

      el.innerHTML = `
        <div class="relative">
          <div class="w-8 h-8 ${markerColor} rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <span class="text-sm">${getCountryFlag(server.countryCode)}</span>
          </div>
          ${isFavorite ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-900"></div>' : ""}
        </div>
      `;

      el.addEventListener("click", () => {
        setSelectedServer(server);
        map.current?.flyTo({
          center: [server.lng, server.lat],
          zoom: 6,
          duration: 1000,
        });
      });

      new maplibregl.Marker({ element: el })
        .setLngLat([server.lng, server.lat])
        .addTo(map.current!);
    });
  }, [servers, latencyMap, favorites]);

  const handleConnect = async () => {
    if (!selectedServer || isConnecting) return;
    setIsConnecting(true);
    try {
      await connect(selectedServer);
      toast.success(`Connected to ${selectedServer.name}`);
    } catch (error) {
      toast.error("Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  };

  const getLatencyColor = (latency: number | undefined) => {
    if (!latency) return "text-gray-400";
    if (latency < 50) return "text-green-400";
    if (latency < 100) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t("map.title")}</h1>
        <p className="text-gray-400 mt-1">
          {t("map.serverCount", { count: servers.length })}
        </p>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-800"
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
          <p className="text-xs font-medium text-gray-400 mb-2">Latency</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-300">{"< 50ms"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-300">{"50-100ms"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-300">{"> 100ms"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Server Details Card */}
      {selectedServer && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-2xl">
                {getCountryFlag(selectedServer.countryCode)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedServer.name}
                </h3>
                <p className="text-gray-400">
                  {selectedServer.city}, {selectedServer.country}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Signal
                  className={cn(
                    "w-5 h-5",
                    getLatencyColor(latencyMap.get(selectedServer.id))
                  )}
                />
                <div>
                  <p className="text-xs text-gray-500">Latency</p>
                  <p
                    className={cn(
                      "font-medium",
                      getLatencyColor(latencyMap.get(selectedServer.id))
                    )}
                  >
                    {latencyMap.get(selectedServer.id)?.toString() || "--"} ms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Load</p>
                  <p className="font-medium text-white">
                    {selectedServer.load || 0}%
                  </p>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting || isConnected}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                {isConnecting
                  ? "Connecting..."
                  : isConnected
                  ? "Connected"
                  : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
