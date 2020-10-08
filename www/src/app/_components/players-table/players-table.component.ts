import { GameMasterContractService } from './../../_services/game-master-contract.service';
import { Component, OnInit } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.scss']
})
export class PlayersTableComponent implements OnInit {

  @Input() nextPlayer: '';
  @Input() players = [
    {username: 'toto', address: '0xDDDDDDDDDDDDDDDDDDDDD', position: 0},
    {username: 'tata', address: '0xDDDDDDDDDDDDDDDDDDDDD', position: 0},
    {username: 'titi', address: '0x1b05Ba94aCc29d0D66a0114a0bC7Daa139153BE5', position: 0}
  ];
  constructor() { }

  ngOnInit(): void { }

}
