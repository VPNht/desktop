package handlers

import (
	"github.com/sirupsen/logrus"
	"github.com/gin-gonic/gin"
	"github.com/vpnht/desktop/packages/service/profile"
)

func restartPost(c *gin.Context) {
	logrus.Warn("handlers: Restarting...")

	profile.RestartProfiles(false)

	c.JSON(200, nil)
}
