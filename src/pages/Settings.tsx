import { useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api";
import toast from "react-hot-toast";
import { Settings as SettingsIcon, Shield, Globe, Palette } from "lucide-react";

interface SettingsState {
  killSwitch: boolean;
  dnsLeakProtection: boolean;
  autoConnect: boolean;
  minimizeToTray: boolean;
  theme: "light" | "dark" | "system";
  language: string;
}

export function Settings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsState>({
    killSwitch: false,
    dnsLeakProtection: true,
    autoConnect: false,
    minimizeToTray: true,
    theme: "dark",
    language: "en",
  });

  const toggleKillSwitch = async (enabled: boolean) => {
    try {
      if (enabled) {
        await invoke("enable_killswitch");
        toast.success("Kill Switch enabled");
      } else {
        await invoke("disable_killswitch");
        toast.success("Kill Switch disabled");
      }
      setSettings({ ...settings, killSwitch: enabled });
    } catch (error) {
      toast.error("Failed to toggle Kill Switch");
      console.error(error);
    }
  };

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <SettingsIcon className="w-6 h-6" />
        {t("settings.title", "Settings")}
      </h1>

      {/* Security */}
      <section className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t("settings.security", "Security")}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">{t("settings.killSwitch", "Kill Switch")}</p>
            <p className="text-sm text-gray-400">
              {t("settings.killSwitchDesc", "Block traffic if VPN disconnects")}
            </p>
          </div>
          <button
            onClick={() => toggleKillSwitch(!settings.killSwitch)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.killSwitch ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.killSwitch ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">{t("settings.dnsLeak", "DNS Leak Protection")}</p>
            <p className="text-sm text-gray-400">
              {t("settings.dnsLeakDesc", "Prevent DNS queries from leaking")}
            </p>
          </div>
          <button
            onClick={() => updateSetting("dnsLeakProtection", !settings.dnsLeakProtection)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.dnsLeakProtection ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.dnsLeakProtection ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* General */}
      <section className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t("settings.general", "General")}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">{t("settings.autoConnect", "Auto-connect")}</p>
            <p className="text-sm text-gray-400">
              {t("settings.autoConnectDesc", "Connect automatically on startup")}
            </p>
          </div>
          <button
            onClick={() => updateSetting("autoConnect", !settings.autoConnect)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.autoConnect ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.autoConnect ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">{t("settings.minimizeToTray", "Minimize to tray")}</p>
            <p className="text-sm text-gray-400">
              {t("settings.minimizeToTrayDesc", "Keep running in system tray")}
            </p>
          </div>
          <button
            onClick={() => updateSetting("minimizeToTray", !settings.minimizeToTray)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.minimizeToTray ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.minimizeToTray ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t("settings.appearance", "Appearance")}
        </h2>

        <div>
          <p className="text-white mb-2">{t("settings.theme", "Theme")}</p>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => updateSetting("theme", theme)}
                className={`px-4 py-2 rounded-lg text-sm capitalize ${
                  settings.theme === theme
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {t(`settings.${theme}`, theme)}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
