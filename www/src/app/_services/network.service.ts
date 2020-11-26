import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment, INetwork } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  network: BehaviorSubject <INetwork>;
  constructor(public route: ActivatedRoute) {
    let network;
    const networkId = localStorage.getItem('network');
    if (networkId !== undefined) {
      network = environment.networks[networkId];
    }
    this.network = new BehaviorSubject(network || environment.networks[environment.defaultNetwork]);
    this.route.queryParams.subscribe((params) => {
      console.log('route params', params);
      if ((params.network !== undefined) && (environment.networks[params.network])) {
        this.network.next(environment.networks[params.network]);
        localStorage.setItem('network', params.network);
      }
    });
  }
}
