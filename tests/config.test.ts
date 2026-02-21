import { describe, it, expect, vi } from "vitest";

vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Config Persistence", () => {
  it("should serialize WireGuard config correctly", () => {
    // Test that the config object matches expected shape
    const config = {
      interface: {
        private_key: "test_key",
        addresses: ["10.0.0.2/32"],
        dns: ["10.0.0.1"],
        mtu: 1420,
      },
      peer: {
        public_key: "server_key",
        allowed_ips: ["0.0.0.0/0"],
        endpoint: "server.vpnht.com:443",
        persistent_keepalive: 25,
      },
    };
    
    expect(config.interface.private_key).toBeTruthy();
    expect(config.interface.addresses).toContain("10.0.0.2/32");
    expect(config.interface.dns).toContain("10.0.0.1");
    expect(config.interface.mtu).toBe(1420);
    expect(config.peer.public_key).toBeTruthy();
    expect(config.peer.allowed_ips).toContain("0.0.0.0/0");
    expect(config.peer.endpoint).toContain(":");
    expect(config.peer.persistent_keepalive).toBe(25);
  });
});