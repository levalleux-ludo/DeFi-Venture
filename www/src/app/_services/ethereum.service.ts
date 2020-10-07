import { Inject, Injectable } from '@angular/core';
import { InjectionToken } from '@angular/core';
import { BigNumber, getDefaultProvider, providers, Signer } from 'ethers';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export const PROVIDER = new InjectionToken<providers.BaseProvider>('Ethereum Provider', {
  providedIn: 'root',
  factory: () => getDefaultProvider(environment.network)
});

export const WEB3PROVIDER = new InjectionToken<any>('Web3 provider', {
  providedIn: 'root',
  factory: () => (window as any).ethereum
});

export interface EthAccountData {
  address: string;
  balance: BigNumber;
  signer: Signer;
}

@Injectable({ providedIn: 'root' })
export class Provider extends providers.Web3Provider {

  constructor(@Inject(WEB3PROVIDER) web3Provider) {
    super(web3Provider);
  }
}

@Injectable({
  providedIn: 'root'
})
export class EthereumService {

  private _currentAccountSubject = new BehaviorSubject<EthAccountData>(null);
  private web3Provider;

  constructor(@Inject(WEB3PROVIDER) web3Provider) {
    this.web3Provider = new Provider(web3Provider);
    this.checkCurrentAccount();
  }

  private async checkCurrentAccount() {
    console.log('get currentAccount()');
    const signer = this.web3Provider.getSigner();
    console.log('Signer', signer);
    const address = await signer.getAddress();
    console.log('address', address);
    const balance = await signer.getBalance();
    this._currentAccountSubject.next({address, balance, signer});
  }

  public get currentAccount(): Observable<EthAccountData> {
    return this._currentAccountSubject.asObservable();
  }

  public get currentAccountValue(): EthAccountData | undefined {
    return this._currentAccountSubject.value;
  }

}
