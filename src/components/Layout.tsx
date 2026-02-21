import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Server,
  Map as MapIcon,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuthStore, useConnectionStore } from "@stores";
import { cn } from "@utils/helpers";

export function Layout() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const { status, server } = useConnectionStore();

  const navItems = [
    { path: "/", label: t("nav.home"), icon: Home },
    { path: "/servers", label: t("nav.servers"), icon: Server },
    { path: "/map", label: t("nav.map"), icon: MapIcon },
    { path: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                isConnected
                  ? "bg-success-500/20 text-success-500"
                  : isConnecting
                  ? "bg-yellow-500/20 text-yellow-500 animate-pulse"
                  : "bg-gray-800 text-gray-400"
              )}
            >
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t("app.name")}</h1>
              <p className="text-xs text-gray-500">{t("app.tagline")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-500/10 text-primary-400"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected && "bg-success-500",
                  isConnecting && "bg-yellow-500 animate-pulse",
                  status === "disconnected" && "bg-gray-500",
                  status === "error" && "bg-danger-500"
                )}
              />
              <span className="text-sm font-medium text-gray-300">
                {t(`connection.status.${status}`)}
              </span>
            </div>
            {server && (
              <div className="text-xs text-gray-500">
                {server.country} - {server.city}
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
