import { BotServerService } from './../../_services/bot-server.service';
import { eGameStatus, GameMaster } from './../../_models/contracts/GameMaster';
import { GameTokenContractService } from './../../_services/game-token-contract.service';
import { INetwork } from './../../../environments/environment';
import { GameMasterContractService, GAME_STATUS, IPlayer } from './../../_services/game-master-contract.service';
import { Component, Input, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Utils } from 'src/app/_utils/utils';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-game-factory',
  templateUrl: './game-factory.component.html',
  styleUrls: ['./game-factory.component.scss'],
  encapsulation: ViewEncapsulation.None // required to get the component css applying to matsnackbar
})
export class GameFactoryComponent implements OnInit, OnDestroy {

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

  constructor(
    private portisL1Service: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private tokenContractService: GameTokenContractService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private dialog: MatDialog,
    private botServerService: BotServerService
  ) { }

  shortAddress = Utils.shortAddress;

  _network;
  gameFactory;
  games: Array<{
    gameMaster: string,
    status: string,
    nbPlayers: number,
    isRegistered: boolean,
    players: any[],
    isCompleted: boolean
  }> = [];
  isCreating = false;
  isRegistering = false;
  refreshing = false;
  addingBot = false;
  balanceEth : number;
  account;
  gameContracts = new Map<string, GameMaster>();
  avatarsImgs = [
    undefined,
    'nobody',
    'camel',
    'crypto-chip',
    'diamond',
    'rocket',
    'r1d1',
    'r2d2',
    'r3d3',
    'r4d4',
    'r5d5'
  ];
  eGameStatus = (statusStr: string) => eGameStatus[statusStr];
  status2String = (status: number) => eGameStatus[status];

  ngOnInit(): void {
    this.portisL1Service.onGameCreated.subscribe((gameMasterAddress) => {
      this.showInfo('A new game has been created');
      this.refreshGames();
    });
    this.portisL1Service.onConnect.subscribe(({network, account}) => {
      if (network) {
        this.account = account;
        this.portisL1Service.getL1BalanceETH(account).then((balanceETH) => {
          this.balanceEth = Utils.getBalanceAsNumber(balanceETH, Utils.ETH_decimals, 0.00001);
        }).catch(e => console.error(e));
      }
    });

    // this.portisL1Service.onConnect.subscribe(() => {
    //   this.network = this.portisL1Service.network;
    //   this.gameFactory = this.portisL1Service.contracts?.gameFactory;
    //   if (this.gameFactory) {
    //     this.refreshGames();
    //   }
    // });
  }

  ngOnDestroy(): void {
    for (const contract of this.gameContracts.values()) {
      for (const event of ['PlayerRegistered', 'StatusChanged']) {
        contract.removeAllListeners(event);
      }
    }
  }

  createGame() {
    this.isCreating = true;
    this.portisL1Service.createGame().then(() => {
      this.showSuccess('Game creation succeed !');
      this.refreshGames();
    }).catch((error) => {
      this.showError('Game creation has failed !');
    }).finally(() => {
      this.isCreating = false;
    })
  }

