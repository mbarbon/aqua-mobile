// XXX: shared
import PubSub from './PubSub';

function fetchRatings(username) {
    let headers = new Headers();

    headers.append('Cache-Control', 'max-age=' + (3600 * 4));
    headers.append('Cache-Control', 'max-stale');

    return fetch('https://aqua-recommend.net/list/anime/' + username, {
        headers: headers,
    })
        .then((response) => response.json());
}

function fetchRatingsUntil(username, retries, delay) {
    let executor = function executor(resolve, reject, remainingRetries) {
        return fetchRatings(username)
            .then((maybeRatings) => {
                if('queue-position' in maybeRatings) {
                    if (remainingRetries > 0) {
                        setTimeout(function () {
                            executor(resolve, reject, remainingRetries - 1);
                        }, delay);
                    } else {
                        reject('Maximum number of retries expired');
                    }
                } else {
                    resolve(maybeRatings);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };

    return new Promise(function (resolve, reject) {
        return executor(resolve, reject, retries);
    })
            .catch((err) => reject(err));
}

function fetchRecommendations(ratings) {
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');
    headers.append('Cache-Control', 'max-age=' + (3600 * 1.5));
    headers.append('Cache-Control', 'max-stale');

    return fetch('https://aqua-recommend.net/recommend', {
        method: 'POST',
        headers: headers,
        body: '{"animeList":' + JSON.stringify(ratings) + '}',
    })
        .then((response) => response.json());
}

export default class AquaRecommendations {
    constructor() {
        this.malUsername = null;
        this.localUser = false;
        this.pubSub = {
            userMode: new PubSub(),
            recommendations: new PubSub(),
        };
        this.recommendations = null;
    }

    hasUserMode() {
        return this.malUsername !== null || this.localUser;
    }

    getUserMode() {
        return this.localUser            ? 'local' :
               this.malUsername !== null ? 'mal' :
                                           null;
    }

    isLocalUser() {
        return this.localUser;
    }

    clearMalUsername(username) {
        this.malUsername = null;
        this.localUser = false;
        this.pubSub.userMode.notify();
    }

    setLocalUser() {
        this.malUserName = null;
        this.localUser = true;
        this.pubSub.userMode.notify();
    }

    setMalUsername(username) {
        this.malUsername = username;
        this.localUser = false;
        this.pubSub.userMode.notify();
    }

    loadRecommendations(userMode, animeList) {
        if (userMode == 'mal') {
            return this.loadMalRecommendations(animeList);
        } else if (userMode == 'local') {
            return this.loadLocalRecommendations(animeList);
        } else {
            throw 'Invalid user mode ' + mode;
        }
    }

    loadMalAnimeList() {
        return fetchRatingsUntil(this.malUsername, 5, 10000)
            .catch((error) => {
                console.error(error);
            });
    }

    loadMalRecommendations(animeList) {
        // XXX this should be included in the anime list
        let username = this.malUsername;
        return fetchRecommendations(animeList)
            .then((recommendations) => {
                this.recommendations = recommendations;
                // avoid race condition
                if (this.malUsername === username)
                    this.pubSub.recommendations.notify(recommendations, Date.now() / 1000);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    setLocalRatings(localRatings) {
        if (!this.isLocalUser() || localRatings.length == 0)
            return;

        return this.loadLocalRecommendations(localRatings);
    }

    loadLocalRecommendations(animeList) {
        fetchRecommendations(animeList)
            .then((recommendations) => {
                this.recommendations = recommendations;
                // avoid race condition
                if (this.isLocalUser())
                    this.pubSub.recommendations.notify(recommendations, Date.now() / 1000);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    setCachedRecommendations(recommendations, cacheTime) {
        this.recommendations = recommendations;
        this.pubSub.recommendations.notify(recommendations, cacheTime);
    }

    getRecommendations() {
        return this.recommendations;
    }
}