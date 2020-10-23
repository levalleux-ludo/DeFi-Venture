import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AssetsContractService } from 'src/app/_services/assets-contract.service';
import { GameMasterContractService, eSpaceType } from 'src/app/_services/game-master-contract.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import startups from '../../../assets/startups.json';

@Component({
  selector: 'app-defi-ico',
  templateUrl: './defi-ico.component.html',
  styleUrls: ['./defi-ico.component.scss']
})
export class DefiIcoComponent implements OnInit {

  playground;
  portfolio;
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

  constructor(
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private assetsContractService: AssetsContractService
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
    });
  }

  refreshAssets() {
    if (this.portfolio && this.playground) {
      const assets = [];
      for (const assetId of this.portfolio) {
        const space
         = this.playground.find(aspace =>
           ((aspace.type >= eSpaceType.ASSET_CLASS_1)
            && (aspace.type <= eSpaceType.ASSET_CLASS_4)
            && (aspace.assetId === assetId)));
        if (space) {
          const asset = startups.startups[assetId];
          assets.push({
            assetId,
            name: asset.name,
            value: space.assetPrice
          });
        }
      }
      this.assets = assets;
    }
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
