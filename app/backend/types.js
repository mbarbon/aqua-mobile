export type Anime = {
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

export type Rating = [number, number, number]
