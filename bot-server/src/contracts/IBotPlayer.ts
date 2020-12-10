import { IContract, ITransactionResponse } from './IContract';

export interface IBigNumber {
  mul(n: any): IBigNumber;
  toString(): string;
  toNumber(): number;
}

export interface IBotPlayer extends IContract {
  register(gameMasterAddress: string, bytes32username: string, avatar: number): Promise<ITransactionResponse>;
  estimateGas: {rollDices: (gameMasterAddress: string) => Promise<IBigNumber>};
  rollDices(gameMasterAddress: string, options?: any): Promise<ITransactionResponse>;
  play(gameMasterAddress, option: number): Promise<ITransactionResponse>;
}
