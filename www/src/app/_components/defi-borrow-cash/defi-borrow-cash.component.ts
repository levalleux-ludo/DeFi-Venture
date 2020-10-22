import { AssetsContractService } from './../../_services/assets-contract.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { eSpaceType, GameMasterContractService } from 'src/app/_services/game-master-contract.service';
import { GameTokenContractService } from 'src/app/_services/game-token-contract.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import startups from '../../../assets/startups.json';

@Component({
  selector: 'app-defi-borrow-cash',
  templateUrl: './defi-borrow-cash.component.html',
  styleUrls: ['./defi-borrow-cash.component.scss']
})
export class DefiBorrowCashComponent implements OnInit {

  @Input()
  cash = 0;
  @Input()
  collateral = 0;
  @Input()
  debt = 0;
  get allowance() {return 0.75 * this.collateral};
  borrowedAmount = 0;
  selectedAsset;
  assets = [
    {assetId: 0, name: "asset #1", value: 100},
    {assetId: 1, name: "asset #2", value: 140},
    {assetId: 2, name: "asset #3", value: 160}
  ];
  lockedAssets = [
    {assetId: 1, name: "asset #2", value: 140},
    {assetId: 2, name: "asset #3", value: 160}
  ]
  playground;
  portfolio;
  @Output()
  validate = new EventEmitter<{
    borrowedAmount: number,
    lockedAssetIds: number[]
  }>();
  constructor(
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private gameTokenContractService: GameTokenContractService,
    private assetsContractService: AssetsContractService,
  ) { }

  ngOnInit(): void {
    this.portisService.onConnect.subscribe(({network, account}) => {
      this.gameMasterContractService.onUpdate.subscribe((gameData) => {
        if (gameData) {
          this.playground = gameData.playground;
          this.refreshAssets();
        }
      });
      this.assetsContractService.onUpdate.subscribe((assetData) => {
        if (assetData) {
          this.portfolio = assetData.portfolios.get(account);
          this.refreshAssets();
        }
      });

      this.gameTokenContractService.onUpdate.subscribe((tokenData) => {
        if (tokenData) {
          if (tokenData.balances.has(account)) {
            this.cash = tokenData.balances.get(account).toNumber();
          }
        }
      });
    });
  }

  refreshAssets() {
    if (this.portfolio && this.playground) {
      const assets = [];
      const lockedAssets = [];
      for (const assetId of this.portfolio) {
        const space
         = this.playground.find(aspace =>
           ((aspace.type >= eSpaceType.ASSET_CLASS_1)
            && (aspace.type <= eSpaceType.ASSET_CLASS_4)
            && (aspace.assetId === assetId)));
        if (space) {
          const asset = startups.startups[assetId];
          if (this.isLocked(assetId)) {
            lockedAssets.push({
              assetId,
              name: asset.name,
              value: space.assetPrice
            });
          } else {
            assets.push({
              assetId,
              name: asset.name,
              value: space.assetPrice
            });
          }
        }
      }
      this.assets = assets;
      this.lockedAssets = lockedAssets;
      this.computeCollateral();
    }
  }

  isLocked(assetId: number): boolean {
    return false;
  }

  lockAsset(asset) {
    this.assets = this.assets.filter(an_asset => (an_asset !== asset));
    if (!this.lockedAssets.includes(asset)) {
      this.lockedAssets.push(asset);
    }
    this.computeCollateral();
  }
  unlockAsset(asset) {
    this.lockedAssets = this.lockedAssets.filter(an_asset => (an_asset !== asset));
    if (!this.assets.includes(asset)) {
      this.assets.push(asset);
    }
    this.computeCollateral();
  }

  computeCollateral() {
    let collateral = 0;
    for (const asset of this.lockedAssets) {
      collateral += asset.value;
    }
    this.collateral = collateral;
    if (this.borrowedAmount > this.allowance) {
      this.borrowedAmount = this.allowance;
    }
  }

  apply() {
    this.validate.emit({
      borrowedAmount: this.borrowedAmount,
      lockedAssetIds: this.lockedAssets.map(asset => asset.assetId)
    });
  }

}
