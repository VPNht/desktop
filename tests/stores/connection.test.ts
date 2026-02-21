import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useConnectionStore } from "../../src/stores";

vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Connection Store", () => {
  beforeEach(() => {
    useConnectionStore.setState({
      status: "disconnected",
      server: undefined,
      connectedAt: undefined,
      bytesReceived: 0,
      bytesSent: 0,
      error: undefined,
      ipInfo: undefined,
    });
    vi.clearAllMocks();
  });

  it("should initialize disconnected", () => {
    expect(useConnectionStore.getState().status).toBe("disconnected");
  });

  it("should set status", () => {
    act(() => { useConnectionStore.getState().setStatus("connected"); });
    expect(useConnectionStore.getState().status).toBe("connected");
  });

  it("should connect successfully", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockResolvedValue(undefined);

    await act(async () => {
      await useConnectionStore.getState().connect({ id: "us-nyc" } as any);
    });

    expect(useConnectionStore.getState().status).toBe("connected");
    expect(invoke).toHaveBeenCalledWith("vpn_connect", { serverId: "us-nyc" });
  });

  it("should handle connect failure", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockRejectedValue(new Error("Connection failed"));

    try {
      await act(async () => {
        await useConnectionStore.getState().connect({ id: "us-nyc" } as any);
      });
    } catch { /* expected */ }

    expect(useConnectionStore.getState().status).toBe("error");
    expect(useConnectionStore.getState().error).toBe("Connection failed");
  });

  it("should disconnect", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockResolvedValue(undefined);

    act(() => { useConnectionStore.getState().setStatus("connected"); });

    await act(async () => {
      await useConnectionStore.getState().disconnect();
    });

    expect(useConnectionStore.getState().status).toBe("disconnected");
  });

  it("should update stats", () => {
    act(() => { useConnectionStore.getState().updateStats(1024, 2048); });
    expect(useConnectionStore.getState().bytesReceived).toBe(1024);
    expect(useConnectionStore.getState().bytesSent).toBe(2048);
  });

  it("should set error", () => {
    act(() => { useConnectionStore.getState().setError("Test error"); });
    expect(useConnectionStore.getState().error).toBe("Test error");
    expect(useConnectionStore.getState().status).toBe("error");
  });

  it("should not connect when already connecting", async () => {
    const { invoke } = await import("@tauri-apps/api");
    act(() => { useConnectionStore.getState().setStatus("connecting"); });

    await act(async () => {
      await useConnectionStore.getState().connect({ id: "us-nyc" } as any);
    });

    // Should silently return — invoke not called
    expect(invoke).not.toHaveBeenCalled();
  });

  it("should not disconnect when already disconnected", async () => {
    const { invoke } = await import("@tauri-apps/api");

    await act(async () => {
      await useConnectionStore.getState().disconnect();
    });

    expect(invoke).not.toHaveBeenCalled();
  });
});
