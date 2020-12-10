import { IContract, ITransactionResponse } from './IContract';

export interface IBigNumber {
  mul(n: any): IBigNumber;
  toString(): string;
  toNumber(): number;
}

export interface IBotPlayer extends IContract {
  estimateGas: {
    rollDices: (gameMasterAddress: string) => Promise<IBigNumber>;
  };
  register(
    gameMasterAddress: string,
    bytes32username: string,
    avatar: number
  ): Promise<ITransactionResponse>;
  rollDices(
    gameMasterAddress: string,
    options?: any
  ): Promise<ITransactionResponse>;
  play(gameMasterAddress, option: number): Promise<ITransactionResponse>;
}
