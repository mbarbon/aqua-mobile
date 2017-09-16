export default class PubSub {
  constructor () {
    this.subscribers = []
  }

  subscribe (fnc) {
    this.subscribers.push(fnc)
  }

  unsubscribe (fnc) {
    this.subscribers.splice(this.subscribers.indexOf(fnc), 1)
  }

  notify () {
    for (let i = 0; i < this.subscribers.length; ++i) {
      try {
        this.subscribers[i].apply(null, arguments)
      } catch (err) {
        console.error(err)
      }
    }
  }
}
