import { GameFactoryComponent } from './../game-factory/game-factory.component';
import { environment } from './../../../environments/environment';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-games-list',
  templateUrl: './games-list.component.html',
  styleUrls: ['./games-list.component.scss']
})
export class GamesListComponent implements OnInit {

  @ViewChild('gameFactory', {static: false})
  gameFactoryComponent: GameFactoryComponent;
  network;
  constructor(
    private portisService: PortisL1Service
  ) { }

  ngOnInit(): void {
    this.portisService.connect(
      environment.networks.l2
    ).then(() => {
      this.refresh();
    }).catch(e => console.error(e));
  }

  refresh() {
    this.network = this.portisService.network;
    this.gameFactoryComponent.network = this.portisService.network;
  }

}
