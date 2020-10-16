import { TestCanvasComponent } from './../test-canvas/test-canvas.component';
import { DicesComponent } from './../dices/dices.component';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { ConnectionService } from './../../_services/connection.service';
import { GameMasterContractService, GAME_STATUS } from './../../_services/game-master-contract.service';
import { Component, Input, OnInit, ViewChild, NgZone } from '@angular/core';


@Component({
  selector: 'app-contract-game-master',
  templateUrl: './contract-game-master.component.html',
  styleUrls: ['./contract-game-master.component.scss']
})
export class ContractGameMasterComponent implements OnInit {

  // @Input()
  // set gameMaster(value: string) {
  //   if (value) {
  //     this.gameMasterContractService.setAddress(value).then(() => {
  //       this.updateContract();
  //     }).catch(e => {
  //       console.error(e);
  //     });
  //   }
  // }
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

  @ViewChild('dices', {static: false})
  dices: DicesComponent;
  @ViewChild('board', {static: false})
  board: TestCanvasComponent;

  constructor(
    private gameMasterContractService: GameMasterContractService,
    private connectionService: ConnectionService,
    private portisL1Service: PortisL1Service,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    // this.address = this.gameMasterContractService.address;
    this.gameMasterContractService.ready.then(() => {
      this.gameMasterContractService.onEvent.subscribe((event: any) => {
        this.events.push({log: event.type + event.value});
        this.updateContract();
      });
      this.updateContract();
    });
    this.portisL1Service.onConnect.subscribe(() => {
      this.currentAccount = this.portisL1Service.accounts[0];
    })
    // this.connectionService.connected.subscribe((connectionData) => {
    //   this.currentAccount = connectionData.address;
    //   this.currentUsername = connectionData.username;
    // });
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

  public setAccount(account: string) {
    this.currentAccount = account;
  }

  private updateContract() {
    if (this.gameMasterContractService.contract) {
      this.isAttached = true;
      // this.gameMasterContractService.contract.getOwner().then((owner) => {
      //   this.owner = owner;
      // }).catch(e => {
      //   console.error(e);
      // });
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
      const dice1 = Math.floor( 1 + Math.random() * 6);
      const dice2 = Math.floor( 1 + Math.random() * 6);
      console.log('dices', dice1, dice2);
      this.dices.dicePOWValue = dice1;
      this.dices.dicePOSValue = dice2;
      setTimeout(() => {
        this.moveBoard(dice1 + dice2);
      }, 100);
      }).catch((e) => {
      console.error(e);
    });
  }

  moveBoard(nbBlocks: number) {
    let nbSteps = 6 * nbBlocks;
    const interval = setInterval(() => {
      if (--nbSteps <= 0) {
        clearInterval(interval);
      }
      this.ngZone.run(() => {
        this.board.animate();
      });
    }, 250);
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
