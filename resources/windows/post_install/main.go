package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
)

func main() {
	wait := &sync.WaitGroup{}

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
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "openvpn.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"stop", "vpnht")
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
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "openvpn.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()

	wait.Add(1)
	go func() {
		defer wait.Done()

		cmd := exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"uninstall")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"install")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"install")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"install")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"install")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"install")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"install")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
		cmd = exec.Command(filepath.Join(rootDir, "tuntap", "tuntap.exe"),
			"install")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
	}()

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
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "VPNht.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command("taskkill.exe", "/F", "/IM", "vpnht-service.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"), "install",
		"vpnht", filepath.Join(rootDir, "vpnht-service.exe"))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command("sc.exe", "config", "vpnht",
		fmt.Sprintf(`binPath="%s"`, filepath.Join(rootDir, "nssm.exe")))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"set", "vpnht", "DisplayName", "VPN.ht Service")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"set", "vpnht", "Start", "SERVICE_AUTO_START")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"set", "vpnht", "AppStdout",
		"C:\\ProgramData\\VPNht\\service.log")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"set", "vpnht", "AppStderr",
		"C:\\ProgramData\\VPNht\\service.log")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"set", "vpnht", "Start", "SERVICE_AUTO_START")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
	cmd = exec.Command(filepath.Join(rootDir, "nssm.exe"),
		"start", "vpnht")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()

	wait.Wait()
}
