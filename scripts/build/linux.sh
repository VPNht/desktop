#!/bin/bash

export APP_VER="$(cat packages/client/package.json | grep version | cut -d '"' -f 4)"

cd "$( dirname "${BASH_SOURCE[0]}" )"
cd ../../

rm -rf build
mkdir -p build/linux
mkdir -p build/snap

# Electron App
pushd packages/client
yarn
yarn dist
./node_modules/.bin/electron-rebuild
./node_modules/.bin/electron-packager ./target VPNht --platform=linux --arch=x64 --icon=./target/static/vpnht.png --out=../../build/linux
popd

chmod +x ./build/linux/VPNht-linux-x64/libffmpeg.so

# Service
pushd packages/service
go get -u
go build -v -o ../../build/vpnht-service
popd

mv ./build/linux/VPNht-linux-x64 ./build/linux-source
rm -Rf ./build/linux


# Create package structure (ubuntu)
mkdir -p ./build/ubuntu/usr/share/applications
cp ./resources/linux/vpnht.desktop ./build/ubuntu/usr/share/applications/vpnht.desktop

mkdir -p ./build/ubuntu/etc/systemd/system
cp ./resources/linux/vpnht.service ./build/ubuntu/etc/systemd/system/vpnht.service

mkdir -p ./build/ubuntu/usr/bin
mkdir -p ./build/ubuntu/usr/lib

cp -R ./build/linux-source ./build/ubuntu/usr/lib/vpnht
chmod 4755 ./build/ubuntu/usr/lib/vpnht/chrome-sandbox
ln -s /usr/lib/vpnht/VPNht ./build/ubuntu/usr/bin/vpnht

cp ./build/vpnht-service ./build/ubuntu/usr/bin/vpnht-service

mkdir -p ./build/ubuntu/usr/share/icons
cp -R ./resources/linux/icons ./build/ubuntu/usr/share/icons/hicolor
find ./build/ubuntu/usr/share/icons -type d -exec chmod 755 {} \;
find ./build/ubuntu/usr/share/icons -type f -exec chmod 644 {} \;

mkdir -p ./build/ubuntu/var/log
touch ./build/ubuntu/var/log/vpnht.log
touch ./build/ubuntu/var/log/vpnht.log.1

cp -R ./resources/linux/DEBIAN ./build/ubuntu/

cd ./build
dpkg --build ./ubuntu/

# Not required anymore
rm -Rf ./ubuntu/DEBIAN

# Build the snap
# Multi pass require access to /var/snap/multipass/common/multipass_socket
# cp -R ../resources/linux/snapcraft.yaml  ./snap/
# pushd snap
# sudo snapcraft --destructive-mode
# mv vpnht_${APP_VER}_amd64.snap ../vpnht.snap
# popd

# Create package(redhat) -- we can keep same structure
mv ./ubuntu ./redhat

# Copy our Spec file locally
cp -R ../resources/linux/vpnht.spec  .

# Build the rpm
rpmbuild -bb ./vpnht.spec --target x86_64 --build-in-place --define "_rpmdir $(pwd)"
mv ./x86_64/vpnht-$APP_VER-1.x86_64.rpm ./redhat.rpm

# Cleanup
rm -Rf ./linux-source
sudo rm -Rf ./snap
rm -Rf ./redhat
rm -Rf ./vpnht.spec
rm -Rf ./x64
