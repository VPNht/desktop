import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "../../src/stores";

vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

describe("Auth Store", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("should initialize with user null and not authenticated", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should update user state with setUser", () => {
    const { result } = renderHook(() => useAuthStore());
    const testUser = { id: "1", email: "test@example.com", subscription: { plan: "free", expires_at: "2099-01-01", is_active: true }, preferences: {} } as any;

    act(() => {
      result.current.setUser(testUser);
    });

    expect(result.current.user).toEqual(testUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should update tokens with setTokens", () => {
    const { result } = renderHook(() => useAuthStore());
    const testTokens = { access_token: "token123", refresh_token: "refresh123", expires_at: 9999999999 } as any;

    act(() => {
      result.current.setTokens(testTokens);
    });

    expect(result.current.tokens).toEqual(testTokens);
  });

  it("should clear state on logout", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setUser({ id: "1", email: "t@t.com" } as any);
      result.current.setTokens({ access_token: "x" } as any);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.tokens).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should call invoke on login and update state", async () => {
    const { invoke } = await import("@tauri-apps/api");
    const testUser = { id: "1", email: "test@example.com" };
    const testTokens = { access_token: "tok", refresh_token: "ref", expires_at: 9999 };

    vi.mocked(invoke).mockResolvedValue({ user: testUser, tokens: testTokens });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login("test@example.com", "password123!");
    });

    expect(invoke).toHaveBeenCalledWith("auth_login", {
      email: "test@example.com",
      password: "password123!",
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should handle login errors", async () => {
    const { invoke } = await import("@tauri-apps/api");
    vi.mocked(invoke).mockRejectedValue(new Error("Invalid credentials"));

    const { result } = renderHook(() => useAuthStore());

    try {
      await act(async () => {
        await result.current.login("test@example.com", "wrongpassword");
      });
    } catch {
      // expected
    }

    expect(result.current.isLoading).toBe(false);
  });

  it("should toggle loading state", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });
    expect(result.current.isLoading).toBe(false);
  });
});
