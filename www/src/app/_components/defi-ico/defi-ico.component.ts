import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-defi-ico',
  templateUrl: './defi-ico.component.html',
  styleUrls: ['./defi-ico.component.scss']
})
export class DefiIcoComponent implements OnInit {

  selectedAsset;
  tokenType: 'security'|'utility';
  nbTokens = 5;
  fairPrice;
  minPrice;
  assets = [
    {assetId: 0, name: "asset #1", value: 100},
    {assetId: 1, name: "asset #2", value: 140},
    {assetId: 2, name: "asset #3", value: 160}
  ];
  @Output()
  validate = new EventEmitter<{
    assetId: number,
    tokenType: 'security'|'utility',
    quantity: number,
    fairPrice: number,
    minPrice: number,
  }>();

  constructor() { }

  ngOnInit(): void {
  }

  issueTokens() {
    this.validate.emit({
      assetId: this.selectedAsset?.assetId,
      tokenType: this.tokenType,
      quantity: this.nbTokens,
      fairPrice: this.fairPrice,
      minPrice: this.minPrice
    });
  }
}
