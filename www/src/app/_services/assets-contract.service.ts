import { Injectable } from '@angular/core';
import { BigNumber, ethers } from 'ethers';

import GameAssetsJSON from '../../../../buidler/artifacts/GameAssets.json';
import { AbstractContractService } from './AbstractContractService';
import { PortisL1Service } from './portis-l1.service';

export interface IAssetsData {
  portfolios: Map<string, number[]>;
  owners: Map<number, string>;
}

@Injectable({
  providedIn: 'root'
})
export class AssetsContractService extends AbstractContractService<IAssetsData> {

  protected portfolios = new Map<string, number[]>();
  protected owners = new Map<number, string>();

  constructor(
    protected portisL1Service: PortisL1Service
  ) {
    super(GameAssetsJSON, portisL1Service);
   }

   public async observeAccount(address: string): Promise<number[]> {
    const portfolio = [];
    if (!this.portfolios.has(address)) {
      this.portfolios.set(address, portfolio);
    }
    if (this.isReady) {
      const nbAssets = (await this._contract.balanceOf(address)).toNumber();
      for (let index = 0; index < nbAssets; index++) {
        const assetId = (await this._contract.tokenOfOwnerByIndex(address, index)).toNumber();
        portfolio.push(assetId);
        this.owners.set(assetId, address);
      }
      this.portfolios.set(address, portfolio);
    }
    console.log('observeAccount', address, 'isReady', this.isReady, 'portfolio', portfolio);
    return portfolio;
  }

  protected subscribeToEvents() {
    this._contract.on('Transfer', (from: string, to: string, tokenId: BigNumber) => {
      this.recordEvent({ type: 'Transfer', value: {from, to, tokenId} });
    });
  }

  protected async refreshData() {
    console.log("assets contract refreshData");
    const totalSupply = await this._contract.totalSupply();
    for (const address of this.portfolios.keys()) {
      await this.observeAccount(address);
    }
    const assetsData = {
      portfolios: this.portfolios,
      owners: this.owners
    };
    this._onUpdate.next(assetsData);
  }

  public async getOwner(assetId: number): Promise<string> {
    const tokenId = BigNumber.from(assetId);
    if (await this._contract.exists(tokenId)) {
      return await this._contract.ownerOf(tokenId);
    }
    return undefined;
  }

}