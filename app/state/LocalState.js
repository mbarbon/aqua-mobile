import { AsyncStorage } from 'react-native'
import { aquaRecommendations, localAnimeList } from './Globals'

const malUsernameKey = '@Aqua:mal:username'
const userModeKey = '@Aqua:userMode'
const localAnimeListKey = '@Aqua:local:animeList'
const malAnimeListKey = '@Aqua:mal:animeList'
const cachedRecommendationsKey = '@Aqua:recommendations:cache'
const cachedRecommendationsTimeKey = '@Aqua:recommendations:cacheTime'
const cachedRecommendationsForKey = '@Aqua:recommendations:cacheFor'

function removeObjectionableContent (animeList) {
  return animeList.filter(anime => anime.animedbId !== 35288)
}

export default class LocalState {
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
  }

  loadUserMode (maxXyz) {
    return AsyncStorage.multiGet([
      userModeKey,
      malUsernameKey,
      cachedRecommendationsTimeKey,
      cachedRecommendationsForKey
    ]).then(keys => {
      let now = Date.now() / 1000
      let userMode = keys[0][1]
      let username = keys[1][1]
      let recommendationRefresh = keys[2][1] ? parseInt(keys[2][1]) : 0
      let recommendationMode = keys[3][1]

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
          loadLocal = this._loadLocalAnimeList(true)
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
          return this._loadLocalAnimeList(false)
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

  _loadLocalAnimeList (dontReloadRecommendations) {
    return AsyncStorage.getItem(localAnimeListKey).then(animeListString => {
      let animeList = removeObjectionableContent(
        JSON.parse(animeListString) || []
      )

      // order is important here
      aquaRecommendations.setLocalUser()
      localAnimeList.setAnimeList(animeList, dontReloadRecommendations)
    })
  }

  setLocalAnimeList (animeList) {
    let listString = JSON.stringify(animeList)
    return AsyncStorage.setItem(localAnimeListKey, listString).then(() =>
      localAnimeList.setAnimeList(animeList)
    )
  }

  getCurrentAnimeList (userMode) {
    if (userMode === 'mal' || userMode === 'local') {
      let key = userMode === 'mal' ? malAnimeListKey : localAnimeListKey

      return AsyncStorage.getItem(key).then(animeListString =>
        removeObjectionableContent(JSON.parse(animeListString) || [])
      )
    } else if (userMode === null) {
      return Promise.resolve(null)
    } else {
      throw 'Invalid user mode ' + userMode
    }
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
}
