import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectionStore } from "../../src/stores";

vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

const mockServer = {
  id: "us-nyc",
  name: "New York",
  country: "United States",
  countryCode: "US",
  city: "New York",
  lat: 40.71,
  lng: -74.0,
  hostname: "us-nyc.vpnht.com",
  ip: "1.2.3.4",
  port: 443,
  publicKey: "key",
  supportedProtocols: ["wireguard"] as any,
  features: ["p2p"] as any,
  latency: 25,
  load: 50,
  isPremium: false,
};

describe("Connection Store", () => {
  beforeEach(() => {
    // Reset store state directly
    useConnectionStore.setState({
      status: "disconnected",
      server: undefined,
      connectedAt: undefined,
      bytesReceived: 0,
      bytesSent: 0,
      error: undefined,
      ipInfo: undefined,
    });
  });

  it("should initialize with disconnected status", () => {
    const { result } = renderHook(() => useConnectionStore());
    expect(result.current.status).toBe("disconnected");
  });

  it("should change status with setStatus", () => {
    const { result } = renderHook(() => useConnectionStore());
    act(() => {
      result.current.setStatus("connected");
    });
    expect(result.current.status).toBe("connected");
  });

  it("should connect successfully", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConnectionStore());

    await act(async () => {
      await result.current.connect(mockServer);
    });

    expect(result.current.status).toBe("connected");
    expect(invoke).toHaveBeenCalledWith("vpn_connect", { serverId: "us-nyc" });
  });

  it("should handle connect failure", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockRejectedValue(new Error("Connection failed"));

    const { result } = renderHook(() => useConnectionStore());

    try {
      await act(async () => {
        await result.current.connect(mockServer);
      });
    } catch {
      // expected
    }

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Connection failed");
  });

  it("should disconnect successfully", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConnectionStore());

    // First set to connected
    act(() => {
      result.current.setStatus("connected");
    });

    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.status).toBe("disconnected");
  });

  it("should update stats", () => {
    const { result } = renderHook(() => useConnectionStore());

    act(() => {
      result.current.updateStats(1024, 2048);
    });

    expect(result.current.bytesReceived).toBe(1024);
    expect(result.current.bytesSent).toBe(2048);
  });

  it("should set error", () => {
    const { result } = renderHook(() => useConnectionStore());

    act(() => {
      result.current.setError("Test error");
    });

    expect(result.current.error).toBe("Test error");
    expect(result.current.status).toBe("error");
  });

  it("should not connect when already connecting", async () => {
    const { result } = renderHook(() => useConnectionStore());

    act(() => {
      result.current.setStatus("connecting");
    });

    // Should silently return
    await act(async () => {
      await result.current.connect(mockServer);
    });

    // Status unchanged
    expect(result.current.status).toBe("connecting");
  });

  it("should not disconnect when already disconnected", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockClear();

    const { result } = renderHook(() => useConnectionStore());

    await act(async () => {
      await result.current.disconnect();
    });

    // Should not call invoke
    expect(invoke).not.toHaveBeenCalled();
  });
});
