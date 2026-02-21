import { invoke } from "@tauri-apps/api/tauri";

export async function enableKillSwitch() {
  try {
    await invoke("enable_killswitch");
    console.log("Kill Switch enabled");
  } catch (error) {
    console.error("Failed to enable Kill Switch:", error);
  }
}

export async function disableKillSwitch() {
  try {
    await invoke("disable_killswitch");
    console.log("Kill Switch disabled");
  } catch (error) {
    console.error("Failed to disable Kill Switch:", error);
  }
}