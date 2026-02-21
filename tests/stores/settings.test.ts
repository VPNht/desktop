import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useSettingsStore } from "../../src/stores";

// Mock @tauri-apps/api before importing store
vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Settings Store", () => {
  beforeEach(() => {
    // Reset the store before each test
    const { setLanguage, setTheme, setAutoConnect, setKillSwitch, setMinimizeToTray, setStartup, setPreferredProtocol } = useSettingsStore.getState();
    act(() => {
      setLanguage("en");
      setTheme("system");
      setAutoConnect(false);
      setKillSwitch(false);
      setMinimizeToTray(false);
      setStartup(false);
      setPreferredProtocol("wireguard");
    });
  });

  it("should initialize with default values", () => {
    const state = useSettingsStore.getState();
    expect(state.language).toBe("en");
    expect(state.theme).toBe("system");
    expect(state.autoConnect).toBe(false);
    expect(state.killSwitch).toBe(false);
    expect(state.minimizeToTray).toBe(false);
    expect(state.startup).toBe(false);
    expect(state.preferredProtocol).toBe("wireguard");
  });

  it("should update language with setLanguage", () => {
    act(() => {
      useSettingsStore.getState().setLanguage("fr");
    });
    
    const state = useSettingsStore.getState();
    expect(state.language).toBe("fr");
  });

  it("should update theme with setTheme", () => {
    act(() => {
      useSettingsStore.getState().setTheme("dark");
    });
    
    const state = useSettingsStore.getState();
    expect(state.theme).toBe("dark");
  });

  it("should update autoConnect with setAutoConnect", () => {
    act(() => {
      useSettingsStore.getState().setAutoConnect(true);
    });
    
    const state = useSettingsStore.getState();
    expect(state.autoConnect).toBe(true);
  });

  it("should update killSwitch with setKillSwitch", () => {
    act(() => {
      useSettingsStore.getState().setKillSwitch(true);
    });
    
    const state = useSettingsStore.getState();
    expect(state.killSwitch).toBe(true);
  });

  it("should update protocol with setPreferredProtocol", () => {
    act(() => {
      useSettingsStore.getState().setPreferredProtocol("openvpn_udp");
    });
    
    const state = useSettingsStore.getState();
    expect(state.preferredProtocol).toBe("openvpn_udp");
  });

  it("should update minimizeToTray with setMinimizeToTray", () => {
    act(() => {
      useSettingsStore.getState().setMinimizeToTray(true);
    });
    
    const state = useSettingsStore.getState();
    expect(state.minimizeToTray).toBe(true);
  });

  it("should update startup with setStartup", () => {
    act(() => {
      useSettingsStore.getState().setStartup(true);
    });
    
    const state = useSettingsStore.getState();
    expect(state.startup).toBe(true);
  });
});