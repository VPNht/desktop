import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useServerStore } from "../../src/stores";

vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Server Store", () => {
  beforeEach(() => {
    useServerStore.setState({
      servers: [],
      favorites: [],
      selectedRegion: null,
      searchQuery: "",
      isLoading: false,
      latencyMap: new Map(),
      lastUpdated: null,
    });
  });

  it("should initialize with empty servers", () => {
    const { result } = renderHook(() => useServerStore());
    expect(result.current.servers).toEqual([]);
  });

  it("should set servers", () => {
    const { result } = renderHook(() => useServerStore());
    const servers = [{ id: "us-nyc", name: "New York" }] as any;

    act(() => {
      result.current.setServers(servers);
    });

    expect(result.current.servers).toHaveLength(1);
    expect(result.current.servers[0].id).toBe("us-nyc");
  });

  it("should add and remove favorites", () => {
    const { result } = renderHook(() => useServerStore());

    act(() => {
      result.current.addFavorite("us-nyc");
    });
    expect(result.current.favorites).toContain("us-nyc");

    act(() => {
      result.current.removeFavorite("us-nyc");
    });
    expect(result.current.favorites).not.toContain("us-nyc");
  });

  it("should toggle favorites", () => {
    const { result } = renderHook(() => useServerStore());

    act(() => {
      result.current.toggleFavorite("us-nyc");
    });
    expect(result.current.favorites).toContain("us-nyc");

    act(() => {
      result.current.toggleFavorite("us-nyc");
    });
    expect(result.current.favorites).not.toContain("us-nyc");
  });

  it("should set search query", () => {
    const { result } = renderHook(() => useServerStore());

    act(() => {
      result.current.setSearchQuery("New York");
    });
    expect(result.current.searchQuery).toBe("New York");
  });

  it("should set selected region", () => {
    const { result } = renderHook(() => useServerStore());

    act(() => {
      result.current.setSelectedRegion("US");
    });
    expect(result.current.selectedRegion).toBe("US");
  });

  it("should fetch servers via invoke", async () => {
    const { invoke } = await import("@tauri-apps/api");
    const servers = [{ id: "us-nyc", name: "New York" }];
    vi.mocked(invoke).mockResolvedValue(servers);

    const { result } = renderHook(() => useServerStore());

    await act(async () => {
      await result.current.fetchServers();
    });

    expect(invoke).toHaveBeenCalledWith("fetch_servers");
    expect(result.current.servers).toHaveLength(1);
  });
});
