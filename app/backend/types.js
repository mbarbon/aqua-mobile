// @flow
type Anime = {
  animedbId: number,
  title: string,
  image: string,
  episodes: number,
  franchiseEpisodes: number,
  genres: string,
  season: string,
  tags: string,
  status: number
}

type Rating = [number, number, number]

export type { Anime, Rating }
