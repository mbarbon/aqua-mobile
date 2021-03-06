import { AsyncStorage, Platform } from 'react-native'
import { aquaRecommendations, localAnimeList } from './Globals'

const malUsernameKey = '@Aqua:mal:username'
const userModeKey = '@Aqua:userMode'
const localAnimeListKey = '@Aqua:local:animeList'
const malAnimeListKey = '@Aqua:mal:animeList'
const cachedRecommendationsKey = '@Aqua:recommendations:cache'
const cachedRecommendationsTimeKey = '@Aqua:recommendations:cacheTime'
const cachedRecommendationsForKey = '@Aqua:recommendations:cacheFor'
const filterStateKey = '@Aqua:recommendationFilters'

let objectionable =
  Platform.OS === 'ios'
    ? {
        '1853': true,
        '35288': true
      }
    : {}

function removeObjectionableContent (animeList) {
  return animeList.filter(anime => !objectionable[anime.animedbId])
}

export default class LocalState {
  constructor () {
    this.currentFilterState = {}
  }

  resetUserMode () {
    AsyncStorage.multiRemove([malUsernameKey, userModeKey]).then(() =>
      aquaRecommendations.clearMalUsername()
    )
  }

  setLocalUser () {
    AsyncStorage.setItem(userModeKey, 'local').then(() =>
      aquaRecommendations.setLocalUser()
    )
  }

  setLocalUserAndLoadRecommendations () {
    AsyncStorage.setItem(userModeKey, 'local').then(() => {
      aquaRecommendations.setLocalUser()
      return this._loadLocalAnimeList(false)
    })
  }

  setMalUsernameAndLoadRecommendations (username) {
    AsyncStorage.multiSet([
      [malUsernameKey, username],
      [userModeKey, 'mal']
    ]).then(() => {
      aquaRecommendations.setMalUsername(username)

      return this.loadMalRecommendations(username)
    })
  }

  loadMalRecommendations (username) {
    return aquaRecommendations
      .loadMalAnimeList()
      .then(animeList => {
        // as a cache
        this.setMalAnimeList(animeList)

        return animeList
      })
      .then(
        aquaRecommendations.loadMalRecommendations.bind(aquaRecommendations)
      )
      .catch(error => {
        // assumes there was a typo in the MAL user name and backs off
        if (error.constructor.retriesExceeded) {
          this.resetUserMode()
        }
      })
  }

  loadUserMode (maxXyz) {
    return AsyncStorage.multiGet([
      userModeKey,
      malUsernameKey,
      cachedRecommendationsTimeKey,
      cachedRecommendationsForKey,
      filterStateKey
    ]).then(keys => {
      let now = Date.now() / 1000
      let userMode = keys[0][1]
      let username = keys[1][1]
      let recommendationRefresh = keys[2][1] ? parseInt(keys[2][1]) : 0
      let recommendationMode = keys[3][1]
      let filterState = keys[4][1]

      if (filterState) {
        this.currentFilterState = JSON.parse(filterState)
      }

      if (userMode === null) return null
      else if (userMode !== 'mal' && userMode !== 'local')
        throw 'Invalid user mode ' + userMode

      if (
        recommendationMode === userMode &&
        now - recommendationRefresh < maxXyz
      ) {
        let loadLocal
        if (userMode === 'mal') {
          aquaRecommendations.setMalUsername(username)
        } else if (userMode === 'local') {
          aquaRecommendations.setLocalUser()
          loadLocal = this._loadLocalAnimeList()
        }
        let cachedRecommendations = AsyncStorage.getItem(
          cachedRecommendationsKey
        ).then(cachedRecommendationsString => {
          aquaRecommendations.setCachedRecommendations(
            JSON.parse(cachedRecommendationsString),
            recommendationRefresh,
            userMode
          )
        })
        return loadLocal
          ? Promise.all(loadLocal, cachedRecommendations)
          : cachedRecommendations
      } else {
        if (userMode === 'mal') {
          return this._loadMalUsername()
        } else if (userMode === 'local') {
          return this._loadLocalAnimeList(true)
        }
      }
    })
  }

  _loadMalUsername () {
    return AsyncStorage.getItem(malUsernameKey).then(username => {
      aquaRecommendations.setMalUsername(username)

      return this.loadMalRecommendations(username)
    })
  }

  _loadLocalAnimeList (reloadRecommendations) {
    return AsyncStorage.getItem(localAnimeListKey).then(animeListString => {
      let animeList = removeObjectionableContent(
        JSON.parse(animeListString) || []
      )

      // order is important here
      aquaRecommendations.setLocalUser()
      localAnimeList.setAnimeList(animeList, reloadRecommendations)
    })
  }

  setLocalAnimeList (animeList) {
    let listString = JSON.stringify(animeList)
    return AsyncStorage.setItem(localAnimeListKey, listString).then(() =>
      localAnimeList.setAnimeList(animeList)
    )
  }

  setMalAnimeList (animeList) {
    let listString = JSON.stringify(animeList)
    return AsyncStorage.setItem(malAnimeListKey, listString)
  }

  setCachedRecommendations (recommendations, updateTime, userMode) {
    return AsyncStorage.multiSet([
      [cachedRecommendationsKey, JSON.stringify(recommendations)],
      [cachedRecommendationsTimeKey, updateTime.toString()],
      [cachedRecommendationsForKey, userMode]
    ])
  }

  setRecommendationFilterState (filterState) {
    let jsonString = JSON.stringify(filterState)
    this.currentFilterState = JSON.parse(jsonString)
    return AsyncStorage.setItem(filterStateKey, jsonString)
  }

  getRecommendationFilterState () {
    return this.currentFilterState
  }
}
