export default interface IHitsData {
	title: string,
	shortcut: string,
	code_id: string,

  }

export default interface IFavouritesData {
	total?: any | null,
	hits: IHitsData[]
  }

