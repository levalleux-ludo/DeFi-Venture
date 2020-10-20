import { ISpace } from './../../_services/game-master-contract.service';
import { Component, Input, OnInit } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';

import startups from '../../../assets/startups.json';

@Component({
  selector: 'app-my-assets',
  templateUrl: './my-assets.component.html',
  styleUrls: ['./my-assets.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MyAssetsComponent implements OnInit {

  _assets = [];
  _assetIds = [];
  @Input()
  set assetIds(value: number[]) {
    this._assetIds = value;
    this.buildAssets();
  }

  _playground: ISpace[];
  @Input()
  set playground(value: ISpace[]) {
    this._playground = value;
    this.buildAssets();
  }

  columnsToDisplay = ['name', 'value'];
  expandedElement;


  constructor() { }

  ngOnInit(): void {
  }

  buildAssets() {
    const assets = [];
    for(const assetId of this._assetIds) {
      let assetValue;
      if (this._playground) {
        const space = this._playground.find(space => space.assetId === assetId);
        assetValue = space?.assetPrice;
      }
      assets.push({
        assetId,
        name: startups.startups[assetId].name,
        detail: startups.startups[assetId].detail,
        image: `assets/blocks/block_${startups.startups[assetId].image}`,
        value: assetValue
      });
    }
    this._assets = assets;
  }

}
