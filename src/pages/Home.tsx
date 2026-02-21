import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield,
  ShieldCheck,
  Power,
  Download,
  Upload,
  Clock,
  Globe,
  Loader2,
} from "lucide-react";
import { useConnectionStore, useServerStore } from "@stores";
import { getCountryFlag, formatDuration, formatBytes } from "@utils/helpers";
import { cn } from "@utils/helpers";

export function Home() {
  const { t } = useTranslation();
  const { status, server, connectedAt, bytesReceived, bytesSent, connect, disconnect } =
    useConnectionStore();
  const { servers } = useServerStore();
  const [elapsed, setElapsed] = useState(0);
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  // Update elapsed time
  useEffect(() => {
    if (!connectedAt) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(Date.now() - connectedAt.getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [connectedAt]);

  // Find best server (lowest latency)
  const bestServer = servers
    .filter((s) => s.latency)
    .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity))[0];

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect();
    } else if (bestServer) {
      await connect(bestServer);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "text-success-500";
      case "connecting":
        return "text-yellow-500";
      case "disconnecting":
        return "text-gray-400";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

    return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t("nav.home")}</h1>
        <p className="text-gray-400 mt-2">
          {isConnected
            ? "Your connection is secure and encrypted"
            : "Connect to a VPN server to protect your privacy"}
        </p>
      </div>

      {/* Connection Card */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
        <div className="flex flex-col items-center">
          {/* Status Icon */}
          <div
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-500",
              isConnected
                ? "bg-success-500/20 animate-pulse-slow"
                : isConnecting
                ? "bg-yellow-500/20"
                : "bg-gray-800"
            )}
          >
            {isConnected ? (
              <ShieldCheck className="w-16 h-16 text-success-500" />
            ) : (
              <Shield className={cn("w-16 h-16", getStatusColor())} />
            )}
          </div>

          {/* Status Text */}
          <div className="text-center mb-6">
            <p className={cn("text-2xl font-bold", getStatusColor())}>
              {t(`connection.status.${status}`)}
            </p>
            {server && isConnected && (
              <p className="text-gray-400 mt-2">
                Connected to {server.name}, {server.country}{" "}
                {getCountryFlag(server.countryCode)}
              </p>
            )}
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting || (!isConnected && !bestServer)}
            className={cn(
              "w-64 py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3",
              isConnected
                ? "bg-danger-600 hover:bg-danger-500 text-white"
                : "bg-primary-600 hover:bg-primary-500 text-white disabled:bg-gray-700 disabled:cursor-not-allowed"
            )}
          >
            {isConnecting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Power className="w-6 h-6" />
                {isConnected ? t("connection.disconnect") : t("connection.connect")}
              </>
            )}
          </button>

          {/* Best Server Hint */}
          {!isConnected && bestServer && (
            <p className="text-sm text-gray-500 mt-4">
              Quick connect to {getCountryFlag(bestServer.countryCode)}{" "}
              {bestServer.name} ({bestServer.latency}ms)
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Duration */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <p className="text-sm text-gray-400">{t("connection.duration")}</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {isConnected ? formatDuration(elapsed) : "--"}
          </p>
        </div>

        {/* Download */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Download className="w-5 h-5 text-green-400" />
            <p className="text-sm text-gray-400">Downloaded</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {isConnected ? formatBytes(bytesReceived) : "--"}
          </p>
        </div>

        {/* Upload */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-gray-400">Uploaded</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {isConnected ? formatBytes(bytesSent) : "--"}
          </p>
        </div>

        {/* Virtual Location */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-gray-400">{t("connection.yourIP")}</p>
          </div>
          <p className="text-xl font-semibold text-white">
            {isConnected && server
              ? `${server.ip} ${getCountryFlag(server.countryCode)}`
              : t("connection.exposed")}
          </p>
        </div>
      </div>

      {/* Server Details */}
      {server && isConnected && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {t("connection.currentServer")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Location</p>
              <p className="text-white font-medium">
                {getCountryFlag(server.countryCode)} {server.city}, {server.country}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Protocol</p>
              <p className="text-white font-medium capitalize">WireGuard</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Hostname</p>
              <p className="text-white font-medium font-mono text-sm">
                {server.hostname}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Features</p>
              <p className="text-white font-medium">
                {server.features.includes("p2p") && "P2P "}
                {server.features.includes("streaming") && "Streaming "}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
