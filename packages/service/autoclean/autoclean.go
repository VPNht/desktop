// For OS X to detect removal of VPN.ht.app and auto uninstall all files.
package autoclean

import (
	"github.com/sirupsen/logrus"
	"github.com/dropbox/godropbox/errors"
	"github.com/vpnht/desktop/packages/service/command"
	"github.com/vpnht/desktop/packages/service/utils"
	"os"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"time"
)

const (
	pathSep = string(os.PathSeparator)
)

func clean() (err error) {
	command.Command("kextunload", "-b", "net.sf.tuntaposx.tap").Run()
	command.Command("kextunload", "-b", "net.sf.tuntaposx.tun").Run()

	paths := []string{
		filepath.Join(pathSep, "private", "var", "db", "receipts",
			"ht.vpn.pkg.VPN.ht.bom"),
		filepath.Join(pathSep, "private", "var", "db", "receipts",
			"ht.vpn.pkg.VPN.ht.plist"),
		filepath.Join(pathSep, "Library", "LaunchAgents",
			"ht.vpn.client.plist"),
		filepath.Join(pathSep, "Library", "LaunchDaemons",
			"ht.vpn.service.plist"),
	}

	for _, path := range paths {
		err = os.RemoveAll(path)
		if err != nil {
			err = &RemoveError{
				errors.Wrap(err, "autoclean: Failed to remove file"),
			}
		}
	}

	return
}

// Check for VPN.ht.app and uninstall if missing
func CheckAndClean() (err error) {
	root := utils.GetRootDir()
	if runtime.GOOS != "darwin" ||
		root != "/Applications/VPN.ht.app/Contents/Resources" {

		return
	}

	path := filepath.Join(pathSep, "Applications", "VPN.ht.app")
	if _, e := os.Stat(path); !os.IsNotExist(e) {
		return
	}

	err = clean()
	if err != nil {
		return
	}

	os.Exit(0)

	return
}

// Watch for VPN.ht.app removal for next 10 minutes and uninstall if missing
func CheckAndCleanWatch() {
	root := utils.GetRootDir()
	if runtime.GOOS != "darwin" ||
		root != "/Applications/VPN.ht.app/Contents/Resources" {

		return
	}

	go func() {
		defer func() {
			panc := recover()
			if panc != nil {
				logrus.WithFields(logrus.Fields{
					"stack": string(debug.Stack()),
					"panic": panc,
				}).Error("autoclean: Panic")
				panic(panc)
			}
		}()

		for i := 0; i < 30; i++ {
			time.Sleep(10 * time.Second)

			err := CheckAndClean()
			if err != nil {
				logrus.WithFields(logrus.Fields{
					"error": err,
				}).Error("autoclean: Failed to run check and clean")
				return
			}
		}
	}()
}
