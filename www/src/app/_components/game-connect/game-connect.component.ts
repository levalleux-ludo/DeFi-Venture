import { GameService } from './../../_services/game.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-game-connect',
  templateUrl: './game-connect.component.html',
  styleUrls: ['./game-connect.component.scss']
})
export class GameConnectComponent implements OnInit {

  username: string = '';

  constructor(
    private gameService: GameService,
  ) { }

  ngOnInit(): void {
    this.gameService.getUsername().subscribe((username) => {
      this.username = username;
    });
  }

  setUsername(name: string) {
    this.gameService.setUsername(name);
  }

}
