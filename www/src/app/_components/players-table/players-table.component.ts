import { GameMasterContractService } from './../../_services/game-master-contract.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.scss']
})
export class PlayersTableComponent implements OnInit {

  nextPlayer: '';
  players = [
    {username: 'toto', address: '0xDDDDDDDDDDDDDDDDDDDDD', position: 0},
    {username: 'tata', address: '0xDDDDDDDDDDDDDDDDDDDDD', position: 0},
    {username: 'titi', address: '0x1b05Ba94aCc29d0D66a0114a0bC7Daa139153BE5', position: 0}
  ];
  constructor(
    private gameMasterContractService: GameMasterContractService
  ) { }

  ngOnInit(): void {
    this.gameMasterContractService.contract.getNextPlayer().then((nextPlayer) => {
      this.nextPlayer = nextPlayer;
    }).catch(e => {
      console.error(e);
    });
  }

}
