import { GameMasterContractService, IGameData } from './../../_services/game-master-contract.service';
import { Component, OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { ITokenData } from 'src/app/_services/game-token-contract.service';

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.scss']
})
export class PlayersTableComponent implements OnInit {

  @Input()
  public set gameData(gameData: IGameData) {
    gameData.playersPosition.forEach((position, player) => {
      this.setPlayerPosition(player, position);
    });
  }
  @Input()
  public set tokenData(tokenData: ITokenData) {
    tokenData.balances.forEach((balance, player) => {
      this.setPlayerBalance(player, balance.toString());
    });
  }
  _nextPlayer = undefined;
  _playersMap = new Map<string, {username: string, address: string, position: number, balance: string, avatar: number}>();
  constructor() { }

  ngOnInit(): void { }

  public set nextPlayer(value: string) {
    this._nextPlayer = value;
  }

  public setPlayerPosition(player: string, position: number) {
    this.checkInMap(player);
    this._playersMap.get(player).position = position;
  }

  public setPlayerBalance(player: string, balance: string) {
    this.checkInMap(player);
    this._playersMap.get(player).balance = balance;
  }

  public setPlayerUsername(player: string, username: string) {
    this.checkInMap(player);
    this._playersMap.get(player).username = username;
  }

  public setPlayerAvatar(player: string, avatar: number) {
    this.checkInMap(player);
    this._playersMap.get(player).avatar = avatar;
  }

  protected checkInMap(player: string) {
    if (!this._playersMap.has(player)) {
      this._playersMap.set(player, {username: '', address: player, position: 0, balance: '?', avatar: -1});
    }

  }


}
