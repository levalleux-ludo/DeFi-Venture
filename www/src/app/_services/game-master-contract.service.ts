import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { SessionStorageService, StorageKeys } from './session-storage.service';
import { Injectable } from '@angular/core';
import { Contract } from 'ethers';
import { EthereumService } from './ethereum.service';

export const GAME_STATUS = [
  'CREATED',
  'STARTED',
  'FROZEN',
  'ENDED'
];

import GameMasterJSON from '../../../../buidler/artifacts/GameMaster.json';

@Injectable({
  providedIn: 'root'
})
export class GameMasterContractService {
  private _address: string;
  private _contract: Contract;
  private isReady = false;
  private readySubject = new Subject<void>();
  private _events = [];
  private _eventsSubject = new Subject();

  constructor(
    private ethService: EthereumService,
    private sessionStorageService: SessionStorageService
  ) {
    this.setAddress(sessionStorageService.restore(StorageKeys.contracts.gameMaster));
   }

  public get address() {
    return this._address;
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

  public async setAddress(address: string) {
    this._address = address;
    if ((this._address !== undefined) && (this._address !== null) && (this._address !== '')) {
      await (new Contract(address, GameMasterJSON.abi, this.ethService.currentAccountValue?.signer)).deployed().then(contract => {
        this._contract = contract;
        this.subscribeToEvents();
      }).catch(e => {
        console.error(e);
        this._contract = undefined;
      });
    } else {
      this._contract = undefined;
    }
    this.sessionStorageService.storeLocal(StorageKeys.contracts.gameMaster, this._address);
    this.readySubject.next();
  }

  public get contract(): Contract {
    return this._contract;
  }

  public get events(): any[] {
    return this._events;
  }

  public get onEvent(): Observable<any> {
    return this._eventsSubject.asObservable();
  }

  private subscribeToEvents() {
    this._contract.on('StatusChanged', (newStatus) => {
      this.recordEvent({ type: 'StatusChanged', value: newStatus });
    });
    this._contract.on('PlayerRegistered', (newPlayer) => {
      this.recordEvent({ type: 'PlayerRegistered', value: newPlayer });
    });
    this._contract.on('PlayPerformed', (player) => {
      this.recordEvent({ type: 'PlayPerformed', value: player });
    });
  }

  private recordEvent(event: any) {
    this._events.push(event);
    this._eventsSubject.next(event);
  }




}
