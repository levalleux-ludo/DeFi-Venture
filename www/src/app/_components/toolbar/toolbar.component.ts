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
      this.ethService.currentAccount.subscribe((accountData) => {
        this.balanceEth = ethers.utils.formatUnits(this.ethService.currentAccountValue?.balance, 'ether');
        this.tokenWatcherService.balanceOf('usdc', accountData.address).subscribe((usdc_bn) => {
          this.balanceUSDc = usdc_bn?.toString();
        });
      });

      // if (this.ethService.currentAccountValue) {

      //   this.tokenWatcherService.getBalance('usdc', this.ethService.currentAccountValue.address)
      //   .then(((usdc_bn) => {
      //     this.balanceUSDc = usdc_bn?.toString();
      //     console.log('toolbar update balanceUSDc', usdc_bn?.toString());
      //   })).catch(e => {
      //     this.balanceUSDc = '';
      //     console.log('toolbar update balanceUSDc : undefined');
      //   });
      // } else {
      //   this.balanceEth = '';
      //   this.balanceUSDc = '';
      // }
    });
  }

}
