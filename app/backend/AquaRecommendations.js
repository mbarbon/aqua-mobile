// @flow
// XXX: shared
import PubSub from '../helpers/PubSub'
import type { PubSub0, PubSub3 } from '../helpers/PubSub'
import type { Anime, Rating } from './types'

type ResolveRatings = (Array<Rating>) => void
type RejectRatings = any => void

class MALRatingsRetriesExceeded extends Error {
  static retriesExceeded = true
  constructor (message) {
    super(message)
    this.constructor = MALRatingsRetriesExceeded
    this.__proto__ = MALRatingsRetriesExceeded.prototype
  }
}

function fetchRatings (username: string): Promise<Array<Rating>> {
  let headers = new Headers()

  headers.append('Cache-Control', 'max-age=' + 3600 * 4)
  headers.append('Cache-Control', 'max-stale')

  return fetch('https://aqua-recommend.net/list/anime/' + username, {
    headers: headers
  }).then(response => response.json())
}

function fetchRatingsUntil (
  username: string,
  retries: number,
  delay: number
): Promise<Array<Rating>> {
  let executor = function executor (
    resolve: ResolveRatings,
    reject: RejectRatings,
    remainingRetries: number
  ) {
    return fetchRatings(username)
      .then(maybeRatings => {
        if ('queue-position' in maybeRatings) {
          if (remainingRetries > 0) {
            setTimeout(function () {
              executor(resolve, reject, remainingRetries - 1)
            }, delay)
          } else {
            reject(
              new MALRatingsRetriesExceeded('Maximum number of retries expired')
            )
          }
        } else {
          resolve(maybeRatings)
        }
      })
      .catch(error => {
        reject(error)
      })
  }

  return new Promise(function (resolve, reject) {
    return executor(resolve, reject, retries)
  })
}

function fetchRecommendations (ratings: Array<Rating>): Promise<Array<Anime>> {
  let headers = new Headers()

  headers.append('Content-Type', 'application/json')
  headers.append('Cache-Control', 'max-age=' + 3600 * 1.5)
  headers.append('Cache-Control', 'max-stale')

  return fetch('https://aqua-recommend.net/recommend', {
    method: 'POST',
    headers: headers,
    body: '{"animeList":' + JSON.stringify(ratings) + '}'
  }).then(response => response.json())
}

export default class AquaRecommendations {
  malUsername: ?string
  localUser: boolean
  pubSub: {
    userMode: PubSub0,
    recommendations: PubSub3<Array<Anime>, number, 'mal' | 'local'>
  }
  recommendations: ?Array<Anime>

  constructor () {
    this.malUsername = null
    this.localUser = false
    this.pubSub = {
      userMode: new PubSub(),
      recommendations: new PubSub()
    }
    this.recommendations = null
  }

  hasUserMode () {
    return this.malUsername !== null || this.localUser
  }

  getUserMode () {
    return this.localUser ? 'local' : this.malUsername !== null ? 'mal' : null
  }

  isLocalUser () {
    return this.localUser
  }

  clearMalUsername () {
    this.malUsername = null
    this.localUser = false
    this.pubSub.userMode.notify()
  }

  setLocalUser () {
    this.malUsername = null
    this.localUser = true
    this.pubSub.userMode.notify()
  }

  setMalUsername (username: string) {
    this.malUsername = username
    this.localUser = false
    this.pubSub.userMode.notify()
  }

  loadRecommendations (userMode: 'mal' | 'local', animeList: Array<Rating>) {
    if (userMode == 'mal') {
      return this.loadMalRecommendations(animeList)
    } else if (userMode == 'local') {
      return this.loadLocalRecommendations(animeList)
    } else {
      throw 'Invalid user mode ' + userMode
    }
  }

  loadMalAnimeList (): Promise<Array<Anime>> {
    if (this.malUsername == null) {
      throw new Error('Need an username when calling loadMalAnimeList')
    }
    return fetchRatingsUntil(this.malUsername, 5, 10000)
  }

  loadMalRecommendations (animeList: Array<Rating>): Promise<null> {
    // XXX this should be included in the anime list
    let username = this.malUsername
    return fetchRecommendations(animeList)
      .then(recommendations => {
        this.recommendations = recommendations
        // avoid race condition
        if (this.malUsername === username)
          this.pubSub.recommendations.notify(
            recommendations,
            Date.now() / 1000,
            'mal'
          )
      })
      .catch(error => {
        console.error(error)
      })
  }

  setLocalRatings (localRatings: Array<Rating>) {
    if (!this.isLocalUser() || localRatings.length == 0) return

    return this.loadLocalRecommendations(localRatings)
  }

  loadLocalRecommendations (animeList: Array<Rating>) {
    fetchRecommendations(animeList)
      .then(recommendations => {
        this.recommendations = recommendations
        // avoid race condition
        if (this.isLocalUser())
          this.pubSub.recommendations.notify(
            recommendations,
            Date.now() / 1000,
            'local'
          )
      })
      .catch(error => {
        console.error(error)
      })
  }

  setCachedRecommendations (
    recommendations: Array<Anime>,
    cacheTime: number,
    userMode: 'mal' | 'local'
  ) {
    this.recommendations = recommendations
    this.pubSub.recommendations.notify(recommendations, cacheTime, userMode)
  }

  getRecommendations () {
    return this.recommendations
  }
}
