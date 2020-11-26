import { BigNumber } from 'ethers';
import { IGameData, IPlayer, ISpace } from './../../_services/game-master-contract.service';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-other-players',
  templateUrl: './other-players.component.html',
  styleUrls: ['./other-players.component.scss']
})
export class OtherPlayersComponent implements OnInit {

  _gameData: IGameData;
  @Input()
  set gameData(value: IGameData) {
    this._gameData = value;
    this.refresh();
  }

  _currentAccount: string;
  @Input()
  set currentAccount(value: string) {
    this._currentAccount = value;
    this.refresh();
  }

  _playground: ISpace[];
  @Input()
  set playground(value: ISpace[]) {
    this._playground = value;
    this.refresh();
  }

  _balances: Map<string, BigNumber>;
  @Input()
  set balances(value: Map<string, BigNumber>) {
    this._balances = value;
    this.refresh();
  }

  _portfolios: Map<string, number[]>
  @Input()
  set portfolios(value: Map<string, number[]>) {
    this._portfolios = value;
    this.refresh();
  }

  _players = [];

  constructor() { }

  ngOnInit(): void {
  }

  refresh() {
    this._players = [];
    if (this._gameData) {
      for (const player of this._gameData.players.values()) {
        if (player.address !== this._currentAccount) {
          this._players.push({
            ...player,
            assetIds: (this._portfolios?.has(player.address)) ? this._portfolios.get(player.address) : [],
            cash: (this._balances?.has(player.address)) ? this._balances.get(player.address).toString() : '0',
            debt: '0'
          });
        }
      }
    }
  }
}
