import { IPlayer, USER_DATA_FIELDS } from './../../_services/game-master-contract.service';
import { GameToken } from './GameToken';
import { ethers } from 'ethers';
import gameMasterABI from '../../../../../buidler/artifacts/GameMaster.json';
import gameContractsABI from '../../../../../buidler/artifacts/GameContracts.json';

export enum eGameStatus {
  CREATED = 0,
  STARTED = 1,
  FROZEN = 2,
  ENDED = 3
}

export class GameMaster {
  private contract: ethers.Contract;
  private gameContracts: ethers.Contract;
  private contractWithSigner: ethers.Contract;
  constructor(address: string, provider: ethers.providers.Provider, signer: ethers.Signer) {
    this.contract = new ethers.Contract(
      address,
      gameMasterABI.abi,
      provider
    );
    this.contractWithSigner = new ethers.Contract(
      address,
      gameMasterABI.abi,
      signer
    );
  }

  private async getContracts(): Promise<ethers.Contract> {
    if (this.gameContracts === undefined) {
      const gameContractsAddr = await this.contract.contracts();
      this.gameContracts = new ethers.Contract(
        gameContractsAddr,
        gameContractsABI.abi,
        this.contract.provider
      );
    }
    return this.gameContracts;
  }

  public async getStatus(): Promise<eGameStatus> {
    return this.contract.status();
  }

  public async getNbPlayers(): Promise<number> {
    return this.contract.nbPlayers();
  }

  public async getPlayers(): Promise<Map<string, IPlayer>> {
    const players = new Map<string, IPlayer>();
    const indexes = [];
    const nbPlayers = await this.contract.nbPlayers();
    for (let i = 0; i < nbPlayers; i++) {
      indexes.push(i);
    }
    const playersData = await this.contract.getPlayersData(indexes);
    const status = await this.contract.status();
    let winner;
    if (status === eGameStatus.ENDED) {
      winner = await this.contract.getWinner();
    }
    for (let i = 0; i < nbPlayers; i++) {
      const playerAddress = playersData[USER_DATA_FIELDS.address][i];
      const username = playersData[USER_DATA_FIELDS.username][i];
      const avatar = playersData[USER_DATA_FIELDS.avatar][i];
      const hasLost = playersData[USER_DATA_FIELDS.hasLost][i];
      const hasWon = (status === eGameStatus.ENDED) && (winner === playerAddress);
      players.set(playerAddress, {
        username: ethers.utils.parseBytes32String(username),
        address: playerAddress,
        avatar,
        hasLost,
        hasWon
      });
    }
    return players;
  }

  public async getNextPlayer(): Promise<string> {
    return this.contract.nextPlayer();
  }

  public async isPlayerRegistered(playerAddress: string): Promise<boolean> {
    return this.contract.isPlayerRegistered(playerAddress);
  }

  public async getTokenAddress(): Promise<string> {
    const contracts = await this.getContracts();
    return contracts.getToken();
  }

  public on(eventName: string, callback: ethers.providers.Listener): GameMaster {
    this.contract.on(eventName, callback);
    return this;
  }

  public removeAllListeners(eventName: string): GameMaster {
    this.contract.removeAllListeners(eventName);
    return this;
  }

  public async register(username: string, avatar: number): Promise<void> {
    const pollingInterval1 = (this.contract.provider as ethers.providers.Web3Provider).pollingInterval;
    const pollingInterval2 = (this.contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval;
    const account = await this.contractWithSigner.signer.getAddress();
    const waitRegisterEvent = new Promise<void>((resolve2, reject2) => {
      const onPlayerRegistered = (player: string, nbPlayers: number) => {
        if (player === account) {
          this.contractWithSigner.off('PlayerRegistered', onPlayerRegistered);
          (this.contract.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval1;
          (this.contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
          resolve2();
        }
      }
      this.contractWithSigner.on('PlayerRegistered', onPlayerRegistered);
    });
    return new Promise(async (resolve, reject) => {
      const contracts = await this.getContracts();
      const tokenAddress = await contracts.getToken();
      (this.contract.provider as ethers.providers.Web3Provider).pollingInterval = 1000;
      (this.contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = 1000;
      try {
        const transferManagerAddress = await contracts.getTransferManager();
        await (new GameToken(tokenAddress, this.contractWithSigner.signer)).approveMax(transferManagerAddress);
        await this.contractWithSigner.register(ethers.utils.formatBytes32String(username), avatar).then(async(response) => {
          console.log('Tx sent', response.hash);
          (this.contract.provider as ethers.providers.Web3Provider).pollingInterval = 1000;
          (this.contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = 1000;
          await response.wait().then(async(receipt) => {
            console.log('Tx validated', receipt.transactionHash);
            await waitRegisterEvent;
            resolve();
          });
        });
      } catch (e) {
        (this.contract.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval1;
        (this.contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
        reject(e);
      }
    });
  }

}
