import { Component, OnInit } from '@angular/core';
import { ethers } from 'ethers';
import { EthereumService } from 'src/app/_services/ethereum.service';

@Component({
  selector: 'app-ethereum-connect',
  templateUrl: './ethereum-connect.component.html',
  styleUrls: ['./ethereum-connect.component.scss']
})

export class EthereumConnectComponent implements OnInit {

  address: string;
  balance = '125.124';

  constructor(private ethService: EthereumService) { }

  ngOnInit(): void {
    // this.ethService.currentAccount.subscribe((currentAccount) => {
    //   this.address = currentAccount?.address;
    //   this.balance = currentAccount ? ethers.utils.formatUnits(currentAccount?.balance, 'ether') : '';
    // });
  }

  logout() {
    console.error('Not implemented');
  }

}
