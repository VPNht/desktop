import { invoke } from "@tauri-apps/api";
import type { Server, IPInfo, LatencyResult } from "@types";

/**
 * VPN API — delegates to Tauri backend IPC commands
 */
export async function fetchServers(): Promise<Server[]> {
  return invoke<Server[]>("fetch_servers");
}

export async function measureLatency(serverId: string): Promise<LatencyResult> {
  return invoke<LatencyResult>("measure_latency", { serverId });
}

export async function measureLatencies(serverIds: string[]): Promise<LatencyResult[]> {
  return invoke<LatencyResult[]>("measure_latencies", { serverIds });
}

export async function getIPInfo(): Promise<IPInfo> {
  return invoke<IPInfo>("get_ip_info");
}

export async function login(email: string, password: string) {
  return invoke<{ user: any; tokens: any }>("auth_login", { email, password });
}

export async function signup(email: string, password: string) {
  return invoke<{ user: any; tokens: any }>("auth_signup", { email, password });
}

export async function logout() {
  return invoke("auth_logout");
}