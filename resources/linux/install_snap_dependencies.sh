#!/bin/bash -xe

sudo apt update

mkdir -p ../build/fakesnap/snap
cp ../resources/linux/snapcraft.deps.yaml ../build/fakesnap/snap/snapcraft.yaml
pushd fakesnap
snapcraft pull desktop-gtk3 electron-deps
sed -i -e s:desktop-gtk3:desktop-gtk2:g snap/snapcraft.yaml
snapcraft pull desktop-gtk2
popd
rm -r fakesnap