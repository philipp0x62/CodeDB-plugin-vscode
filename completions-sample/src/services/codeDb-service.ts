import { HttpClient } from './http-client';
import IFavouritesData  from '../models/favourites';

class CodeDb extends HttpClient {
  public constructor() {
    super('https://codedb.de/v1/plugin/');
  }

  public getFavourites = (token: string) => this.instance.get<IFavouritesData[]>(`/favourites/${token}`);
  
  public getCode = (id: string) => this.instance.get<any>(`/code/${id}`);
}