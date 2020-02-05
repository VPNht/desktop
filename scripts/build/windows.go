package main

import (
	"os"
	"os/exec"
	"path/filepath"
)

const signtool = "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.18362.0\\x64\\signtool.exe"

func main() {

	// CLEANUP
	err := os.Remove(filepath.Join("resources", "windows", "openvpn",
		"openvpn-install-2.4.6-I602.exe"))
	if err != nil && !os.IsNotExist(err) {
		panic(err)
	}

	err = os.Remove(filepath.Join("resources", "windows", "openvpn",
		"openvpn-install-2.4.6-I602.exe.asc"))
	if err != nil && !os.IsNotExist(err) {
		panic(err)
	}

	err = os.Remove(filepath.Join("build", "win", "VPNht.exe"))
	if err != nil && !os.IsNotExist(err) {
		panic(err)
	}

	err = os.RemoveAll(filepath.Join("build", "win"))
	if err != nil && !os.IsNotExist(err) {
		panic(err)
	}

	// TUNTAP

	err = os.Chdir("resources/windows/tuntap")
	if err != nil {
		panic(err)
	}

	cmd := exec.Command("go", "build", "-v", "-o", "tuntap.exe")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}


	// SERVICE
	err = os.Chdir("../../../packages/service")
	if err != nil {
		panic(err)
	}

	cmd = exec.Command("go", "get", "-u")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	cmd = exec.Command("go", "build", "-o", "../../build/win/vpnht-service.exe", "-v", "-ldflags", "-H windowsgui")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	// CLIENT
	err = os.Chdir("../client")
	if err != nil {
		panic(err)
	}

	cmd = exec.Command("yarn")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	cmd = exec.Command("yarn", "dist")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	cmd = exec.Command(".\\node_modules\\.bin\\electron-rebuild")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	cmd = exec.Command(
		".\\node_modules\\.bin\\electron-packager",
		".\\target",
		"VPNht",
		"--platform=win32",
		"--arch=x64",
		"--icon=target\\static\\vpnht.ico",
		"--out=..\\..\\build\\win",
		"--prune",
		"--asar",
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	err = os.Chdir(filepath.Join("..", "..", "build", "win",
		"VPNht-win32-x64"))
	if err != nil {
		panic(err)
	}

	err = os.Chdir(filepath.Join("..", "..", "..",
		"resources", "windows", "post_install"))
	if err != nil {
		panic(err)
	}

	cmd = exec.Command("go", "build", "-o", "../../../build/win/post_install.exe", "-v")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	err = os.Chdir(filepath.Join("..", "pre_uninstall"))
	if err != nil {
		panic(err)
	}

	cmd = exec.Command("go", "build", "-o", "../../../build/win/pre_uninstall.exe", "-v")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}

	err = os.Chdir(filepath.Join(".."))
	if err != nil {
		panic(err)
	}

	cmd = exec.Command("C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
		"setup.iss")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}
}
