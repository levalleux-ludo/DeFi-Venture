import { ContractInterface, ethers } from 'ethers';

export interface INetwork {
  name: string;
  portisId: string;
  chainId: number;
  nodeUrl: string;
  wssUrl: string;
}

function getBalanceAsNumber(
  bn: ethers.BigNumber,
  decimals: number,
  accuracy: number
): number {
  const r1 = ethers.BigNumber.from(10).pow(decimals - accuracy);
  const r2 = bn.div(r1);
  const r3 = r2.toNumber();
  const r4 = r3 / 10 ** accuracy;
  return r4;
}

export class Web3Provider {
  private _provider: ethers.providers.JsonRpcProvider;
  private _wallet: ethers.Wallet;

  public constructor(network: INetwork) {
    this._provider = new ethers.providers.StaticJsonRpcProvider(
      {
        // timeout: 180000,
        url: network.nodeUrl,
      },
      network
    );
    // this._provider = new ethers.providers.WebSocketProvider(
    //   network.wssUrl,
    //   network
    // );

    // console.log('pollingInterval', this._provider.pollingInterval);
    // this._provider.pollingInterval = 10000;

    this._wallet = ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC as string
    ).connect(this._provider);
    console.log('wallet', this._wallet.address, this._wallet.privateKey);
    this._wallet.getBalance().then((balance: ethers.BigNumber) => {
      console.log('current balance:', getBalanceAsNumber(balance, 18, 4));
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

  public getContract(address: string, abi: ContractInterface) {
    return new ethers.Contract(address, abi, this._provider);
  }
}
