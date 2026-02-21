import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useAuthStore } from "../../src/stores";

vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Auth Store", () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().logout();
    });
    vi.clearAllMocks();
  });

  it("should initialize with null user and not authenticated", () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it("should update user with setUser", () => {
    act(() => {
      useAuthStore.getState().setUser({ id: "1", email: "t@t.com" } as any);
    });
    expect(useAuthStore.getState().user?.email).toBe("t@t.com");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("should update tokens with setTokens", () => {
    act(() => {
      useAuthStore.getState().setTokens({ access_token: "abc" } as any);
    });
    expect(useAuthStore.getState().tokens?.access_token).toBe("abc");
  });

  it("should clear state on logout", () => {
    act(() => {
      useAuthStore.getState().setUser({ id: "1", email: "t@t.com" } as any);
      useAuthStore.getState().setTokens({ access_token: "abc" } as any);
    });
    act(() => {
      useAuthStore.getState().logout();
    });
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.tokens).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it("should call invoke on login", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockResolvedValue({
      user: { id: "1", email: "t@t.com" },
      tokens: { access_token: "tok", refresh_token: "ref", expires_at: 9999 },
    });

    await act(async () => {
      await useAuthStore.getState().login("t@t.com", "password123!");
    });

    expect(invoke).toHaveBeenCalledWith("auth_login", {
      email: "t@t.com",
      password: "password123!",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("should handle login error", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockRejectedValue(new Error("bad"));

    try {
      await act(async () => {
        await useAuthStore.getState().login("t@t.com", "wrong");
      });
    } catch {
      // expected
    }

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("should toggle loading", () => {
    act(() => {
      useAuthStore.getState().setLoading(true);
    });
    expect(useAuthStore.getState().isLoading).toBe(true);

    act(() => {
      useAuthStore.getState().setLoading(false);
    });
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
