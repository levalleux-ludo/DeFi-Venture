import { IContract } from './IContract';
export interface IGameFactory extends IContract {
  nbGames(): Promise<number>;
  getGameAt(index: number): Promise<string>;
}
