import { IBigNumber, IBotPlayer } from '../IBotPlayer';
import { ITransactionReceipt } from './../IContract';
import { ITransactionResponse } from '../IContract';
import { WebJSContract } from './WebJSContract';

class MyBigNumber implements IBigNumber {
  constructor(private nb: number) {}
  public mul(n: any): IBigNumber {
    return new MyBigNumber(n * this.nb);
  }
  public toString(): string {
    return this.nb.toString();
  }
  public toNumber(): number {
    return this.nb;
  }
}

export class BotPlayer extends WebJSContract implements IBotPlayer {
  protected waitForTx(tx: any): Promise<ITransactionResponse> {
    return new Promise((resolve, reject) => {
      let hash;
      const waitPromise = new Promise<ITransactionReceipt>(
        (resolve2, reject2) => {
          tx.once('receipt', receipt => {
            resolve2(receipt.transactionHash);
          });
        }
      );
      tx.once('transactionHash', txHash => {
        hash = txHash;
      });
      tx.once('confirmation', (nbConfirmation, receipt) => {
        resolve({ hash, wait: () => waitPromise });
      });
    });
  }
  public register(
    gameMasterAddress: string,
    bytes32username: string,
    avatar: number
  ): Promise<ITransactionResponse> {
    const web3options = { from: this.account };
    return this.waitForTx(
      this.contract.methods
        .register(gameMasterAddress, bytes32username, avatar)
        .send(web3options)
    );
  }
  public estimateGas = {
    rollDices: (gameMasterAddress: string) => {
      return new Promise<IBigNumber>((resolve, reject) => {
        this.contract.methods
          .rollDices(gameMasterAddress)
          .estimateGas()
          .then((gas: number) => {
            resolve(new MyBigNumber(gas));
          })
          .catch(reject);
      });
    },
  };
  public rollDices(
    gameMasterAddress: string,
    options?: any
  ): Promise<ITransactionResponse> {
    let gasOptions =
      options && options.gasLimit ? { gas: +options.gasLimit } : {};
    const web3options = { ...gasOptions, from: this.account };
    return this.waitForTx(
      this.contract.methods.rollDices(gameMasterAddress).send(web3options)
    );
  }
  public play(
    gameMasterAddress: any,
    option: number
  ): Promise<ITransactionResponse> {
    const web3options = { from: this.account };
    return this.waitForTx(
      this.contract.methods.play(gameMasterAddress, option).send(web3options)
    );
  }
  protected translateEvent(
    eventName: string,
    eventData: any,
    callback: (...args: any[]) => void
  ) {
    // Not expected to be called
    throw new Error('Method not implemented.');
  }
}
