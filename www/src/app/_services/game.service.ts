import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SessionStorageService, StorageKeys } from './session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  _username = '';
  private _usernameSubject: BehaviorSubject<string>;


  constructor(private sessionStorageService: SessionStorageService) {
    this._username = this.sessionStorageService.restore(StorageKeys.username);
    this._usernameSubject = new BehaviorSubject(this._username);
  }

  public getUsername(): Observable<string> {
    return this._usernameSubject.asObservable();
  }

  public setUsername(name: string) {
    console.log('setUsername', name);
    this._username = name;
    this.sessionStorageService.storeLocal(StorageKeys.username, this._username);
    this._usernameSubject.next(this._username);
  }

}
