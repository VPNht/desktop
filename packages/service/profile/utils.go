package profile

import (
	"github.com/vpnht/desktop/packages/service/constants"
	"github.com/vpnht/desktop/packages/service/utils"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"sync"
	"time"
)

var (
	alphaNumRe  = regexp.MustCompile("[^a-zA-Z0-9]+")
	restartLock sync.Mutex
)

func getOpenvpnPath() (pth string) {
	if constants.Development {
		switch runtime.GOOS {
		case "windows":
			pth = filepath.Join(utils.GetRootDir(), "..", "..",
				"resources", "windows", "openvpn", "openvpn.exe")
		case "darwin":
			pth = filepath.Join(utils.GetRootDir(), "..", "..",
				"resources", "macos", "openvpn", "openvpn")
		case "linux":
			pth = "openvpn"
		default:
			panic("profile: Not implemented")
		}

		return
	}

	switch runtime.GOOS {
	case "windows":
		pth = filepath.Join(utils.GetRootDir(), "openvpn", "openvpn.exe")
	case "darwin":
		pth = filepath.Join(string(os.PathSeparator), "Applications",
			"VPN.ht.app", "Contents", "Resources", "vpnht-openvpn")
	case "linux":
		pth = "openvpn"
	default:
		panic("profile: Not implemented")
	}

	return
}

func getOpenvpnDir() (pth string) {
	if constants.Development {
		switch runtime.GOOS {
		case "windows":
			pth = filepath.Join(utils.GetRootDir(), "..", "openvpn_win")
		case "darwin":
			pth = ""
		case "linux":
			pth = ""
		default:
			panic("profile: Not implemented")
		}

		return
	}

	switch runtime.GOOS {
	case "windows":
		pth = filepath.Join(utils.GetRootDir(), "openvpn")
	case "darwin":
		pth = ""
	case "linux":
		pth = ""
	default:
		panic("profile: Not implemented")
	}

	return
}

func GetStatus() (status bool) {
	for _, prfl := range GetProfiles() {
		if prfl.Status == "connected" {
			status = true
		}
	}

	return
}

func GetProfile(id string) (prfl *Profile) {
	Profiles.RLock()
	prfl = Profiles.m[id]
	Profiles.RUnlock()
	return
}

func GetProfiles() (prfls map[string]*Profile) {
	prfls = map[string]*Profile{}

	Profiles.RLock()
	for _, prfl := range Profiles.m {
		prfls[prfl.Id] = prfl
	}
	Profiles.RUnlock()

	return
}

func RestartProfiles(resetNet bool) (err error) {
	restartLock.Lock()
	defer restartLock.Unlock()

	prfls := GetProfiles()
	prfls2 := map[string]*Profile{}

	for _, prfl := range prfls {
		prfl2 := prfl.Copy()
		prfls2[prfl2.Id] = prfl2

		err = prfl.Stop()
		if err != nil {
			return
		}
	}

	for _, prfl := range prfls {
		prfl.Wait()
	}

	time.Sleep(resetWait)

	if resetNet {
		utils.ResetNetworking()
		time.Sleep(netResetWait)
	}

	for _, prfl := range prfls2 {
		if prfl.Reconnect {
			err = prfl.Start(false)
			if err != nil {
				return
			}
		}
	}

	return
}

func FilterStr(input string) string {
	return string(alphaNumRe.ReplaceAll([]byte(input), []byte("")))
}
