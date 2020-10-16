import { Utils } from 'src/app/_utils/utils';
import { IGame } from './../_models/IGame';
import { async } from '@angular/core/testing';
import { environment, INetwork, IContracts } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import greeterABI from '../../../../buidler/artifacts/Greeter.json';
import gameFactoryABI from '../../../../buidler/artifacts/GameFactory.json';
import { Contract } from 'web3-eth-contract';

import Portis from '@portis/web3';
import Web3 from 'web3';
import { ethers, BigNumber } from 'ethers';

// const portis = new Portis('9e5dce20-042d-456f-bfca-4850e23555c8', 'goerli');
// const web3 = new Web3(portis.provider);

// export const NETWORKS = [
//   { name: 'L1 (Goerli)', id: 'goerli' },
//   { name: 'L2 (Mumbai)', id: 'maticMumbai' }
// ];

const PORTIS_API_KEY = '9e5dce20-042d-456f-bfca-4850e23555c8';

@Injectable({
  providedIn: 'root'
})
export class PortisL1Service {

  private isReady = false;
  private readySubject = new Subject<void>();
  private connectSubject = new Subject<any>();

  private _network: INetwork;
  private portis: Portis;
  private web3: Web3;
  private ethersProvider: ethers.providers.Web3Provider;
  private ethersSigner;
  private _accounts;
  private _account;
  private _contracts: IContracts;
  private greeter;
  private gameFactory;

  constructor() {
    this.initialize().then(() => {
      this.isReady = true;
      this.readySubject.next();
    });
  }

