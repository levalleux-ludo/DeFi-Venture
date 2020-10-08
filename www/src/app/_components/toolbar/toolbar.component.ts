import { TokenWatcherService } from './../../_services/token-watcher.service';
import { EthereumService } from './../../_services/ethereum.service';
import { ConnectionService } from './../../_services/connection.service';
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { ethers } from 'ethers';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  ethAccount: string;
  username: string;
  balanceEth: string;
  balanceUSDc: string;
  constructor(
    private connectionService: ConnectionService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private ethService: EthereumService,
    private tokenWatcherService: TokenWatcherService
  ) {
    this.matIconRegistry.addSvgIcon(
      `ethereum-eth-logo`,
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/ethereum-eth-logo.svg")
    );
  }

  ngOnInit(): void {
    this.connectionService.connected.subscribe((connectionData) => {
      this.ethAccount = connectionData?.address;
      this.username = connectionData?.username;
      if (this.ethService.currentAccountValue) {
        this.balanceEth = ethers.utils.formatUnits(this.ethService.currentAccountValue?.balance, 'ether');
        this.tokenWatcherService.getBalance('usdc', 'goerli', this.ethService.currentAccountValue.address)
        .then(((usdc_bn) => {
          this.balanceUSDc = usdc_bn.toString();
        }));
      } else {
        this.balanceEth = '';
        this.balanceUSDc = '';
      }
    });
  }

}
