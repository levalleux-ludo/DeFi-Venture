import { PlayersTableComponent } from './../players-table/players-table.component';
import { Utils } from './../../_utils/utils';
import { GameTokenContractService, ITokenData } from './../../_services/game-token-contract.service';
import { GameMasterContractService, GAME_STATUS, IGameData } from './../../_services/game-master-contract.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { GameService } from './../../_services/game.service';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DicesComponent } from '../dices/dices.component';
import { TestCanvasComponent } from '../test-canvas/test-canvas.component';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { first, map, shareReplay } from 'rxjs/operators';
import { element } from 'protractor';
import { BigNumber } from 'ethers';

@Component({
  selector: 'app-game-connect',
  templateUrl: './game-connect.component.html',
  styleUrls: ['./game-connect.component.scss']
})
export class GameConnectComponent implements OnInit, OnDestroy, AfterViewInit {

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
  .pipe(
    map(result => result.matches),
    shareReplay()
  );

  username: string = '';
  gameMaster;
  network;
  gameData: IGameData;
  tokenData: ITokenData;
  currentAccount;
  events = [];
  position = 0;
  tokenDecimals: number;
  balances: Map<string, BigNumber>;
  playground;

  @ViewChild('dices', {static: false})
  dices: DicesComponent;
  @ViewChildren('board')
  private Boards: QueryList<TestCanvasComponent>;
  @ViewChild('board', {static: false})
  board: TestCanvasComponent;
  @ViewChild('content', {static: true})
  content: ElementRef;
  @ViewChild('players', {static: false})
  players: PlayersTableComponent;
  resizeObservable$: Observable<Event>;
  clickObservable$: Observable<Event>;
  resizeSubscription$: Subscription;
  board_width;
  board_height;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private gameService: GameService,
    private route: ActivatedRoute, // required to parse th current URL and find the game's id
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private tokenContractService: GameTokenContractService,
  ) { }
  ngAfterViewInit(): void {
    this.board_width = this.content.nativeElement.clientWidth;
    this.board_height = this.content.nativeElement.clientHeight;
  }

  ngOnDestroy(): void {
    this.resizeSubscription$.unsubscribe();
  }

  ngOnInit(): void {
    this.gameService.getUsername().subscribe((username) => {
      this.username = username;
    });
    this.portisService.onConnect.subscribe(({network, account}) => {
      this.network = network;
      this.currentAccount = account;
      console.log('set currentAccount', this.currentAccount);
    });
    this.gameMaster = this.route.snapshot.paramMap.get('id');
    this.portisService.connect(
      environment.networks.l2
    ).then(() => {
      this.network = this.portisService.network;
      this.gameMasterContractService.setAddress(this.gameMaster).then(() => {
        this.gameMasterContractService.onUpdate.subscribe((gameData) => {
          this.refreshGameData(gameData);
          this.tokenContractService.setAddress(gameData.tokenAddress).then(() => {
            this.tokenContractService.onUpdate.subscribe((tokenData) => {
              this.refreshTokenData(tokenData);
            });
          });
        });
      });
    }).catch(e => console.error(e));
    this.board_width = this.content.nativeElement.clientWidth;
    this.board_height = this.content.nativeElement.clientHeight;
    this.resizeObservable$ = fromEvent(window, 'resize');
    this.clickObservable$ = fromEvent(this.content.nativeElement, 'click');
    this.clickObservable$.subscribe(evt => {
      console.log('click', evt);
    });
    this.resizeSubscription$ = this.resizeObservable$.subscribe(evt => {
      console.log('resize', evt);
      this.board_width = this.content.nativeElement.clientWidth;
      this.board_height = this.content.nativeElement.clientHeight;
    });
  }

  setUsername(name: string) {
    this.gameService.setUsername(name);
  }

  refreshGameData(gameData: IGameData) {
    if (gameData) {
      this.gameData = gameData;
      this.gameData.players.forEach(player => this.tokenContractService.observeAccount(player.address));
      if (!this.playground) {
        this.playground = gameData.playground;
      }
      const newPosition = this.gameData.playersPosition.get(this.currentAccount);
      if (this.position !== newPosition) {
        console.log('refresh position during refreshGameData', newPosition);
        this.refreshPosition(newPosition);
      }
    }
    if (this.players !== undefined) {
      this.gameData.playersPosition.forEach((position, player) => {
        this.players.setPlayerPosition(player, position);
      });
    }
  }

  refreshTokenData(tokenData: ITokenData) {
    this.tokenData = tokenData;
    console.log('refreshTokenData', 'tokenData');
    this.tokenData.balances.forEach((value, key) => {
      console.log(key, value.toString());
    })
    this.balances = tokenData.balances;
    this.tokenDecimals = tokenData.decimals;
    if (this.players !== undefined) {
      tokenData.balances.forEach((balance, player) => {
        this.players.setPlayerBalance(player, balance.toString());
      });
    }
  }

  public get canStart(): boolean {
    return ((this.gameData) && (this.gameData.status === GAME_STATUS[0]) && (this.gameData.players.length >= 2));
  }

  public get canPlay(): boolean {
    return ((this.gameData.status === GAME_STATUS[1])
    && (this.gameData.nextPlayer === this.currentAccount)
    && (this.gameData.currentPlayer !== this.currentAccount));
  }

  public get canValidate(): boolean {
    return ((this.gameData.status === GAME_STATUS[1])
    && (this.gameData.nextPlayer === this.currentAccount)
    && (this.gameData.currentPlayer === this.currentAccount));
  }

  public get isNextPlayer() {
    return this.gameData.nextPlayer === this.currentAccount;
  }

  public get isCurrentPlayer() {
    return this.gameData.currentPlayer === this.currentAccount;
  }

  start() {
    this.gameMasterContractService.contract.start().then(() => {
      console.log('start called');
    }).catch((e) => {
      console.error(e);
    });
  }

  play() {
    // animate dices
    this.dices.animate();
    this.gameMasterContractService.rollDices().then(({dice1, dice2, newPosition}) => {
      console.log('RolledDices', dice1, dice2, newPosition);
      this.dices.stopAnimation(dice1, dice2);
      console.log('refresh position after rolling dices', newPosition);
      this.refreshPosition(newPosition);
    })
  }

  refreshPosition(newPosition: number) {
    if (!(this.board)) {
      // Wait for the board to be added in DOM (nbIf directive)
      this.Boards.changes.pipe(first()) // subscribe only on the first update, auto clear subscription after
      .subscribe((boards: QueryList<TestCanvasComponent>) => {
        this.refreshPosition(newPosition);
      });
      return;
    }
    this.board.lockAvatar();
    const oldPosition = this.position;
    const nbBlocks = this.board.nbBlocks;
    let offset = (oldPosition <= newPosition) ? newPosition - oldPosition : (newPosition + nbBlocks) - oldPosition;
    const revPosition = nbBlocks - newPosition % nbBlocks;
    const targetAngle = revPosition * 2 * Math.PI / nbBlocks;
    this.board.setTargetAngle(targetAngle, offset/nbBlocks).then(() => {
      this.board.unlockAvatar();
      this.position = newPosition;
    })
  }

  validate() {
    this.gameMasterContractService.play(0).then(() => {
    })
  }

  balanceOf(address?: string): string {
    if (!address) {
      address = this.currentAccount;
    }
    if (this.balances && this.balances.has(address)) {
      const balance = this.balances.get(address);
      return balance.toString();
    }
    return '?';
  }

}
