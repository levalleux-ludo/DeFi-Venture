import { ethers } from 'ethers';

export interface INetwork {
  name: string;
  portisId: string;
  chainId: number;
  nodeUrl: string;
}

export class Web3Provider {
  private _provider: ethers.providers.JsonRpcProvider;
  private _wallet: ethers.Wallet;

  public constructor(network: INetwork) {
    this._provider = new ethers.providers.JsonRpcProvider(
      network.nodeUrl,
      network
    );
    this._wallet = ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC as string
    ).connect(this._provider);
    console.log('wallet', this._wallet.address, this._wallet.privateKey);
    this._wallet.getBalance().then((balance: ethers.BigNumber) => {
      console.log('current balance:', balance.toString());
    });
  }

  public get provider(): ethers.providers.JsonRpcProvider {
    return this._provider;
  }

  public get signer(): ethers.Signer {
    return this._wallet;
  }

  public get currentAccount(): string {
    return this._wallet.address;
  }
}
