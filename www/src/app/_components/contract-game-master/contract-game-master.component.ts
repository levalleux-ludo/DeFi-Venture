import { ConnectionService } from './../../_services/connection.service';
import { GameMasterContractService, GAME_STATUS } from './../../_services/game-master-contract.service';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-contract-game-master',
  templateUrl: './contract-game-master.component.html',
  styleUrls: ['./contract-game-master.component.scss']
})
export class ContractGameMasterComponent implements OnInit {

  address = '';
  owner: string;
  status: string;
  nbPlayers: number;
  nextPlayer: '';
  isAttached = false;
  alreadyRegistered = false;
  currentAccount = '';
  currentUsername = '';
  players = [];
  events = [];

  constructor(
    private gameMasterContractService: GameMasterContractService,
    private connectionService: ConnectionService
  ) { }

  ngOnInit(): void {
    this.address = this.gameMasterContractService.address;
    this.gameMasterContractService.ready.then(() => {
      this.gameMasterContractService.onEvent.subscribe((event: any) => {
        this.events.push({log: event.type + event.value});
        this.updateContract();
      });
      this.updateContract();
    });
    this.connectionService.connected.subscribe((connectionData) => {
      this.currentAccount = connectionData.address;
      this.currentUsername = connectionData.username;
    });
  }

  public setAddress(address: string) {
    this.address = address;
    try {
      this.gameMasterContractService.setAddress(address).then(() => {
        this.updateContract();
      }).catch(e => {
        console.error(e);
      })
    } catch(e) {
      console.error(e);
    }
  }

  private updateContract() {
    if (this.gameMasterContractService.contract) {
      this.isAttached = true;
      this.gameMasterContractService.contract.getOwner().then((owner) => {
        this.owner = owner;
      }).catch(e => {
        console.error(e);
      });
      this.gameMasterContractService.contract.getStatus().then((status) => {
        if ((status >= 0) && (status < GAME_STATUS.length)) {
          this.status = GAME_STATUS[status];
        } else {
          this.status = 'unknown' + status.toString();
        }
      }).catch(e => {
        console.error(e);
      });
      this.gameMasterContractService.contract.getNbPlayers().then((nbPlayers) => {
        this.nbPlayers = nbPlayers;
        this.updatePlayers();
      }).catch(e => {
        console.error(e);
      });
      this.gameMasterContractService.contract.getNextPlayer().then((nextPlayer) => {
        this.nextPlayer = nextPlayer;
      }).catch(e => {
        console.error(e);
      });

    } else {
      this.isAttached = false;
    }
  }

  async updatePlayers() {

    let alreadyRegistered = false;
    let players = [];
    for (let i = 0; i < this.nbPlayers; i++) {
      const playerAddress = await this.gameMasterContractService.contract.getPlayerAtIndex(i);
      const isitme = (this.currentAccount === playerAddress);
      if (isitme) {
        alreadyRegistered = true;
      }
      players.push({
        username: isitme ? this.currentUsername : '???',
        address: playerAddress,
        position: 0
      });
    }
    this.alreadyRegistered = alreadyRegistered;
    this.players = players;

  }

  register() {
    this.gameMasterContractService.contract.register().then(() => {
      console.log('register called');
    }).catch((e) => {
      console.error(e);
    });
  }

  start() {
    this.gameMasterContractService.contract.start().then(() => {
      console.log('start called');
    }).catch((e) => {
      console.error(e);
    });
  }

  play() {
    this.gameMasterContractService.contract.play().then(() => {
      console.log('play called');
    }).catch((e) => {
      console.error(e);
    });
  }

  public get canRegister(): boolean {
    return ((this.status === GAME_STATUS[0]) && !this.alreadyRegistered);
  }

  public get canStart(): boolean {
    return ((this.status === GAME_STATUS[0]) && (this.nbPlayers >= 2));
  }

  public get canPlay(): boolean {
    return ((this.status === GAME_STATUS[1]) && (this.nextPlayer === this.currentAccount));
  }

}
