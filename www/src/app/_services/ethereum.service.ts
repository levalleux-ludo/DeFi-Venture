import { NgZone } from '@angular/core';
import { Inject, Injectable } from '@angular/core';
import { InjectionToken } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BigNumber, getDefaultProvider, providers, Signer } from 'ethers';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

export const PROVIDER = new InjectionToken<providers.BaseProvider>('Ethereum Provider', {
  providedIn: 'root',
  factory: () => getDefaultProvider('1')
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

  // navigationSubscription: Subscription;
  constructor(
    @Inject(WEB3PROVIDER) web3Provider,
    private router: Router,
    private ngZone: NgZone
  ) {
    super(web3Provider);
    web3Provider.on('chainChanged', this.onChainChanged);
    web3Provider.on('networkChanged', this.onNetworkChanged);
    web3Provider.on('accountsChanged', this.onAccountsChanged);

  //   // subscribe to the router events. Store the subscription so we can
  //  // unsubscribe later.
  //   this.navigationSubscription = this.router.events.subscribe((e: any) => {
  //   // If it is a NavigationEnd event re-initalise the component
  //   if (e instanceof NavigationEnd) {
  //     this.initialiseInvites();
  //   }
  // });
  }
  onChainChanged = (chainId: any) => {
    console.log("ETH EVENT: chainChanged", chainId);
    this.reloadCurrentPage();
  }
  onNetworkChanged = (networkId: any) => {
    console.log("ETH EVENT: networkChanged", networkId);
    this.reloadCurrentPage();
  }
  onAccountsChanged = (accounts: any) => {
    console.log("ETH event accounts:", accounts);
  }
  reloadCurrentPage() {
    (window as any).location.reload();
    // let currentUrl = this.router.url;
    // console.log('reload current page at url', currentUrl);
    // this.ngZone.run(() => {
    //   this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
    //       this.router.navigateByUrl(currentUrl + '?refresh=1');
    //   });
    // });
  }
}

@Injectable({
  providedIn: 'root'
})
export class EthereumService {

  // private _currentAccountSubject = new BehaviorSubject<EthAccountData>(null);
  // private web3Provider;

  // constructor(
  //   @Inject(WEB3PROVIDER) web3Provider
  // ) {
  //   web3Provider.on('chainChanged', this.onChainChanged);
  //   web3Provider.on('networkChanged', this.onNetworkChanged);
  //   web3Provider.on('accountsChanged', this.onAccountsChanged);
  //   this.web3Provider = new providers.Web3Provider(web3Provider);

  //   this.checkCurrentAccount();
  // }

  // private onChainChanged = (chainId: any) => {
  //   console.log("ETH EVENT: chainChanged", chainId);
  //   this.reloadCurrentPage();
  // }
  // private onNetworkChanged = (networkId: any) => {
  //   console.log("ETH EVENT: networkChanged", networkId);
  //   this.reloadCurrentPage();
  // }
  // private onAccountsChanged = (accounts: any) => {
  //   console.log("ETH event accounts:", accounts);
  //   this.checkCurrentAccount();
  // }
  // private reloadCurrentPage() {
  //   (window as any).location.reload();
  // }

  // private async checkCurrentAccount() {
  //   console.log('get currentAccount()');
  //   const signer = this.web3Provider.getSigner();
  //   console.log('Signer', signer);
  //   const address = await signer.getAddress();
  //   console.log('address', address);
  //   const balance = await signer.getBalance();
  //   this._currentAccountSubject.next({address, balance, signer});
  // }

  // public get currentAccount(): Observable<EthAccountData> {
  //   return this._currentAccountSubject.asObservable();
  // }

  // public get currentAccountValue(): EthAccountData | undefined {
  //   return this._currentAccountSubject.value;
  // }

}

