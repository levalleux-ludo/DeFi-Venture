import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { config } from './../config';
import { ContractInterface, ethers } from 'ethers';
import { IContract } from '../contracts/IContract';
import { IGameFactory } from '../contracts/IGameFactory';
import { IGameMaster } from '../contracts/IGameMaster';
import { IBotPlayer } from '../contracts/IBotPlayer';
import { BotPlayer as EthersBotPlayerContract } from '../contracts/ethers.js/BotPlayer';
import { GameFactory as EthersGameFactoryContract } from '../contracts/ethers.js/GameFactory';
import { GameMaster as EthersGameMasterContract } from './../contracts/ethers.js/GameMaster';
import { BotPlayer as WebJSBotPlayerContract } from '../contracts/web3.js/BotPlayer';
import { GameFactory as WebJSGameFactoryContract } from '../contracts/web3.js/GameFactory';
import { GameMaster as WebJSGameMasterContract } from './../contracts/web3.js/GameMaster';
import HDWalletProvider from '@truffle/hdwallet-provider';
import { runInThisContext } from 'vm';


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

export interface Web3Provider {

  getNetwork(): Promise<{name: string, chainId: number}>;

  getCurrentAccount(): Promise<string>;

  getGameFactoryContract(address: string, abi: any): IGameFactory;

  getGameMasterContract(address: string, abi: any): IGameMaster;

  getBotPlayerContract(address: string, abi: any): IBotPlayer;

}

export class EthersWeb3Provider implements Web3Provider {
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

  public async getNetwork(): Promise<{name: string, chainId: number}> {
    return this._provider.getNetwork();
  }

  public async getCurrentAccount(): Promise<string> {
    return this._wallet.address;
  }

  public getGameFactoryContract(address: string, abi: ContractInterface): IGameFactory {
    return new EthersGameFactoryContract(address, abi, this._wallet);
  }

  public getGameMasterContract(address: string, abi: ContractInterface): IGameMaster {
    return new EthersGameMasterContract(address, abi, this._provider)
  }

  public getBotPlayerContract(address: string, abi: ContractInterface): IBotPlayer {
    return new EthersBotPlayerContract(address, abi, this._wallet);
  }

}

export class WebJSWeb3Provider implements Web3Provider {
  private _web3: Web3;
  private _provider: HDWalletProvider;
  private _web3_2;

  public constructor(private network: INetwork) {
    this._provider = new HDWalletProvider({mnemonic: process.env.MNEMONIC as string, providerOrUrl: network.nodeUrl});
    this._web3 = new Web3(this._provider);
    this._web3_2 = new Web3(network.wssUrl);
  }

  public async getNetwork(): Promise<{name: string, chainId: number}> {
    return this.network;
  }

  public async getCurrentAccount(): Promise<string> {
    return this._provider.getAddress(0);
  }

  public getGameFactoryContract(address: string, abi: AbiItem[]): IGameFactory {
    return new WebJSGameFactoryContract(address, abi, this._web3_2);
  }

  public getGameMasterContract(address: string, abi: AbiItem[]): IGameMaster {
    return new WebJSGameMasterContract(address, abi, this._web3_2)
  }

  public getBotPlayerContract(address: string, abi: AbiItem[]): IBotPlayer {
    return new WebJSBotPlayerContract(address, abi, this._web3, this._provider.getAddress(0));
  }

}
