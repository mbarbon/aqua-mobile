// @flow
// XXX: shared
import { Platform } from 'react-native'
import PubSub from '../helpers/PubSub'
import type { PubSub1 } from '../helpers/PubSub'
import type { Anime } from './types'

let objectionable =
  Platform.OS === 'ios'
    ? {
        '1853': true,
        '35288': true
      }
    : {}

function filterObjectionableContent (anime) {
  return anime.filter(a => !objectionable[a.animedbId])
}

function fetchCompletions (term: string): Promise<Array<Anime>> {
  let encoded = encodeURIComponent(term)
  let headers = new Headers()

  headers.append('Cache-Control', 'max-age=' + 3600 * 6)
  headers.append('Cache-Control', 'max-stale')

  return fetch('https://aqua-recommend.net/autocomplete?term=' + encoded, {
    headers: headers
  }).then(response => response.json())
}

export default class AquaAutocomplete {
  term: ?string
  completions: ?Array<Anime>
  pubSub: PubSub1<Array<Anime>>

  constructor () {
    this.term = null
    this.completions = null
    this.pubSub = new PubSub()
  }

  setTerm (term: string) {
    this.term = term

    fetchCompletions(term)
      .then(completions => {
        this.completions = filterObjectionableContent(completions)
        this.pubSub.notify(this.completions)
      })
      .catch(error => {
        console.error(error)
      })
  }

  getAnime () {
    return this.completions
  }
}
