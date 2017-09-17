// @flow
// XXX: shared
import PubSub from '../helpers/PubSub'
import type { Anime } from './types'

function fetchCompletions (term: string) {
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
  pubSub: PubSub

  constructor () {
    this.term = null
    this.completions = null
    this.pubSub = new PubSub()
  }

  setTerm (term: string) {
    this.term = term

    fetchCompletions(term)
      .then(completions => {
        this.completions = completions
        this.pubSub.notify(completions)
      })
      .catch(error => {
        console.error(error)
      })
  }

  getAnime () {
    return this.completions
  }
}
