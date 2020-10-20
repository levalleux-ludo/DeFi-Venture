import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ISpace } from 'src/app/_services/game-master-contract.service';
import startups from '../../../assets/startups.json';

@Component({
  selector: 'app-my-cash',
  templateUrl: './my-cash.component.html',
  styleUrls: ['./my-cash.component.scss'],
})
export class MyCashComponent implements OnInit {

  @Input()
  cash = '100000';

  @Input()
  debt = '4572';

  @Input()
  assetsValue = '45575';


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
