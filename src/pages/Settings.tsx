import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Moon,
  Sun,
  Monitor,
  Cpu,
  Shield,
  Wifi,
  Power,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useSettingsStore, useAuthStore } from "@stores";
import { cn } from "@utils/helpers";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

export function Settings() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuthStore();
  const {
    language,
    theme,
    startup,
    minimizeToTray,
    autoConnect,
    killSwitch,
    dnsLeakProtection,
    disableIpv6,
    preferredProtocol,
    obfuscation,
    customDns,
    customDnsServers,
    mtu,
    setLanguage,
    setTheme,
    setStartup,
    setMinimizeToTray,
    setAutoConnect,
    setKillSwitch,
    setDnsLeakProtection,
    setDisableIpv6,
    setPreferredProtocol,
    setObfuscation,
    setCustomDns,
    setCustomDnsServers,
    setMtu,
  } = useSettingsStore();

  // Sync i18n with store
  useEffect(() => {
    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    children,
    danger,
  }: {
    icon: typeof Globe;
    title: string;
    description?: string;
    children: React.ReactNode;
    danger?: boolean;
  }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            danger ? "bg-red-500/20 text-red-500" : "bg-gray-800 text-gray-400"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className={cn("font-medium", danger ? "text-red-400" : "text-white")}>
            {title}
          </p>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-12 h-6 rounded-full transition-colors duration-200 relative",
        checked ? "bg-primary-500" : "bg-gray-700"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform duration-200",
          checked ? "left-6" : "left-0.5"
        )}
      />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t("settings.title")}</h1>
        <p className="text-gray-400 mt-1">Manage your application preferences</p>
      </div>

      {/* General Settings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-500" />
            {t("settings.general.title")}
          </h2>
        </div>

        <div className="px-6">
          {/* Language */}
          <SettingRow
            icon={Globe}
            title={t("settings.general.language")}
            description="Select your preferred language"
          >
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    language === lang.code
                      ? "bg-primary-500 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  )}
                >
                  {lang.flag} {lang.name}
                </button>
              ))}
            </div>
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* Theme */}
          <SettingRow
            icon={Sun}
            title={t("settings.general.theme.title")}
            description="Choose your preferred color scheme"
          >
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                    theme === t
                      ? "bg-primary-500 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* Launch on Startup */}
          <SettingRow
            icon={Power}
            title={t("settings.general.startup")}
            description="Start VPNht when your system boots"
          >
            <Toggle checked={startup} onChange={setStartup} />
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* Minimize to Tray */}
          <SettingRow
            icon={Monitor}
            title={t("settings.general.minimize")}
            description="Keep running in system tray when closed"
          >
            <Toggle checked={minimizeToTray} onChange={setMinimizeToTray} />
          </SettingRow>
        </div>
      </div>

      {/* Connection Settings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary-500" />
            {t("settings.connection.title")}
          </h2>
        </div>

        <div className="px-6">
          {/* Auto-connect */}
          <SettingRow
            icon={Power}
            title={t("settings.connection.autoConnect")}
            description="Automatically connect when app starts"
          >
            <Toggle checked={autoConnect} onChange={setAutoConnect} />
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* Kill Switch */}
          <SettingRow
            icon={AlertTriangle}
            title={t("settings.connection.killSwitch")}
            description={t("settings.connection.killSwitchDesc")}
          >
            <Toggle checked={killSwitch} onChange={setKillSwitch} />
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* DNS Leak Protection */}
          <SettingRow
            icon={Shield}
            title={t("settings.connection.dnsLeak")}
            description={t("settings.connection.dnsLeakDesc")}
          >
            <Toggle
              checked={dnsLeakProtection}
              onChange={setDnsLeakProtection}
            />
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* Disable IPv6 */}
          <SettingRow
            icon={Wifi}
            title={t("settings.connection.ipv6")}
            description="Block IPv6 traffic to prevent leaks"
          >
            <Toggle checked={disableIpv6} onChange={setDisableIpv6} />
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* Protocol Selection */}
          <SettingRow
            icon={Cpu}
            title={t("settings.connection.protocol")}
            description="Choose preferred VPN protocol"
          >
            <div className="flex gap-2">
              {(["wireguard", "openvpn_udp", "openvpn_tcp"] as const).map(
                (proto) => (
                  <button
                    key={proto}
                    onClick={() => setPreferredProtocol(proto)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      preferredProtocol === proto
                        ? "bg-primary-500 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    )}
                  >
                    {proto.replace("_", " ").toUpperCase()}
                  </button>
                )
              )}
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-primary-500" />
            {t("settings.advanced.title")}
          </h2>
        </div>

        <div className="px-6">
          {/* Obfuscation */}
          <SettingRow
            icon={Shield}
            title={t("settings.advanced.obfuscation")}
            description={t("settings.advanced.obfuscationDesc")}
          >
            <Toggle checked={obfuscation} onChange={setObfuscation} />
          </SettingRow>

          <div className="border-t border-gray-800" />

          {/* Custom DNS */}
          <SettingRow
            icon={Globe}
            title={t("settings.advanced.customDns")}
            description={t("settings.advanced.customDnsDesc")}
          >
            <Toggle checked={customDns} onChange={setCustomDns} />
          </SettingRow>

          {/* Custom DNS Servers Input */}
          {customDns && (
            <div className="pb-4 pl-14">
              <input
                type="text"
                value={customDnsServers.join(", ")}
                onChange={(e) =>
                  setCustomDnsServers(
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
                placeholder="8.8.8.8, 8.8.4.4"
                className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="border-t border-gray-800" />

          {/* MTU */}
          <SettingRow
            icon={Cpu}
            title={t("settings.advanced.mtu")}
            description="Maximum transmission unit size"
          >
            <input
              type="number"
              value={mtu}
              onChange={(e) => setMtu(parseInt(e.target.value) || 1420)}
              min={1280}
              max={1500}
              className="w-24 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </SettingRow>
        </div>
      </div>

      {/* Account */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-semibold text-white">Account</h2>
        </div>

        <div className="px-6 py-4">
          <button
            onClick={logout}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
