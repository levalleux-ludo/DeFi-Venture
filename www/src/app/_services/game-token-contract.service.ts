import { Injectable } from '@angular/core';
import { Contract, BigNumber, ethers } from 'ethers';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { PortisL1Service } from './portis-l1.service';

import GameTokenJSON from '../../../../buidler/artifacts/GameToken.json';
import { AbstractContractService } from './AbstractContractService';

export interface ITokenData {
  balances: Map<string, BigNumber>;
  decimals: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameTokenContractService extends AbstractContractService<ITokenData> {

  protected balances = new Map<string, BigNumber>();

  constructor(
    protected portisL1Service: PortisL1Service
  ) {
    super(GameTokenJSON, portisL1Service);
  }

  public async observeAccount(address: string): Promise<BigNumber> {
    let balance = ethers.constants.Zero;
    if (!this.balances.has(address)) {
      this.balances.set(address, balance);
    }
    await this.ready.then(async () => {
      balance = await this._contract.balanceOf(address);
      this.balances.set(address, balance);
    });
    console.log('observeAccount', address, 'isReady', this.isReady, 'balance', balance.toString());
    return balance;
  }

  protected subscribeToEvents() {
    this._contract.on('Transfer', (from: string, to: string, value: BigNumber) => {
      this.recordEvent({ type: 'Transfer', value: {from, to, value} });
    });
    this._contract.on('Approval', (owner: string, spender: string, value: BigNumber) => {
      this.recordEvent({ type: 'Approval', value: {owner, spender, value} });
    });
  }


  protected unsubscribeToEvents() {
    this._contract.removeAllListeners({topics: ['Transfer', 'Approval']});
  }

  protected async resetData() {
    this.balances = new Map<string, BigNumber>();
  }

  protected async refreshData(): Promise<{data: ITokenData, hasChanged: boolean}> {
    console.log("token contract refreshData");
    const decimals = await this._contract.decimals();
    const totalSupply = await this._contract.totalSupply();
    for (const address of this.balances.keys()) {
      await this.observeAccount(address);
    }
    const tokenData = {
      balances: this.balances,
      decimals
    };
    return {data: tokenData, hasChanged: true};

  }

  protected async _onContractSet(value: ethers.Contract) {
  }

}
