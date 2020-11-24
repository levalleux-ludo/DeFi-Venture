import { DiscordService } from './../../_services/discord.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { TokenWatcherService } from './../../_services/token-watcher.service';
import { EthereumService } from './../../_services/ethereum.service';
import { ConnectionService } from './../../_services/connection.service';
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { ethers } from 'ethers';
import { Utils } from 'src/app/_utils/utils';

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
  discordUsername: string;
  network;
  constructor(
    private connectionService: ConnectionService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private ethService: EthereumService,
    private tokenWatcherService: TokenWatcherService,
    private portisService: PortisL1Service,
    private discordService: DiscordService
  ) {
    this.matIconRegistry.addSvgIcon(
      `ethereum-eth-logo`,
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/ethereum/ethereum-eth-logo.svg")
    );
    this.matIconRegistry.addSvgIcon(
      `matic-logo`,
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/matic/matic-logo-square/matic-logo-square.svg")
    );
  }

  ngOnInit(): void {
    // this.connectionService.connected.subscribe((connectionData) => {
    //   this.ethAccount = connectionData?.address;
    //   this.username = connectionData?.username;
    //   this.ethService.currentAccount.subscribe((accountData) => {
    //     if (accountData) {
    //       this.balanceEth = ethers.utils.formatUnits(this.ethService.currentAccountValue.balance, 'ether');
    //       this.tokenWatcherService.balanceOf('usdc', accountData.address).subscribe((usdc_bn) => {
    //         this.balanceUSDc = usdc_bn?.toString();
    //       });
    //     }
    //   });

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
    // });
    this.portisService.onConnect.subscribe(({network, account}) => {
      this.network = network;
      this.ethAccount = account;
      if (this.network) {
        this.portisService.getL1BalanceETH(this.ethAccount).then((balanceETH) => {
          this.balanceEth = Utils.getBalanceAsNumber(balanceETH, Utils.ETH_decimals, 0.00001).toString();
        }).catch(e => console.error(e));
      }

    });
    this.portisService.onLogout.subscribe(() => {
      this.network = undefined;
      this.ethAccount = undefined;
      this.balanceEth = '';
      this.balanceUSDc = '';
    });
    setInterval(() => {
      if (this.network && this.ethAccount) {
        this.portisService.getL1BalanceETH(this.ethAccount).then((balanceETH) => {
          this.balanceEth = Utils.getBalanceAsNumber(balanceETH, Utils.ETH_decimals, 0.00001).toString();
        });
      }
    }, 30000);
    this.discordService.userData.subscribe((userData) => {
      if (userData) {
        this.discordUsername = userData.username;
      }
    })
  }

  logout() {
    this.portisService.logout();
  }

  connectDiscord() {
    this.discordService.jumpToLogin(this.portisService.accounts[0])
    .then((userId) => {
      console.log('User successfully logged on Discord', userId);
    })
    .catch((e) => {
      console.error(e);
    });
  }


}
