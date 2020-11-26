import { PortisL1Service } from './../../_services/portis-l1.service';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-portis-l1-page',
  templateUrl: './portis-l1-page.component.html',
  styleUrls: ['./portis-l1-page.component.scss']
})
export class PortisL1PageComponent implements OnInit {


  text = 'waiting ...';
  selectedNetwork;
  networks = [];
  gameFactory;
  greeter;
  account;
  greeter_message;
  games = [];
  constructor(
    private portisL1Service: PortisL1Service
  ) {
    for (let network of Object.keys(environment.networks)) {
      this.networks.push(environment.networks[network]);
    }
  }

  ngOnInit(): void {
    this.portisL1Service.ready.then(() => {
      this.text = 'Portis service is initialized';
      this.selectedNetwork = this.portisL1Service.network;
      this.refresh();
    });
  }

  changeNetwork() {
    const network = this.selectedNetwork;
    this.selectedNetwork = undefined;
    this.portisL1Service.connect(network).then(() => {
      this.refresh();
    });
  }

  refresh() {
    this.selectedNetwork = this.portisL1Service.network;
    this.gameFactory = this.portisL1Service.contracts?.gameFactory;
    this.greeter = this.portisL1Service.contracts?.greeter;
    this.account = this.portisL1Service.accounts ? this.portisL1Service.accounts[0] : undefined;
    if (this.gameFactory) {
      this.refreshGames();
    }
  }

  callGreeter() {
    this.portisL1Service.callGreeter().then((message) => {
      this.greeter_message = message;
    });
  }

  changeGreeter(message: string) {
    this.greeter_message = "";
    this.portisL1Service.changeGreeter(message).then(() => {
    }).finally(() => {
      this.callGreeter();
    });
  }

  createGame() {
    this.portisL1Service.createGame().then(() => {
      this.refreshGames();
    });
  }

  refreshGames() {
      this.games = [];
      this.portisL1Service.getGames().then((games) => {
        this.games = games;
      }).catch(e => {
        console.error(e);
      });
  }

  logout() {
    this.portisL1Service.logout();
  }


}
