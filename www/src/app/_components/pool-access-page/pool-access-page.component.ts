import { environment } from './../../../environments/environment';
import { PortisL1Service } from './../../_services/portis-l1.service';
import { Component, OnInit } from '@angular/core';
import { ethers, BigNumber } from 'ethers';
import { Utils } from 'src/app/_utils/utils';

@Component({
  selector: 'app-pool-access-page',
  templateUrl: './pool-access-page.component.html',
  styleUrls: ['./pool-access-page.component.scss']
})
export class PoolAccessPageComponent implements OnInit {

  isConnected = false;
  isConnecting = false;
  isLoggingOut = false;
  isBuyingUSDC = false;
  isStaking = false;
  network;
  address;
  balanceETH: number;
  balanceUSDC: number;
  balancePOOL: number;
  constructor(
    private portisService: PortisL1Service
  ) { }

  ngOnInit(): void {
    this.portisService.ready.then(() => {
      this.network = this.portisService.network;
      this.refresh();
      this.ConnectL1();
    });
  }

  refresh() {
    this.network = this.portisService.network;
    this.address = this.portisService.accounts ? this.portisService.accounts[0] : undefined;
    this.isConnected = (this.network !== undefined);
    this.isConnecting = false;
    this.isLoggingOut = false;
    this.balanceETH = 0;
    this.balanceUSDC = 2;
    this.balancePOOL = 0;
    if (this.network) {
      this.portisService.getL1BalanceETH(this.address).then((balanceETH) => {
        this.balanceETH = Utils.getBalanceAsNumber(balanceETH, Utils.ETH_decimals, 0.00001);
      }).catch(e => console.error(e));
    }
  }

  ConnectL1() {
    this.isConnecting = true;
    this.portisService.ready.then(() => {
      this.portisService.connect(
      environment.networks.l1
    ).then(() => {
      this.refresh();
    }).catch(e => console.error(e));
  });
}

  Logout() {
    this.isLoggingOut = true;
    this.portisService.logout().then(() => {
      this.refresh();
    });
  }

  notEnoughUSDC() {
    return (this.balanceUSDC === undefined) || ( this.balanceUSDC < 10 );
  }

  notInPool() {
    return (this.balancePOOL === undefined) || ( this.balancePOOL <= 0 );
  }

  buyUSDC() {
    this.isBuyingUSDC = true;
    setTimeout(() => {
      this.balanceUSDC += 10;
      this.isBuyingUSDC = false;
    }, 2000);
  }

  stakeInPool() {
    if (this.notEnoughUSDC()) {
      throw Error('not enough USDC');
    }
    this.isStaking = true;
    setTimeout(() => {
      this.balanceUSDC -= 10;
      this.balancePOOL += 1;
      this.isStaking = false;
    }, 2000);
  }

}
