Name: vpnht
Version: 0.0.0
Release: 1
Summary: VPN.ht
AutoReqProv: no
Requires: GConf2, libXScrnSaver, net-tools, iptables, openvpn
License: FIXME
Source: %{expand:%%(pwd)}

%description
Secure all your devices with our leading-edge VPN service.

%install
mkdir -p %{buildroot}/
cp -R redhat/* %{buildroot}/

%files
/usr/bin/vpnht-service
/usr/bin/vpnht
/usr/lib/vpnht/
/usr/share/applications/vpnht.desktop
/etc/systemd/system/vpnht.service
/var/log/vpnht.log
/var/log/vpnht.log.1
/usr/share/icons/hicolor/128x128/apps/vpnht.png
/usr/share/icons/hicolor/128x128@2x/apps/vpnht.png
/usr/share/icons/hicolor/160x160/apps/vpnht.png
/usr/share/icons/hicolor/16x16/apps/vpnht.png
/usr/share/icons/hicolor/16x16@2x/apps/vpnht.png
/usr/share/icons/hicolor/192x192/apps/vpnht.png
/usr/share/icons/hicolor/20x20/apps/vpnht.png
/usr/share/icons/hicolor/22x22/apps/vpnht.png
/usr/share/icons/hicolor/24x24/apps/vpnht.png
/usr/share/icons/hicolor/256x256/apps/vpnht.png
/usr/share/icons/hicolor/256x256@2x/apps/vpnht.png
/usr/share/icons/hicolor/32x32/apps/vpnht.png
/usr/share/icons/hicolor/32x32@2x/apps/vpnht.png
/usr/share/icons/hicolor/36x36/apps/vpnht.png
/usr/share/icons/hicolor/384x384/apps/vpnht.png
/usr/share/icons/hicolor/40x40/apps/vpnht.png
/usr/share/icons/hicolor/48x48/apps/vpnht.png
/usr/share/icons/hicolor/512x512/apps/vpnht.png
/usr/share/icons/hicolor/512x512@2x/apps/vpnht.png
/usr/share/icons/hicolor/64x64/apps/vpnht.png
/usr/share/icons/hicolor/64x64@2x/apps/vpnht.png
/usr/share/icons/hicolor/72x72/apps/vpnht.png
/usr/share/icons/hicolor/96x96/apps/vpnht.png
/usr/share/icons/hicolor/scalable/apps/vpnht.svg

%post
systemctl daemon-reload &> /dev/null || true
systemctl restart vpnht &> /dev/null || true
systemctl enable vpnht &> /dev/null || true
gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
xdg-icon-resource forceupdate --theme hicolor &> /dev/null || true
update-desktop-database -q || true

%preun
systemctl stop vpnht &> /dev/null || true
systemctl disable vpnht &> /dev/null || true

%postun
systemctl daemon-reload &> /dev/null || true
gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
xdg-icon-resource forceupdate --theme hicolor &> /dev/null || true
update-desktop-database -q || true