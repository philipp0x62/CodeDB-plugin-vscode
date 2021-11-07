import { HttpClient } from './http-client';
import IFavouritesData from '../models/favourites';
import { ClientRequest } from 'http';

export default class CodeDb extends HttpClient {
  public constructor() {
    super('https://codedb.de/v1/plugin/');
  }

  public getFavourites = (token: string) => this.instance.get<IFavouritesData,IFavouritesData>(`/favourites/${token}`).then(response => {
    return response;
  });

  public getCode = (id: string) => this.instance.get<string>(`/code/${id}`);
}