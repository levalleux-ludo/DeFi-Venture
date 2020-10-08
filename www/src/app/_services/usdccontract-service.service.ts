import { TokenWatcherService } from './token-watcher.service';
import { Injectable } from '@angular/core';
import { SessionStorageService, StorageKeys } from './session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class USDCContractServiceService {

  private _address: string;

  constructor(
    private sessionStorageService: SessionStorageService,
    private tokenWatcherService: TokenWatcherService
  ) {
    this.setAddress(sessionStorageService.restore(StorageKeys.contracts.usdc));
  }

  public get address() {
    return this._address;
  }

  public async setAddress(address: string) {
    this._address = address;
    this.sessionStorageService.storeLocal(StorageKeys.contracts.usdc, this._address);
    this.tokenWatcherService.setContractAddress('usdc', address);
  }

}
