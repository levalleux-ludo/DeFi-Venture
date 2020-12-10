import { ethers } from 'ethers';

export interface ITransactionReceipt {
  transactionHash: string;
}

export interface ITransactionResponse {
  hash: string;
  wait(): Promise<ITransactionReceipt>;
}

export interface IContract {
  on(
    eventName: string,
    callback: (...args: any[]) => void
  );
  deployed(): Promise<IContract>;
}
