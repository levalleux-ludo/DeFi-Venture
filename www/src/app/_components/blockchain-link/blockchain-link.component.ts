import { INetwork } from './../../../environments/environment';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-blockchain-link',
  templateUrl: './blockchain-link.component.html',
  styleUrls: ['./blockchain-link.component.scss']
})
export class BlockchainLinkComponent implements OnInit {

  @Input()
  link: string;
  @Input()
  network: INetwork;
  @Input()
  type: 'address'|'tx' = 'address';

  constructor() { }

  ngOnInit(): void {
  }

}
