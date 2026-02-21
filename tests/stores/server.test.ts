import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useServerStore } from "../../src/stores";

// Mock @tauri-apps/api before importing store
vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Server Store", () => {
  beforeEach(() => {
    // Reset the store before each test
    const { setServers, setSearchQuery, setSelectedRegion } = useServerStore.getState();
    act(() => {
      setServers([]);
      setSearchQuery("");
      setSelectedRegion(null);
    });
  });

  it("should initialize with empty servers", () => {
    const state = useServerStore.getState();
    expect(state.servers).toEqual([]);
  });

  it("should set servers with setServers", () => {
    const testServers = [
      { id: "us-nyc", name: "New York", region: "US", load: 10 },
      { id: "uk-lon", name: "London", region: "UK", load: 20 },
    ];
    
    act(() => {
      useServerStore.getState().setServers(testServers);
    });
    
    const state = useServerStore.getState();
    expect(state.servers).toEqual(testServers);
  });

  it("should add a favorite with addFavorite", () => {
    const testServer = { id: "us-nyc", name: "New York", region: "US", load: 10 };
    
    act(() => {
      useServerStore.getState().setServers([testServer]);
      useServerStore.getState().addFavorite("us-nyc");
    });
    
    const state = useServerStore.getState();
    expect(state.favorites).toContain("us-nyc");
  });

  it("should remove a favorite with removeFavorite", () => {
    const testServer = { id: "us-nyc", name: "New York", region: "US", load: 10 };
    
    act(() => {
      useServerStore.getState().setServers([testServer]);
      useServerStore.getState().addFavorite("us-nyc");
      useServerStore.getState().removeFavorite("us-nyc");
    });
    
    const state = useServerStore.getState();
    expect(state.favorites).not.toContain("us-nyc");
  });

  it("should toggle a favorite with toggleFavorite", () => {
    const testServer = { id: "us-nyc", name: "New York", region: "US", load: 10 };
    
    act(() => {
      useServerStore.getState().setServers([testServer]);
      useServerStore.getState().toggleFavorite("us-nyc");
    });
    
    const state = useServerStore.getState();
    expect(state.favorites).toContain("us-nyc");
    
    act(() => {
      useServerStore.getState().toggleFavorite("us-nyc");
    });
    
    expect(useServerStore.getState().favorites).not.toContain("us-nyc");
  });

  it("should set search query with setSearchQuery", () => {
    act(() => {
      useServerStore.getState().setSearchQuery("New York");
    });
    
    const state = useServerStore.getState();
    expect(state.searchQuery).toBe("New York");
  });

  it("should set selected region with setSelectedRegion", () => {
    act(() => {
      useServerStore.getState().setSelectedRegion("US");
    });
    
    const state = useServerStore.getState();
    expect(state.selectedRegion).toBe("US");
  });

  it("should call invoke and set servers on fetchServers", async () => {
    const { invoke } = await import("@tauri-apps/api");
    const testServers = [
      { id: "us-nyc", name: "New York", region: "US", load: 10 },
    ];
    
    vi.mocked(invoke).mockResolvedValue(testServers);
    
    await act(async () => {
      await useServerStore.getState().fetchServers();
    });
    
    expect(invoke).toHaveBeenCalledWith("fetch_servers");
    const state = useServerStore.getState();
    expect(state.servers).toEqual(testServers);
  });
});