import { INetwork } from './../../../environments/environment';
import { GameMasterContractService } from './../../_services/game-master-contract.service';
import { Component, Input, OnInit } from '@angular/core';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';

@Component({
  selector: 'app-game-factory',
  templateUrl: './game-factory.component.html',
  styleUrls: ['./game-factory.component.scss']
})
export class GameFactoryComponent implements OnInit {

  @Input()
  set network(value: INetwork) {
    this._network = this.portisL1Service.network;
    this.gameFactory = this.portisL1Service.contracts?.gameFactory;
    if (this.gameFactory) {
      this.refreshGames();
    }
  };
  get network() {
    return this._network;
  }
  _network;
  gameFactory;
  games = [];
  eGameStatus = {
    CREATED: 0,
    STARTED: 1,
    FROZEN: 2,
    ENDED: 3
  };

  constructor(
    private portisL1Service: PortisL1Service,
    private gameMasterContractService: GameMasterContractService
  ) { }

  ngOnInit(): void {
    // this.portisL1Service.onConnect.subscribe(() => {
    //   this.network = this.portisL1Service.network;
    //   this.gameFactory = this.portisL1Service.contracts?.gameFactory;
    //   if (this.gameFactory) {
    //     this.refreshGames();
    //   }
    // });
  }

  createGame() {
    this.portisL1Service.createGame().then(() => {
      this.refreshGames();
    });
  }

  refreshGames() {
      this.games = [];
      this.portisL1Service.getGames().then(async (games) => {
        for (let gameMaster of games) {
          const gameMasterContract = this.gameMasterContractService.getContract(gameMaster);
          const status = await gameMasterContract.getStatus();
          const nbPlayers = await gameMasterContract.getNbPlayers();
          const isRegistered = await gameMasterContract.isPlayerRegistered(this.portisL1Service.accounts[0]);
          this.games.push({gameMaster, status, nbPlayers, isRegistered});
        }
      }).catch(e => {
        console.error(e);
      });
  }

  register(gameMaster: string) {
    this.gameMasterContractService.getContract(gameMaster).register().then(() => {
      console.log('register called');
    }).catch((e) => {
      console.error(e);
    });
  }
}
