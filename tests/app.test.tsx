import { describe, it, expect, vi } from "vitest";

// Mock all Tauri APIs
vi.mock("@tauri-apps/api", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

describe("App", () => {
  it("should export App component", async () => {
    const App = (await import("../src/App")).default;
    expect(App).toBeDefined();
  });
});