  public get ready(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.readySubject.subscribe(() => {
          resolve();
        });
      }
    });
  }

  public get network(): INetwork {
    return this._network;
  }

  public get contracts(): IContracts {
    return this._contracts;
  }

  public get accounts() {
    return this._accounts;
  }

  public signer() {
    return this.ethersSigner;
  }

  public get onConnect(): Observable<any> {
    return this.connectSubject.asObservable();
  }

  private initEthers(network: INetwork) {
    // this.portis.provider.isMetaMask = true; // https://github.com/portis-project/web-sdk/issues/8
    this.ethersProvider = new ethers.providers.Web3Provider(
      this.portis.provider,
      network
    );
    this.ethersProvider.getNetwork().then(async (ethersNetwork) => {
      console.log('ETHERS network', ethersNetwork);
      // Get the current suggested gas price (in wei)...
      const gasPrice = await this.ethersProvider.getGasPrice();
      // { BigNumber: "46000000000" }

      // ...often this gas price is easier to understand or
      // display to the user in gwei (giga-wei, or 1e9 wei)
      console.log('ETHERS gas price', ethers.utils.formatUnits(gasPrice, 'gwei'));

      this.ethersSigner = this.ethersProvider.getSigner();
      this._account = await this.ethersSigner.getAddress();
      console.log('ETHERS signer', this.ethersSigner.getAddress());
    });
  }

  public async connect(network: INetwork) {
    return new Promise((resolve) => {
      if (!this.portis) {
        this.portis = new Portis(PORTIS_API_KEY, network as any);
        this.web3 = new Web3(this.portis.provider);
        this.initEthers(network);
      } else {
        if (this._network === network) {
          resolve();
          return;
        }
        this.reset();
        this.portis.changeNetwork(network as any);
        this.initEthers(network);
      }
      this._network = network;
      this.web3.eth.getAccounts((error, accounts) => {
        console.log(accounts);
        this._accounts = accounts;
        this._contracts = environment.contracts[this._network.chainId];
        resolve();
        this.connectSubject.next(this._network);
      });
    });
  }
  public async logout() {
    if (this.portis) {
      await this.portis.logout().then(({error, result}) => {
        if (result) {
          this.reset();
        } else {
          console.error(error);
        }
      });
    }
    return;
  }

  public async getL1BalanceETH(account: string): Promise<BigNumber> {
    return new Promise((resolve, reject) => {
      this.web3.eth.getBalance(account).then((balanceStr) => {
        const bn = BigNumber.from(balanceStr);
        resolve(bn);
      }).catch(e => reject(e));
    });
  }

  private reset() {
    this._network = undefined;
    this.gameFactory = undefined;
    this._accounts = [];
    this._contracts = undefined;
    this.greeter = undefined;
  }

  private async initialize() {
    return new Promise((resolve) => {
       resolve();
    });
  }

  public async callGreeter(): Promise<string> {
    if (!this.greeter) {
      // this.greeter = this.getContract(greeterABI.abi, this.contracts.greeter);
      this.greeter = this.getEthersContract(greeterABI.abi, this.contracts.greeter);
    }
    // return this.greeter.methods.greet().call();
    return this.greeter.greet();
  }

  public async changeGreeter(message: string) {
    if (!this.greeter) {
      // this.greeter = this.getContract(greeterABI.abi, this.contracts.greeter);
      this.greeter = this.getEthersContract(greeterABI.abi, this.contracts.greeter);
    }
    return new Promise(async (resolve, reject) => {
      await this.greeter.estimateGas.setGreeting(message).then(async (gas) => {
        console.log('estimatedGas:', gas.toString());
        await this.ethersProvider.getSigner().getGasPrice().then(async (gasPrice) => {
          console.log('gasPrice:', gasPrice.toString());

          await this.greeter.setGreeting(
            // message, {nonce: 1, gas: gas.mul(2).toString(), gasPrice: gasPrice.mul(2).toString()}).then(async(response) => {
            message).then(async(response) => {
            console.log('Tx sent', response.hash);
            await response.wait().then(async(receipt) => {
              console.log('Tx validated', receipt.transactionHash);
              resolve();
            }).catch(e => reject(e));
          }).catch(e => reject(e));
        });
      });
      // this.greeter.methods.setGreeting(message).send({from: this._accounts[0], gasPrice: this._network.gasPrice, gas: this._network.gasLimit})
      // .on('transactionHash', function(hash){
      //   console.log('hash', hash);
      // })
      // .on('confirmation', function(confirmationNumber, receipt){
      //   console.log('receipt', receipt, 'confirmationNumber', confirmationNumber);
      // })
      // .on('receipt', function(receipt){
      //   resolve();
      // })
      // .on('error', function(error, receipt) {
      //   // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      //   console.error(error, receipt);
      //   reject();
      // });
    });
  }

  public getContract(contractAbi: any, contractAddress: string): Contract {
    console.log('get contract at ', contractAddress);
    return new this.web3.eth.Contract(
        contractAbi,
        contractAddress
      );
  }

  public getEthersContract(contractAbi: any, contractAddress: string) {
    return new ethers.Contract(
      contractAddress,
      contractAbi,
      this.ethersProvider.getSigner()
    );
  }

  public async createGame() {
    if (!this.gameFactory) {
      this.gameFactory = this.getContract(gameFactoryABI.abi, this.contracts.gameFactory);
    }
    return new Promise((resolve, reject) => {
      this.gameFactory.methods.create().send({from: this._accounts[0], gasPrice: this._network.gasPrice, gas: this._network.gasLimit})
      .on('transactionHash', function(hash){

      })
      .on('confirmation', function(confirmationNumber, receipt){

      })
      .on('receipt', function(receipt){
        resolve();
      })
      .on('error', function(error, receipt) {
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.error(error, receipt);
        reject();
      });
    });
  }

  public async getGames(): Promise<string[]> {
    if (!this.gameFactory) {
      this.gameFactory = this.getContract(gameFactoryABI.abi, this.contracts.gameFactory);
    }
    return new Promise((resolve, reject) => {
      this.gameFactory.methods.nbGames().call().then(async (nbGames) => {
        const games = [];
        for (let i = 0; i < nbGames; i++) {
          await this.gameFactory.methods.getGameAt(i).call().then((game) => {
            games.push(game);
          }).catch((e) => {
            reject(e);
          });
        }
        resolve(games);
      }).catch((e) => {
        reject(e);
      });
    });
  }

}
