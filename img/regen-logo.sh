#!/bin/sh

cd $(dirname $0)
mkdir -p generated-icons

npm install -g svgexport
svgexport icon.svg generated-icons/icon-2048.png 2048:2048
convert generated-icons/icon-2048.png generated-icons/icon-2048.png

./ios-icon-generator.sh generated-icons/icon-2048.png generated-icons

for i in mdpi xhdpi xxhdpi xxxhdpi; do
    cp generated-icons/android/Icon-${i}.png ../android/app/src/main/res/mipmap-${i}/ic_launcher.png
done

exit 0
