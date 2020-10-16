import { EthereumService } from 'src/app/_services/ethereum.service';
import { USDCContractServiceService } from './../../_services/usdccontract-service.service';
import { TokenWatcherService } from './../../_services/token-watcher.service';
import { ConnectionService } from './../../_services/connection.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contract-usdc',
  templateUrl: './contract-usdc.component.html',
  styleUrls: ['./contract-usdc.component.scss']
})
export class ContractUsdcComponent implements OnInit {

  address = '';
  balanceUSDc: string;

  constructor(
    private ethService: EthereumService,
    private uSDCContractServiceService: USDCContractServiceService,
    private tokenWatcherService: TokenWatcherService
  ) { }

  ngOnInit(): void {
    // this.address = this.uSDCContractServiceService.address;
    // this.updateContract(this.ethService.currentAccountValue?.address);
    // this.ethService.currentAccount.subscribe((accountData) => {
    //   this.updateContract(accountData.address);
    //   this.tokenWatcherService.balanceOf('usdc', accountData.address).subscribe((balance) => {
    //     this.balanceUSDc = balance?.toString();
    //   });
    // });
  }

  // public setAddress(address: string) {
  //   this.address = address;
  //   try {
  //     this.uSDCContractServiceService.setAddress(address).then(() => {
  //       this.updateContract(this.ethService.currentAccountValue.address);
  //     }).catch(e => {
  //       console.error(e);
  //     })
  //   } catch(e) {
  //     console.error(e);
  //   }
  // }

  // private updateContract(currentAccount: string) {
  //   // if (currentAccount) {
  //   //   this.tokenWatcherService.getBalance('usdc', currentAccount)
  //   //   .then(((usdc_bn) => {
  //   //     this.balanceUSDc = usdc_bn?.toString();
  //   //     console.log('card update balanceUSDc', usdc_bn?.toString());
  //   //   }));
  //   // }
  // }

}
