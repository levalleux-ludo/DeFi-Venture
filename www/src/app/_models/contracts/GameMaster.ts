import { IPlayer } from './../../_services/game-master-contract.service';
import { GameToken } from './GameToken';
import { async } from '@angular/core/testing';
import { ethers } from 'ethers';
import gameMasterABI from '../../../../../buidler/artifacts/GameMaster.json';

export enum eGameStatus {
  CREATED = 0,
  STARTED = 1,
  FROZEN = 2,
  ENDED = 3
}

export class GameMaster {
  contract: ethers.Contract;
  constructor(address: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(
      address,
      gameMasterABI.abi,
      signer
    );
  }

  public async getStatus(): Promise<eGameStatus> {
    return this.contract.getStatus();
  }

public async getNbPlayers(): Promise<number> {
  return this.contract.getNbPlayers();
}

public async getPlayers(): Promise<IPlayer[]> {
  const nbPlayers = await this.contract.getNbPlayers();
  const players = [];
  for (let i = 0; i < nbPlayers; i++) {
    const playerAddress = await this.contract.getPlayerAtIndex(i);
    const username = await this.contract.getUsername(playerAddress);
    const avatar = await this.contract.getAvatar(playerAddress);
    players.push({
      username: ethers.utils.parseBytes32String(username),
      address: playerAddress,
      avatar
    });
  }
  return players;
}

public async getNextPlayer(): Promise<string> {
  return this.contract.getNextPlayer();
}

public async isPlayerRegistered(playerAddress: string): Promise<boolean> {
  return this.contract.isPlayerRegistered(playerAddress);
}

public async getTokenAddress(): Promise<string> {
  return this.contract.getToken();
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
  return new Promise(async (resolve, reject) => {
    const tokenAddress = await this.getTokenAddress();
    await (new GameToken(tokenAddress, this.contract.signer)).approveMax(this.contract.address);
    this.contract.register(ethers.utils.formatBytes32String(username), avatar).then(async(response) => {
      console.log('Tx sent', response.hash);
      await response.wait().then(async(receipt) => {
        console.log('Tx validated', receipt.transactionHash);
        resolve();
      }).catch(e => reject(e));
    }).catch(e => reject(e));
  });
  }

}
