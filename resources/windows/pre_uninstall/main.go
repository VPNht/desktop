package main

import (
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	rootDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		panic(err)
	}

	cmd := exec.Command("taskkill.exe", "/F", "/IM", "VPNht.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "vpnht-service.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"stop", "vpnht")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"remove", "vpnht", "confirm")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"stop", "vpnht")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "openvpn.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
		"uninstall")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "VPNht.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "vpnht-service.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
		"uninstall")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
}
