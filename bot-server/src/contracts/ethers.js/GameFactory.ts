import { ethers } from 'ethers';
import { EthersContract } from './EthersContract';
import { IGameFactory } from "../IGameFactory";

export class GameFactory extends EthersContract implements IGameFactory{
  public async nbGames(): Promise<number> {
    return this.contract.nbGames();
  }
  public async getGameAt(index: number): Promise<string> {
    return this.contract.getGameAt(index);
  }
}
