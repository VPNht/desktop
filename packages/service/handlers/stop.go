package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/vpnht/desktop/packages/service/autoclean"
	"github.com/vpnht/desktop/packages/service/profile"
)

func stopPost(c *gin.Context) {
	prfls := profile.GetProfiles()
	for _, prfl := range prfls {
		prfl.Stop()
	}

	autoclean.CheckAndCleanWatch()

	c.JSON(200, nil)
}
