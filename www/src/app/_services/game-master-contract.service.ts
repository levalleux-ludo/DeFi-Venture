import { SessionStorageService, StorageKeys } from './session-storage.service';
import { Injectable } from '@angular/core';
import { Contract } from 'ethers';
import { GameMaster } from '../_contracts/game-master';
import { EthereumService } from './ethereum.service';

export const GAME_STATUS = [
  'CREATED',
  'STARTED',
  'FROZEN',
  'ENDED'
];

@Injectable({
  providedIn: 'root'
})
export class GameMasterContractService {

  private _address: string;
  private _contract: GameMaster;

  constructor(
    private ethService: EthereumService,
    private sessionStorageService: SessionStorageService
  ) {
    this.setAddress(sessionStorageService.restore(StorageKeys.contracts.gameMaster));
   }

  public get address() {
    return this._address;
  }

  public setAddress(address: string) {
    this._address = address;
    if ((this._address !== undefined) && (this._address !== null) && (this._address !== '')) {
      this._contract = new GameMaster(address, this.ethService.currentAccountValue?.signer);
    } else {
      this._contract = undefined;
    }
    this.sessionStorageService.storeLocal(StorageKeys.contracts.gameMaster, this._address);
  }

  public get contract(): Contract {
    return this._contract?.contract;
  }


}
