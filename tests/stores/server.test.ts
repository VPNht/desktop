import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useServerStore } from "../../src/stores";

// Mock @tauri-apps/api before importing store
vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Server Store", () => {
  beforeEach(() => {
    // Reset the store before each test
    useServerStore.getState().reset();
  });

  it("should initialize with empty servers", () => {
    const { result } = renderHook(() => useServerStore());
    expect(result.current.servers).toEqual([]);
  });

  it("should set servers with setServers", () => {
    const { result } = renderHook(() => useServerStore());
    const testServers = [
      { id: "us-nyc", name: "New York", region: "US", load: 10 },
      { id: "uk-lon", name: "London", region: "UK", load: 20 },
    ];
    
    act(() => {
      result.current.setServers(testServers);
    });
    
    expect(result.current.servers).toEqual(testServers);
  });

  it("should add a favorite with addFavorite", () => {
    const { result } = renderHook(() => useServerStore());
    const testServer = { id: "us-nyc", name: "New York", region: "US", load: 10 };
    
    act(() => {
      result.current.setServers([testServer]);
      result.current.addFavorite("us-nyc");
    });
    
    expect(result.current.favorites).toContain("us-nyc");
  });

  it("should remove a favorite with removeFavorite", () => {
    const { result } = renderHook(() => useServerStore());
    const testServer = { id: "us-nyc", name: "New York", region: "US", load: 10 };
    
    act(() => {
      result.current.setServers([testServer]);
      result.current.addFavorite("us-nyc");
      result.current.removeFavorite("us-nyc");
    });
    
    expect(result.current.favorites).not.toContain("us-nyc");
  });

  it("should toggle a favorite with toggleFavorite", () => {
    const { result } = renderHook(() => useServerStore());
    const testServer = { id: "us-nyc", name: "New York", region: "US", load: 10 };
    
    act(() => {
      result.current.setServers([testServer]);
      result.current.toggleFavorite("us-nyc");
    });
    
    expect(result.current.favorites).toContain("us-nyc");
    
    act(() => {
      result.current.toggleFavorite("us-nyc");
    });
    
    expect(result.current.favorites).not.toContain("us-nyc");
  });

  it("should set search query with setSearchQuery", () => {
    const { result } = renderHook(() => useServerStore());
    
    act(() => {
      result.current.setSearchQuery("New York");
    });
    
    expect(result.current.searchQuery).toBe("New York");
  });

  it("should set selected region with setSelectedRegion", () => {
    const { result } = renderHook(() => useServerStore());
    
    act(() => {
      result.current.setSelectedRegion("US");
    });
    
    expect(result.current.selectedRegion).toBe("US");
  });

  it("should call invoke and set servers on fetchServers", async () => {
    const { result } = renderHook(() => useServerStore());
    const { invoke } = await import("@tauri-apps/api");
    const testServers = [
      { id: "us-nyc", name: "New York", region: "US", load: 10 },
    ];
    
    vi.mocked(invoke).mockResolvedValue(testServers);
    
    await act(async () => {
      await result.current.fetchServers();
    });
    
    expect(invoke).toHaveBeenCalledWith("get_servers");
    expect(result.current.servers).toEqual(testServers);
  });
});