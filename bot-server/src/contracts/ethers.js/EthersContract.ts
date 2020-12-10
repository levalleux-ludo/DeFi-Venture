import { ethers } from 'ethers';
import { IContract } from '../IContract';

export class EthersContract implements IContract {
  protected contract: ethers.Contract;
  constructor(address: string, abi: ethers.ContractInterface, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
    this.contract = new ethers.Contract(address, abi, signerOrProvider);
  }
  public on(eventName: string, callback: (...args: any[]) => void) {
    this.contract.on(eventName, callback);
  }
  public async deployed(): Promise<IContract> {
    await this.contract.deployed();
    return this;
  }
}
