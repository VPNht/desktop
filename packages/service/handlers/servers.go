package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/vpnht/desktop/packages/service/servers"
)

func serversGet(c *gin.Context) {
	c.JSON(200, servers.GetServersWithFallBack())
}
