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

public async getNextPlayer(): Promise<string> {
  return this.contract.getNextPlayer();
}

public async isPlayerRegistered(playerAddress: string): Promise<boolean> {
  return this.contract.isPlayerRegistered(playerAddress);
}

public async getTokenAddress(): Promise<string> {
  return this.contract.getToken();
}

public async register(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const tokenAddress = await this.getTokenAddress();
    await (new GameToken(tokenAddress, this.contract.signer)).approveMax(this.contract.address);
    this.contract.register().then(async(response) => {
      console.log('Tx sent', response.hash);
      await response.wait().then(async(receipt) => {
        console.log('Tx validated', receipt.transactionHash);
        resolve();
      }).catch(e => reject(e));
    }).catch(e => reject(e));
  });
  }

}
