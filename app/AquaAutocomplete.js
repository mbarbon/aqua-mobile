// XXX: shared
import PubSub from './PubSub'

function fetchCompletions (term) {
  let encoded = encodeURIComponent(term)
  let headers = new Headers()

  headers.append('Cache-Control', 'max-age=' + 3600 * 6)
  headers.append('Cache-Control', 'max-stale')

  return fetch('https://aqua-recommend.net/autocomplete?term=' + encoded, {
    headers: headers
  }).then(response => response.json())
}

export default class AquaAutocomplete {
  constructor () {
    this.term = null
    this.completions = null
    this.pubSub = new PubSub()
  }

  setTerm (term) {
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
