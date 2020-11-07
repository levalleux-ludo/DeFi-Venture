import { MatDialog } from '@angular/material/dialog';
import { InvestFormComponent } from './../invest-form/invest-form.component';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { IPlayer, ISpace } from 'src/app/_services/game-master-contract.service';
import startups from '../../../assets/startups.json';

@Component({
  selector: 'app-my-cash',
  templateUrl: './my-cash.component.html',
  styleUrls: ['./my-cash.component.scss'],
})
export class MyCashComponent implements OnInit {

  @Input()
  cash = '0';

  @Input()
  debt = '0';

  @Input()
  staked = '0';

  @Input()
  assetsValue = '0';

  @Input()
  player: IPlayer;

  @Input()
  showAssets = false;

  avatarsImgs = [
    undefined,
    'nobody',
    'camel',
    'crypto-chip',
    'diamond',
    'rocket',
    'r1d1',
    'r2d2',
    'r3d3',
    'r4d4',
    'r5d5'
  ];

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

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
  }

  buildAssets() {
    const assets = [];
    let assetsValue = 0;
    for(const assetId of this._assetIds) {
      let assetValue;
      if (this._playground) {
        const space = this._playground.find(space => space.assetId === assetId);
        assetValue = space?.assetPrice;
        assetsValue += assetValue;
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
    this.assetsValue = assetsValue.toString();
  }

  invest(assetId: number, assetName: string) {
    InvestFormComponent.showModal(this.dialog, {assetId, assetName}).then(() => {})
  }
}
