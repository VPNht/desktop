package servers

import (
	"encoding/json"
	"io/ioutil"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/tatsushid/go-fastping"
	"github.com/vpnht/desktop/packages/service/event"
	"github.com/vpnht/desktop/packages/service/profile"
)

type Server struct {
	Online      bool          `json:"online"`
	Host        string        `json:"host"`
	IP          string        `json:"ip"`
	Country     string        `json:"country"`
	CountryName string        `json:"countryName"`
	Distance    float64       `json:"distance"`
	Latitude    float64       `json:"latitude"`
	Longitude   float64       `json:"longitude"`
	City        string        `json:"city"`
	Region      string        `json:"regionName"`
	SpeedTest   string        `json:"speedtest"`
	AvgPing     time.Duration `json:"avgPing"`
	Updated     time.Time
}

var (
	Servers = struct {
		sync.RWMutex
		m map[string]*Server
	}{
		m: map[string]*Server{},
	}
)

func GetServers() (servers map[string]*Server) {
	servers = map[string]*Server{}

	Servers.RLock()
	for _, srv := range Servers.m {
		servers[srv.Host] = srv
	}
	Servers.RUnlock()
	return
}

func GetOnlineServers() (servers map[string]*Server) {
	servers = map[string]*Server{}
	Servers.RLock()
	for _, srv := range Servers.m {
		if srv.Online {
			servers[srv.Host] = srv
		}
	}
	Servers.RUnlock()
	return
}

func GetServersWithFallBack() (servers map[string]*Server) {
	onlineServers := GetOnlineServers()
	if len(onlineServers) > 0 {
		return onlineServers
	}

	return GetServers()
}

func PingServersTicker() {
	ticker := time.NewTicker(12 * time.Hour)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				PingServers()
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()

	// trigger it right now
	PingServers()
}

func PingServers() {
	// before we ping we'll update
	UpdateServersList()

	// max 25 concurrent ping
	totalWorkers := 25

	// current vpn status
	isConnected := profile.GetStatus()

	logrus.WithFields(logrus.Fields{
		"isConnected": isConnected,
	}).Info("servers: Checking if we should update servers list")

	if isConnected {
		return
	}

	semaphoreChan := make(chan struct{}, totalWorkers)
	defer close(semaphoreChan)

	// create our wait group
	var wg sync.WaitGroup

	Servers.RLock()
	for _, srv := range Servers.m {
		wg.Add(1)
		go func(srv *Server) {

			// block until the semaphore channel has room
			semaphoreChan <- struct{}{}

			// wait the ping to be done
			// to clean a room
			defer func() {
				<-semaphoreChan
				wg.Done()
			}()

			srv.Ping()
		}(srv)
	}
	Servers.RUnlock()

	wg.Wait()

	// only for our debug
	onlineServers := len(GetOnlineServers())
	allServers := len(GetServers())

	logrus.WithFields(logrus.Fields{
		"online": onlineServers,
		"all":    allServers,
	}).Info("servers: Ping completed")

	// send event to frontend
	evt := event.Event{
		Type: "servers_list",
	}
	evt.Init()

	return
}

func GetServer(host string) (srv *Server) {
	Servers.RLock()
	srv = Servers.m[host]
	Servers.RUnlock()
	return
}

func UpdateServersList() {

	url := "https://myip.ht/servers-geo.json"

	desktopClient := http.Client{
		Timeout: time.Second * 5,
	}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"error": err,
		}).Error("servers: Http request error (prepare")
	}

	res, getErr := desktopClient.Do(req)
	if getErr != nil {
		logrus.WithFields(logrus.Fields{
			"error": getErr,
		}).Error("servers: Http request error. Retrying with backup hostname.")
		backOffReq, _ := http.NewRequest(http.MethodGet, "http://check.myip.ht:8080/servers-geo.json", nil)
		res, err = desktopClient.Do(backOffReq)
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"error": err,
			}).Error("servers: Http request error (failed)")
			panic(err)
		}
	}

	body, readErr := ioutil.ReadAll(res.Body)
	if readErr != nil {
		logrus.WithFields(logrus.Fields{
			"error": readErr,
		}).Error("servers: Http request error (request)")
	}

	var allServers []*Server
	jsonErr := json.Unmarshal(body, &allServers)
	if jsonErr != nil {
		logrus.WithFields(logrus.Fields{
			"error": jsonErr,
		}).Error("servers: JSON error")
	}

	for _, value := range allServers {
		Servers.Lock()
		Servers.m[value.Host] = value
		Servers.Unlock()
	}

	return
}

func (srv *Server) Ping() {

	pinger := fastping.NewPinger()

	ra, err := net.ResolveIPAddr("ip4:icmp", srv.IP)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"error": err,
		}).Error("servers: Ping errors")
	}

	pinger.AddIPAddr(ra)
	pinger.MaxRTT = time.Second * 1

	pinger.OnRecv = func(addr *net.IPAddr, rtt time.Duration) {
		srv.Online = true
		srv.AvgPing = rtt
	}

	err = pinger.Run()
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"error": err,
		}).Error("servers: Ping errors")
	}

	return
}
