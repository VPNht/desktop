import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}));

describe("VPN Connection Flow", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("should call vpn_connect with server ID", async () => {
    mockInvoke.mockResolvedValue(undefined);
    const { invoke } = await import("@tauri-apps/api");
    await invoke("vpn_connect", { serverId: "us-nyc" });
    expect(mockInvoke).toHaveBeenCalledWith("vpn_connect", { serverId: "us-nyc" });
  });

  it("should call vpn_disconnect", async () => {
    mockInvoke.mockResolvedValue(undefined);
    const { invoke } = await import("@tauri-apps/api");
    await invoke("vpn_disconnect");
    expect(mockInvoke).toHaveBeenCalledWith("vpn_disconnect");
  });

  it("should call get_connection_status", async () => {
    mockInvoke.mockResolvedValue({ status: "connected", server_id: "us-nyc" });
    const { invoke } = await import("@tauri-apps/api");
    const status = await invoke("get_connection_status");
    expect(status).toEqual({ status: "connected", server_id: "us-nyc" });
  });

  it("should handle connection errors", async () => {
    mockInvoke.mockRejectedValue(new Error("Connection refused"));
    const { invoke } = await import("@tauri-apps/api");
    await expect(invoke("vpn_connect", { serverId: "bad-server" })).rejects.toThrow("Connection refused");
  });
});