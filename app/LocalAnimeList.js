import {
    localState,
} from './Globals';
import PubSub from './PubSub';

export default class LocalAnimeList {
    constructor() {
        this.animeList = [];
        this.pubSub = {
            animeList: new PubSub(),
        };
    }

    addRating(item, rating) {
        item.userRating = rating;
        item.userStatus = 2;

        let newRatings = this.animeList.slice();
        for (let i = 0; i < newRatings.length; ++i) {
            if (newRatings[i].animedbId === item.animedbId) {
                newRatings[i] = item;
                return localState.setLocalAnimeList(newRatings);
            }
        }

        newRatings.unshift(item);
        return localState.setLocalAnimeList(newRatings);
    }

    removeRating(item) {
        let newRatings = this.animeList.slice();
        for (let i = 0; i < newRatings.length; ++i) {
            if (newRatings[i].animedbId === item.animedbId) {
                newRatings.splice(i, 1);
                return localState.setLocalAnimeList(newRatings);
            }
        }
        return Promise.reject('Item not found');
    }

    setAnimeList(animeList) {
        this.animeList = animeList;
        this.pubSub.animeList.notify(animeList);
    }

    getAnimeList() {
        return this.animeList;
    }
}
