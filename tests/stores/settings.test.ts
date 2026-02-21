import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsStore } from "../../src/stores";

// Mock @tauri-apps/api before importing store
vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Settings Store", () => {
  beforeEach(() => {
    // Reset the store before each test
    useSettingsStore.getState().reset();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useSettingsStore());
    expect(result.current.language).toBe("en");
    expect(result.current.theme).toBe("system");
    expect(result.current.autoConnect).toBe(false);
    expect(result.current.killSwitch).toBe(false);
    expect(result.current.protocol).toBe("wireguard");
    expect(result.current.minimizeToTray).toBe(false);
    expect(result.current.startOnBoot).toBe(false);
  });

  it("should update language with setLanguage", () => {
    const { result } = renderHook(() => useSettingsStore());
    
    act(() => {
      result.current.setLanguage("fr");
    });
    
    expect(result.current.language).toBe("fr");
  });

  it("should update theme with setTheme", () => {
    const { result } = renderHook(() => useSettingsStore());
    
    act(() => {
      result.current.setTheme("dark");
    });
    
    expect(result.current.theme).toBe("dark");
  });

  it("should update autoConnect with setAutoConnect", () => {
    const { result } = renderHook(() => useSettingsStore());
    
    act(() => {
      result.current.setAutoConnect(true);
    });
    
    expect(result.current.autoConnect).toBe(true);
  });

  it("should update killSwitch with setKillSwitch", () => {
    const { result } = renderHook(() => useSettingsStore());
    
    act(() => {
      result.current.setKillSwitch(true);
    });
    
    expect(result.current.killSwitch).toBe(true);
  });

  it("should update protocol with setProtocol", () => {
    const { result } = renderHook(() => useSettingsStore());
    
    act(() => {
      result.current.setProtocol("openvpn");
    });
    
    expect(result.current.protocol).toBe("openvpn");
  });

  it("should update minimizeToTray with setMinimizeToTray", () => {
    const { result } = renderHook(() => useSettingsStore());
    
    act(() => {
      result.current.setMinimizeToTray(true);
    });
    
    expect(result.current.minimizeToTray).toBe(true);
  });

  it("should update startOnBoot with setStartOnBoot", () => {
    const { result } = renderHook(() => useSettingsStore());
    
    act(() => {
      result.current.setStartOnBoot(true);
    });
    
    expect(result.current.startOnBoot).toBe(true);
  });
});