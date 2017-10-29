#!/bin/sh

FILES="\
     backend/AquaAutocomplete.js \
     backend/AquaRecommendations.js \
     backend/types.js \
     helpers/FilteredRecommendations.js \
     helpers/PubSub.js \
     state/LocalAnimeList.js \
     state/LocalState.js \
"

for file in $FILES; do
    diff -u ../aqua/src/main/js/shared/$file ../aqua-mobile/app/$file
done
