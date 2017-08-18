#!/bin/sh

cd $(dirname $0)
mkdir -p ios android

for i in 80 180 120 167 152 512 1024; do
    svgexport logo.svg ios/logo${i}.png $i:$i
done

svgexport logo.svg android/mipmap-mdpi/ic_launcher.png 48:48
svgexport logo.svg android/mipmap-hdpi/ic_launcher.png 72:72
svgexport logo.svg android/mipmap-xhdpi/ic_launcher.png 96:96
svgexport logo.svg android/mipmap-xxhdpi/ic_launcher.png 144:144
svgexport logo.svg android/mipmap-xxxhdpi/ic_launcher.png 192:192
