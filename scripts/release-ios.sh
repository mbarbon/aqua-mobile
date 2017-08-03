#!/bin/sh

. ~/.gradle/gradle.properties

CODEPUSH_KEY=${AQUA_MOBILE_CODE_PUSH_PRODUCTION_KEY:-NONE}
FABRIC_KEY=${AQUA_MOBILE_CRASHYLITICS_KEY:-NONE}
FABRIC_SECRET=${AQUA_MOBILE_CRASHYLITICS_SECRET:-NONE}

perl -i -p -e "s{FABRIC_KEY}{${FABRIC_KEY}}; s{FABRIC_SECRET}{${FABRIC_SECRET}}" -- ios/aquamobile.xcodeproj/project.pbxproj
plutil -remove NSAppTransportSecurity ./ios/aquamobile/Info.plist
plutil -replace CodePushDeploymentKey -string "$CODEPUSH_KEY" ./ios/aquamobile/Info.plist
plutil -replace Fabric.APIKey -string "$FABRIC_KEY" ./ios/aquamobile/Info.plist

TARGET=${1:Release}
shift

react-native run-ios --configuration ${TARGET} "$@"
