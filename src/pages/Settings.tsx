  const toggleKillSwitch = async (enabled: boolean) => {
    try {
      if (enabled) {
        await enableKillSwitch();
        toast.success("Kill Switch enabled");
      } else {
        await disableKillSwitch();
        toast.success("Kill Switch disabled");
      }
      setSettings({ ...settings, killSwitch: enabled });
    } catch (error) {
      toast.error("Failed to toggle Kill Switch");
      console.error(error);
    }
  };