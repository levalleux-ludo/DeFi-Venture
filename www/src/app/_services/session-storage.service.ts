import { Injectable } from '@angular/core';

export const StorageKeys = {
  username: 'username',
  contracts: {
    gameMaster: 'gameMasterContract',
    usdc: 'usdcContract'
  }
};


@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  constructor() { }

  storeSession(key: string, value: string) {
    if ((value === undefined) || (value === null)) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  }

  storeLocal(key: string, value: string) {
    if ((value === undefined) || (value === null)) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }

  restore(key: string) {
    let value = sessionStorage.getItem(key);
    if (value) {
      return value;
    }
    return localStorage.getItem(key);
  }
}
