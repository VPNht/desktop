#!/bin/bash
set -e

read -r -p "Uninstall VPN.ht Client? [y/N] " response
if ! [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]
then
    exit
fi

# Service
kill -2 $(ps aux | grep 'VPN.ht.app' | awk '{print $2}') &> /dev/null || true
sudo launchctl unload /Library/LaunchAgents/ht.vpn.client.plist &> /dev/null || true
sudo launchctl unload /Library/LaunchDaemons/ht.vpn.service.plist &> /dev/null || true

# App
sudo rm -rf /Applications/VPN.ht.app
sudo rm -f /Library/LaunchAgents/ht.vpn.client.plist
sudo rm -f /Library/LaunchDaemons/ht.vpn.service.plist
sudo rm -f /private/var/db/receipts/ht.vpn.pkg.VPNht.bom
sudo rm -f /private/var/db/receipts/ht.vpn.pkg.VPNht.plist

# Profiles
rm -rf ~/Library/Application Support/vpnht
rm -rf ~/Library/Caches/vpnht
rm -rf ~/Library/Preferences/com.electron.vpnht.plist

# Old Files
sudo rm -rf /var/lib/vpnht
sudo rm -f /var/log/vpnht.log
sudo kextunload -b net.sf.tuntaposx.tap &> /dev/null || true
sudo kextunload -b net.sf.tuntaposx.tun &> /dev/null || true
sudo rm -rf /Library/Extensions/tap.kext
sudo rm -rf /Library/Extensions/tun.kext
sudo rm -f /Library/LaunchDaemons/net.sf.tuntaposx.tap.plist
sudo rm -f /Library/LaunchDaemons/net.sf.tuntaposx.tun.plist
sudo rm -rf /usr/local/bin/vpnht-openvpn
sudo rm -rf /usr/local/bin/vpnht-service

echo "###################################################"
echo "Uninstallation Successful"
echo "###################################################"