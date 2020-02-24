package main

import (
	"context"
	"flag"
	"net"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"runtime/debug"
	"syscall"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/dropbox/godropbox/errors"
	"github.com/gin-gonic/gin"
	"github.com/vpnht/desktop/packages/service/auth"
	"github.com/vpnht/desktop/packages/service/autoclean"
	"github.com/vpnht/desktop/packages/service/constants"
	"github.com/vpnht/desktop/packages/service/errortypes"
	"github.com/vpnht/desktop/packages/service/handlers"
	"github.com/vpnht/desktop/packages/service/logger"
	"github.com/vpnht/desktop/packages/service/profile"
	"github.com/vpnht/desktop/packages/service/servers"
	"github.com/vpnht/desktop/packages/service/utils"
	"github.com/vpnht/desktop/packages/service/watch"

	"github.com/getsentry/sentry-go"
)

func main() {
	devPtr := flag.Bool("dev", false, "development mode")
	flag.Parse()
	if *devPtr {
		constants.Development = true
	}

	sentry.Init(sentry.ClientOptions{
		Dsn: "https://5cac3e9abc124d6a9b2b1a9dbbcbd96d@sentry.io/2765469",
	})

	err := utils.PidInit()
	if err != nil {
		panic(err)
	}

	logger.Init()

	logrus.WithFields(logrus.Fields{
		"version": constants.Version,
	}).Info("main: Service starting")

	defer func() {
		panc := recover()
		if panc != nil {
			logrus.WithFields(logrus.Fields{
				"stack": string(debug.Stack()),
				"panic": panc,
			}).Error("main: Panic")
			panic(panc)
		}
	}()

	err = auth.Init()
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"error": err,
		}).Error("main: Failed to init auth")
		panic(err)
	}

	err = autoclean.CheckAndClean()
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"error": err,
		}).Error("main: Failed to run check and clean")
		panic(err)
	}

	gin.SetMode(gin.ReleaseMode)

	// setup the handlers'
	router := gin.New()
	handlers.Register(router)

	// Start watch
	watch.StartWatch()

	server := &http.Server{
		Addr:           "127.0.0.1:9770",
		Handler:        router,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		MaxHeaderBytes: 4096,
	}

	if runtime.GOOS != "linux" {
		server.Addr = "127.0.0.1:9770"
	}

	go func() {
		defer func() {
			recover()
		}()

		if runtime.GOOS != "linux" && runtime.GOOS != "darwin" {
			err = server.ListenAndServe()
			if err != nil {
				logrus.WithFields(logrus.Fields{
					"error": err,
				}).Error("main: Server error")
				panic(err)
			}
		} else {
			listener, err := net.Listen("unix", "/var/run/vpnht.sock")
			if err != nil {
				err = &errortypes.WriteError{
					errors.Wrap(err, "main: Failed to create unix socket"),
				}
				logrus.WithFields(logrus.Fields{
					"error": err,
				}).Error("main: Server error")
				panic(err)
			}

			err = os.Chmod("/var/run/vpnht.sock", 0777)
			if err != nil {
				err = &errortypes.WriteError{
					errors.Wrap(err, "main: Failed to chmod unix socket"),
				}
				logrus.WithFields(logrus.Fields{
					"error": err,
				}).Error("main: Server error")
				panic(err)
			}

			server.Serve(listener)
		}
	}()

	// Ping all servers
	// non-blocking'
	go servers.PingServersTicker()

	sig := make(chan os.Signal, 2)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	<-sig

	webCtx, webCancel := context.WithTimeout(
		context.Background(),
		1*time.Second,
	)
	defer webCancel()

	func() {
		defer func() {
			recover()
		}()
		server.Shutdown(webCtx)
		server.Close()
	}()

	time.Sleep(250 * time.Millisecond)

	prfls := profile.GetProfiles()
	for _, prfl := range prfls {
		prfl.Stop()
	}

	time.Sleep(750 * time.Millisecond)

	sentry.Flush(time.Second * 5)
	time.Sleep(750 * time.Millisecond)
}
