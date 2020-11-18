import { AssetsContractService, IAssetsData } from './assets-contract.service';
import { Injectable } from '@angular/core';
import { eSpaceType, GameMasterContractService, IGameData, ISpace } from './game-master-contract.service';
import startups from '../../assets/startups.json';
import { PortisL1Service } from './portis-l1.service';

export interface IAsset {
  assetId: number;
  name: string;
  value: number;
  isLocked: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class AssetsLibraryService {

  playground: ISpace[];
  portfolio;
  assets = new Map<number, IAsset>();

  constructor(
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private assetsContractService: AssetsContractService
  ) {
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

  getAssetFromId(assetId: number): IAsset | undefined {
    return this.assets.get(assetId);
  }

  getAssetAtSpace(spaceId: number): IAsset | undefined {
    const space = this.playground[spaceId];
    if (this.isAsset(space)) {
      return this.getAssetFromId(space.assetId);
    }
    return undefined;
  }

  refreshAssets() {
    if (this.portfolio && this.playground) {
      this.assets = new Map();
      for (const assetId of this.portfolio) {
        const space
         = this.playground.find(aspace =>
           (this.isAsset(aspace)
            && (aspace.assetId === assetId)));
        if (space) {
          const asset = startups.startups[assetId];
          this.assets.set(assetId, {
            assetId,
            name: asset.name,
            value: space.assetPrice,
            isLocked: this.isLocked(assetId)
          });
        }
      }
    }
  }

  isAsset(space: ISpace) {
    return (space !== undefined)
    && (space.type >= eSpaceType.ASSET_CLASS_1)
    && (space.type <= eSpaceType.ASSET_CLASS_4);
  }

  isLocked(assetId: number): boolean {
    return false;
  }
}
