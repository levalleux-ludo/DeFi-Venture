import { GameMasterContractService } from './../../_services/game-master-contract.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { GameService } from './../../_services/game.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-game-connect',
  templateUrl: './game-connect.component.html',
  styleUrls: ['./game-connect.component.scss']
})
export class GameConnectComponent implements OnInit {

  username: string = '';
  gameMaster;
  network;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute, // required to parse th current URL and find the game's id
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService
  ) { }

  ngOnInit(): void {
    this.gameService.getUsername().subscribe((username) => {
      this.username = username;
    });
    this.portisService.onConnect.subscribe(network => {
      this.network = network;
    });
    this.gameMaster = this.route.snapshot.paramMap.get('id');
    this.portisService.connect(
      environment.networks.l2
    ).then(() => {
      this.network = this.portisService.network;
      this.gameMasterContractService.setAddress(this.gameMaster).then(() => {

      });
    }).catch(e => console.error(e));
  }

  setUsername(name: string) {
    this.gameService.setUsername(name);
  }

}
