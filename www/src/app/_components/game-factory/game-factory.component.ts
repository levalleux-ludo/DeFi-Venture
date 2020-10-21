import { eGameStatus } from './../../_models/contracts/GameMaster';
import { GameTokenContractService } from './../../_services/game-token-contract.service';
import { INetwork } from './../../../environments/environment';
import { GameMasterContractService } from './../../_services/game-master-contract.service';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
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
  eGameStatus = (statusStr: string) => eGameStatus[statusStr];
  status2String = (status: number) => eGameStatus[status];
  isCreating = false;
  isRegistering = false;
  refreshing = false;
  balanceEth : number;
  account;

  constructor(
    private portisL1Service: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private tokenContractService: GameTokenContractService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private dialog: MatDialog
  ) { }

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
      this.games = [];
      this.refreshing = true;
      this.portisL1Service.getGames().then(async (games) => {
        const newGames = [];
        for (let gameMaster of games) {
          const gameMasterContract = this.gameMasterContractService.getContract(gameMaster);
          const status = await gameMasterContract.getStatus();
          const nbPlayers = await gameMasterContract.getNbPlayers();
          const isRegistered = await gameMasterContract.isPlayerRegistered(this.portisL1Service.accounts[0]);
          newGames.push({gameMaster, status, nbPlayers, isRegistered});
        }
        this.games = newGames;
      }).catch(e => {
        console.error(e);
      }).finally(() => {
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

}