  refreshGames() {
      // const newGames = [];
      this.refreshing = true;
      this.portisL1Service.getGames().then((games) => {
        const toBeRemoved = Array.from(this.gameContracts.keys());
        for (let gameMaster of games) {
          let gameData = this.games.find(game => game.gameMaster === gameMaster);
          if (!gameData) {
            gameData = {
              gameMaster,
              status: '...',
              nbPlayers: 0,
              isRegistered: false,
              players: [],
              isCompleted: false
            };
            this.games.push(gameData);
          }
          let gameMasterContract: GameMaster;
          if (this.gameContracts.has(gameMaster)) {
            gameMasterContract = this.gameContracts.get(gameMaster);
            toBeRemoved.splice(toBeRemoved.indexOf(gameMaster), 1);
          } else {
            gameMasterContract = this.gameMasterContractService.getContract(gameMaster);
            gameMasterContract.on('PlayerRegistered', (newPlayer: string, _nbPlayers: number) => {
              this.refreshGames();
            });
            gameMasterContract.on('StatusChanged', (newStatus: number) => {
              this.refreshGames();
            });
            this.gameContracts.set(gameMaster, gameMasterContract);
          }
          const promises = [];
          let p;
          p = gameMasterContract.getStatus();
          promises.push(p);
          p.then(status => {
            gameData.status = GAME_STATUS[status];
          }).catch(e => console.error(e));
          p = gameMasterContract.getNbPlayers();
          promises.push(p);
          p.then(nbPlayers => {
            gameData.nbPlayers = nbPlayers;
          }).catch(e => console.error(e));
          p = gameMasterContract.isPlayerRegistered(this.portisL1Service.accounts[0]);
          promises.push(p);
          p.then(isRegistered => {
            gameData.isRegistered = isRegistered;
          }).catch(e => console.error(e));
          p = gameMasterContract.getPlayers();
          promises.push(p);
          p.then(players => {
            gameData.players = Array.from(players.values());
          }).catch(e => console.error(e));
          Promise.all(promises).then(() => {
            gameData.isCompleted = true;
          });
        }
        for (const oldGame of toBeRemoved) {
          const contract = this.gameContracts.get(oldGame);
          for (const event of ['PlayerRegistered', 'StatusChanged']) {
            contract.removeAllListeners(event);
          }
          this.gameContracts.delete(oldGame);
          this.gameContracts.delete(oldGame);
        }
      }).catch(e => {
        console.error(e);
      }).finally(() => {
        // this.games = newGames;
        this.refreshing = false;
      })
  }

  register(gameMaster: string) {
    // this.tokenContractService.approveMAX(gameMaster)
    this.isRegistering = true;
    RegisterFormComponent.showModal(this.dialog).then((result) => {
      this.gameMasterContractService.getContract(gameMaster).register(
        result.username,
        result.avatar
      ).then(() => {
        console.log('register called');
        this.showSuccess('Player is registered');
        this.refreshGames();
      }).catch((e) => {
        console.error(e);
        this.showError('Registering has failed !');
      }).finally(() => {
        this.isRegistering = false;
      });
    }).catch(() => {
      this.isRegistering = false;
    });
  }

  showSuccess(message: string) {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: ['success'],
    });

  }

  showInfo(message: string) {
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: ['info'],
    });

  }

  showError(message: string) {
    this.snackBar.open(message, '', {
      duration: 10000,
      panelClass: ['error'],
    });

  }

  callFaucet() {
    if (this.network.chainId === 80001) {
      this.refreshing = true;
      const body = {network: 'mumbai', address: this.account, token: 'maticToken'}
      this.http.post<{hash: string}>(
        'https://api.faucet.matic.network/getTokens',
        JSON.stringify(body),
        {
          headers: new HttpHeaders({'Content-Type': 'application/json' })
        }
      ).subscribe(({hash}) => {
        console.log('Response from Faucet', hash);
        setTimeout(() => {
          this.portisL1Service.getL1BalanceETH(this.account).then((balanceETH) => {
            this.balanceEth = Utils.getBalanceAsNumber(balanceETH, Utils.ETH_decimals, 0.00001);
          }).catch(e => console.error(e)).finally(() => {
            this.refreshing = false;
          });
        }, 5000);
      }, error => {
        console.error(error);
        this.refreshing = false;
      });
    }
  }

  addBot(gameMaster: string) {
    this.addingBot = true;
    this.botServerService.ready.then(() => {
      console.log('Calling bot Server API ...');
      this.botServerService.addBotToGame(gameMaster).then(() => {

      }).catch(e => {
        console.error(e);
      }).finally(() => {
        this.addingBot = false;
      })
    });
  }

}
