import { IContract } from "./IContract";

export interface IGameMaster extends IContract {
  isPlayerRegistered(player): Promise<boolean>;
  getGameData(): Promise<any[]>;
  nbPlayers(): Promise<number>;
  getPlayersData(indexes: number[]): Promise<any[][]>;
}
