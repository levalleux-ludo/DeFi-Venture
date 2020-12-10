import { IBigNumber, IBotPlayer } from '../IBotPlayer';
import { ITransactionResponse } from '../IContract';
import { EthersContract } from './EthersContract';

export class BotPlayer extends EthersContract implements IBotPlayer {
  public estimateGas = {
    rollDices: (gameMasterAddress: string) => {
      return new Promise<IBigNumber>((resolve, reject) => {
        this.contract.estimateGas
          .rollDices(gameMasterAddress)
          .then(gas => {
            resolve(gas as IBigNumber);
          })
          .catch(reject);
      });
    },
  };
  public register(
    gameMasterAddress: string,
    bytes32username: string,
    avatar: number
  ): Promise<ITransactionResponse> {
    return this.contract.register(gameMasterAddress, bytes32username, avatar);
  }
  public rollDices(
    gameMasterAddress: string,
    options?: any
  ): Promise<ITransactionResponse> {
    return this.contract.rollDices(gameMasterAddress, options);
  }
  public play(
    gameMasterAddress: any,
    option: number
  ): Promise<ITransactionResponse> {
    return this.contract.play(gameMasterAddress, option);
  }
}
