import { GameService } from './game.service';
import { EthereumService, EthAccountData } from './ethereum.service';
import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

export interface ConnectionData {
  address: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  private _connected = new BehaviorSubject<ConnectionData>(null);
  private currentAccount: EthAccountData;
  private username: string;

  constructor(
    private ethService: EthereumService,
    private gameService: GameService
    ) {
    // ethService.currentAccount.subscribe((currentAccount) => {
    //   this.currentAccount = currentAccount;
    //   this.updateConnectionStatus();
    // });
    // gameService.getUsername().subscribe((username) => {
    //   this.username = username;
    //   this.updateConnectionStatus();
    // });
  }

  public get connected(): Observable<ConnectionData> {
    return this._connected.asObservable();
  }

  private updateConnectionStatus() {
    let connectionData = null;
    if ((this.username != undefined)
     && (this.username != null)
     && (this.username != '')
     && (this.currentAccount != undefined)
     && (this.currentAccount != null)) {
       connectionData = {
         address: this.currentAccount.address,
         username: this.username
       };
     }

    this._connected.next(connectionData);
  }
}
