import { EthersContract } from './EthersContract';
import { ethers } from 'ethers';
import { IGameMaster } from "../IGameMaster";

export class GameMaster extends EthersContract implements IGameMaster {
  public isPlayerRegistered(player: any): Promise<boolean> {
    return this.contract.isPlayerRegistered(player);
  }
  public getGameData(): Promise<any[]> {
    return this.contract.getGameData();
  }
  public nbPlayers(): Promise<number> {
    return this.contract.nbPlayers();
  }
  public getPlayersData(indexes: number[]): Promise<any[][]> {
    return this.contract.getPlayersData(indexes);
  }
}
