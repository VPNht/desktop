#!/bin/bash

export APP_VER="$(cat packages/client/package.json | grep version | cut -d '"' -f 4)"

cd "$( dirname "${BASH_SOURCE[0]}" )"
cd ../../

rm -rf build

# Setup keychain
if [[ ! -z "$KEY_LINK" && ! -z "$KEY_PASSWORD" ]]; then
    echo $KEY_LINK | base64 --decode > developer-id-cert.p12
    KEY_CHAIN=mac-build.keychain
    security create-keychain -p vpnht $KEY_CHAIN
    security default-keychain -s $KEY_CHAIN
    security unlock-keychain -p vpnht $KEY_CHAIN
    security import developer-id-cert.p12 -k $KEY_CHAIN -P $KEY_PASSWORD -T /usr/bin/codesign -T /usr/bin/pkgbuild -T /usr/bin/productbuild
    security list-keychain -s $KEY_CHAIN
    security set-keychain-settings -t 3600 -u $KEY_CHAIN
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k vpnht $KEY_CHAIN
    security find-identity -v
fi

# Electron App
mkdir -p build/osx/Applications
cd packages/client
yarn
yarn dist
./node_modules/.bin/electron-rebuild
./node_modules/.bin/electron-packager ./target VPN.ht --platform=darwin --arch=x64 --icon=./target/static/vpnht.icns --out=../../build/osx/Applications
cd ../../
mv build/osx/Applications/VPN.ht-darwin-x64/VPN.ht.app build/osx/Applications/
rm -rf build/osx/Applications/VPN.ht-darwin-x64
sleep 3
echo "Signing client"
codesign --force --deep --sign "Developer ID Application: VPN.ht Limited (GQ86HD4E57)" build/osx/Applications/VPN.ht.app

# Service
cd packages/service
go get -u
go build -v -o ../../build/vpnht-service
cd ../../
cp build/vpnht-service build/osx/Applications/VPN.ht.app/Contents/Resources/vpnht-service
echo "Signing service"
codesign --force --deep --sign "Developer ID Application: VPN.ht Limited (GQ86HD4E57)" build/osx/Applications/VPN.ht.app/Contents/Resources/vpnht-service

# Service Daemon
mkdir -p build/osx/Library/LaunchDaemons
cp resources/macos/ht.vpn.service.plist build/osx/Library/LaunchDaemons

# Client Agent
mkdir -p build/osx/Library/LaunchAgents
cp resources/macos/ht.vpn.client.plist build/osx/Library/LaunchAgents

# Openvpn
cp resources/macos/openvpn/openvpn build/osx/Applications/VPN.ht.app/Contents/Resources/vpnht-openvpn

# Files
touch build/osx/Applications/VPN.ht.app/Contents/Resources/auth
touch build/osx/Applications/VPN.ht.app/Contents/Resources/vpnht.log
touch build/osx/Applications/VPN.ht.app/Contents/Resources/vpnht.log.1

# Package
chmod +x resources/macos/scripts/postinstall
chmod +x resources/macos/scripts/preinstall
cd build
echo "Build package (pkgbuild)"
pkgbuild --root osx --scripts ../resources/macos/scripts --sign "Developer ID Installer: VPN.ht Limited (GQ86HD4E57)" --identifier ht.vpn.pkg.VPNht --version $APP_VER --ownership recommended --install-location / Build.pkg
echo "Build package (productbuild)"
productbuild --resources ../resources/macos --distribution ../resources/macos/distribution.xml --sign "Developer ID Installer: VPN.ht Limited (GQ86HD4E57)" --version $APP_VER VPNht.pkg

rm -Rf osx