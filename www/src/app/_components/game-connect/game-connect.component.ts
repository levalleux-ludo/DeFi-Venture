import { IPlayer } from 'src/app/_services/game-master-contract.service';
import { DiscordWidgetbotComponent } from './../discord-widgetbot/discord-widgetbot.component';
import { DiscordService } from './../../_services/discord.service';
import { OtherPlayersComponent } from './../other-players/other-players.component';
import { MatDialog } from '@angular/material/dialog';
import { RegisterFormComponent } from './../register-form/register-form.component';
import { AssetsContractService, IAssetsData } from './../../_services/assets-contract.service';
import { PlayersTableComponent } from './../players-table/players-table.component';
import { Utils } from './../../_utils/utils';
import { GameTokenContractService, ITokenData } from './../../_services/game-token-contract.service';
import { GameMasterContractService, GAME_STATUS, IGameData, eSpaceType, eAvatar, ISpace } from './../../_services/game-master-contract.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { GameService } from './../../_services/game.service';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DicesComponent } from '../dices/dices.component';
import { TestCanvasComponent } from '../test-canvas/test-canvas.component';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { Observable, Subscription, Subject, fromEvent } from 'rxjs';
import { first, map, shareReplay, takeUntil } from 'rxjs/operators';
import { element } from 'protractor';
import { BigNumber } from 'ethers';
import {MatSnackBar} from '@angular/material/snack-bar';
import { AriaDescriber } from '@angular/cdk/a11y';
import { DiscordConnectDialogComponent } from '../discord-connect-dialog/discord-connect-dialog.component';
import { GameTranslatorService } from 'src/app/_services/game-translator.service';

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

  private unsubscribe$ = new Subject<void>();

  username: string = '';
  gameMaster;
  network;
  gameData: IGameData;
  tokenData: ITokenData;
  assetsData: IAssetsData;
  currentAccount;
  events = [];
  position = 0;
  owner;
  assets = [];
  tokenDecimals: number;
  balances: Map<string, BigNumber>;
  playground: ISpace[] = [];
  isValidating = false;
  isPlaying = false;
  isStarting = false;
  isRegistering = false;
  avatars = new Map<string, eAvatar>();
  zoom;
  currentPlayer: IPlayer;

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
  @ViewChild('otherPlayers', {static: false})
  otherPlayers: OtherPlayersComponent;
  @ViewChild('discord', {static: false})
  discordWidget: DiscordWidgetbotComponent;
  resizeObservable$: Observable<Event>;
  clickObservable$: Observable<Event>;
  resizeSubscription$: Subscription;
  board_width;
  board_height = 900;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private gameService: GameService,
    private route: ActivatedRoute, // required to parse th current URL and find the game's id
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private tokenContractService: GameTokenContractService,
    private assetsContractService: AssetsContractService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public discordService: DiscordService,
    public translatorService: GameTranslatorService
  ) { }
  ngAfterViewInit(): void {
    this.board_width = this.content.nativeElement.clientWidth;
    // this.board_height = this.content.nativeElement.clientHeight;
    this.board_height = Math.min(this.content.nativeElement.clientHeight, 800 + 200 * this.board_width / 1600);
    // this.board_height = 800 + 200 * this.board_width / 1600;
    this.discordService.getChannelFromGame(this.gameMaster).then((channelId) => {
      if (channelId) {
        this.discordWidget.channelId = channelId;
        // setTimeout(() => {
        //   this.discordWidget.refreshChannel();
        // },
        // 1500);
      } else {
        console.error('UNable to get Discord channel for game', this.gameMaster);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeSubscription$.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    console.log("reset component values");
    this.gameData = undefined;
    this.tokenData = undefined;
    this.assetsData = undefined;
    this.gameService.getUsername().pipe(takeUntil(this.unsubscribe$)).subscribe((username) => {
      this.username = username;
    });
    this.portisService.onConnect.pipe(takeUntil(this.unsubscribe$)).subscribe(({network, account}) => {
      this.network = network;
      this.currentAccount = account;
      console.log('set currentAccount', this.currentAccount);
      if (account) {
        this.discordService.getUserData(account).then((discordUserData) => {
          if (!discordUserData) {
            DiscordConnectDialogComponent.showModal(this.dialog).then((result) => {
              console.log('discord dialog closed');
            });
          }
        }).catch(e => console.error(e));
      }
    });
    this.gameMaster = this.route.snapshot.paramMap.get('id');
    this.portisService.connect().then(() => {
      this.network = this.portisService.network;
      this.gameMasterContractService.setAddress(this.gameMaster).then((gameData) => {
        this.gameMasterContractService.onEvent.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
          const message = this.translatorService.event2message('gameMaster', event);
          this.events.push({log: message});
          this.showInfo(message);
        });
        const tokenAddress = gameData.tokenAddress;
        this.tokenContractService.setAddress(tokenAddress).then(() => {
          this.tokenContractService.onEvent.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
            const message = this.translatorService.event2message('token', event);
            this.events.push({log: message});
            this.showInfo(message);
          })
          this.tokenContractService.onUpdate.pipe(takeUntil(this.unsubscribe$)).subscribe((tokenData) => {
            this.refreshTokenData(tokenData);
          });
        });
        const assetsAddress = gameData.assetsAddress;
        this.assetsContractService.setAddress(assetsAddress).then(() => {
          this.assetsContractService.onEvent.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
            const message = this.translatorService.event2message('assets', event);
            this.events.push({log: message});
            this.showInfo(message);
          })
          this.assetsContractService.onUpdate.pipe(takeUntil(this.unsubscribe$)).subscribe((assetsData) => {
            this.refreshAssetsData(assetsData);
          });
        });
        this.gameMasterContractService.onUpdate.pipe(takeUntil(this.unsubscribe$)).subscribe((gameData2) => {
          this.refreshGameData(gameData2);
        });
      });
    }).catch(e => console.error(e));
    this.board_width = this.content.nativeElement.clientWidth;
    this.board_height = Math.min(this.content.nativeElement.clientHeight, 800 + 200 * this.board_width / 1600);
    // this.board_height = this.content.nativeElement.clientHeight;
    // this.board_height = Math.min(this.content.nativeElement.clientHeight, this.board_width);
    this.resizeObservable$ = fromEvent(window, 'resize');
    // this.clickObservable$ = fromEvent(this.content.nativeElement, 'click');
    // this.clickObservable$.subscribe(evt => {
    //   console.log('click', evt);
    // });
    this.resizeSubscription$ = this.resizeObservable$.subscribe(evt => {
      console.log('resize', evt);
      this.board_width = this.content.nativeElement.clientWidth;
      this.board_height = Math.min(this.content.nativeElement.clientHeight, 800 + 200 * this.board_width / 1600);
      // this.board_height = this.content.nativeElement.clientHeight;
      // this.board_height = Math.min(this.content.nativeElement.clientHeight, this.board_width);
    });
  }

  setUsername(name: string) {
    this.gameService.setUsername(name);
  }

  public get isRegistered(): boolean {
    return (!this.gameData)
     || (!this.currentAccount)
     || (this.gameData.players.get(this.currentAccount) !== undefined);
  }

  refreshGameData(gameData: IGameData) {
    if (gameData) {
      this.gameData = gameData;
      this.gameData.players.forEach((player, playerAddress) => {
        this.tokenContractService.observeAccount(playerAddress);
        this.assetsContractService.observeAccount(playerAddress);
      });
      if (!this.playground || !this.playground.length) {
        this.playground = gameData.playground;
      }
      const player = gameData.players.get(this.currentAccount);
      if (player !== undefined) {
        this.currentPlayer = player;
      }
      const newPosition = this.gameData.playersPosition.get(this.currentAccount);
      const oldPosition = this.position;
      if (oldPosition !== newPosition) {
        console.log('refresh position during refreshGameData', newPosition);
        this.refreshPosition(newPosition);
      }
      this.gameData.players.forEach((player, playerAddress) => {
        this.avatars.set(playerAddress, player.avatar);
      });
      this.gameData.playersPosition.forEach((position, player) => {
        if (this.players !== undefined) {
          this.players.setPlayerPosition(player, position);
        }
        if (this.board !== undefined) {
          this.board.setPlayerPosition(this.getPlayerAvatar(player), position, true);
        }
      });
      setTimeout(() => {
        if (this.board !== undefined) {
          this.zoom = this.board.zoom;
        }
      }, 500);
    }
  }

  getPlayerAvatar(player: string): number | undefined {
    return this.avatars.get(player);
  }

  refreshTokenData(tokenData: ITokenData) {
    this.tokenData = tokenData;
    console.log('refreshTokenData', tokenData);
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
    if (this.otherPlayers !== undefined) {
      this.otherPlayers.balances = this.balances;
    }
  }

  refreshAssetsData(assetsData: IAssetsData) {
    this.assetsData = assetsData;
    console.log('refreshAssetsData', assetsData);
    if (assetsData) {
      this.assets = assetsData.portfolios.get(this.currentAccount);
      console.log(this.currentAccount, this.assets);
      if (this.otherPlayers !== undefined) {
        this.otherPlayers.portfolios = assetsData.portfolios;
      }
      if ((this.board !== undefined) && (this.playground !== undefined)) {
        this.assetsData.owners.forEach((player, assetId) => {
          const assetPosition = this.playground.findIndex(space => space.assetId === assetId);
          if (assetPosition === -1) {
            console.error('Unable to find assetPosition for assetId', assetId);
          } else {
            this.board.setOwner(this.getPlayerAvatar(player), assetPosition);
          }
        });
      }
    } else {
      this.assets = [];
    }
  }

  public get canStart(): boolean {
    return ((this.gameData) && (!this.isStarting) && (this.gameData.status === GAME_STATUS[0]) && (this.gameData.players.size >= 2));
  }

  public get canPlay(): boolean {
    return ((this.gameData.status === GAME_STATUS[1])
    && (!this.isPlaying)
    && (this.gameData.nextPlayer === this.currentAccount)
    && (this.gameData.currentPlayer !== this.currentAccount));
  }

  public get canValidate(): boolean {
    return ((this.gameData.status === GAME_STATUS[1])
    && (!this.isValidating)
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
    this.isStarting = true;
    this.gameMasterContractService.start().then(() => {
      console.log('start called');
    }).catch((e) => {
      console.error(e);
    }).finally(() => {
      this.isStarting = false;
    });
  }

  play() {
    // animate dices
    this.isPlaying = true;
    this.dices.animate();
    this.gameMasterContractService.rollDices().then(({dice1, dice2, newPosition}) => {
      console.log('RolledDices', dice1, dice2, newPosition);
      this.dices.stopAnimation(dice1, dice2);
      console.log('refresh position after rolling dices', newPosition);
      this.refreshPosition(newPosition);
    }).catch((e) => {
      console.error(e);
      this.dices.stopAnimation(1, 2);
      this.showError('Action Failed!');
    }).finally(() => {
      this.isPlaying = false;
    });
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
    this.board.lockAvatar(this.getPlayerAvatar(this.currentAccount));
    const oldPosition = this.position;
    const nbBlocks = this.board.nbBlocks;
    let offset = (oldPosition <= newPosition) ? newPosition - oldPosition : (newPosition + nbBlocks) - oldPosition;
    const revPosition = nbBlocks - newPosition % nbBlocks;
    const targetAngle = revPosition * 2 * Math.PI / nbBlocks;
    this.board.setTargetAngle(targetAngle, offset/nbBlocks).then(() => {
      this.board.unlockAvatar(this.getPlayerAvatar(this.currentAccount), newPosition);
      this.position = newPosition;
      const space = this.playground[newPosition];
      this.owner = undefined;
      if ((space.type >= eSpaceType.ASSET_CLASS_1) && (space.type <= eSpaceType.ASSET_CLASS_4)) {
        this.assetsContractService.ready.then(() => {
          this.assetsContractService.getOwner(space.assetId).then((owner) => {
            this.owner = owner;
          })
        })
      }
    })
  }

  validate(selectedOption) {
    this.isValidating = true;
    this.gameMasterContractService.play(selectedOption).then(() => {
    }).catch((e) => {
      console.error(e);
      this.showError('Action Failed!');
    }).finally(() => {
      this.isValidating = false;
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

  async getOwnerOf(position: number): Promise<string> {
    await this.assetsContractService.ready;
    return this.assetsContractService.getOwner(position);
  }

  showSuccess(message: string) {
    if (!message || (message === '')) {
      return;
    }
    this.snackBar.open(message, '', {
      duration: 5000,
      panelClass: ['snack-success'],
    });

  }

  showInfo(message: string) {
    if (!message || (message === '')) {
      return;
    }
    this.snackBar.open(message, '', {
      duration: 10000,
      panelClass: ['snack-info'],
    });

  }

  showError(message: string) {
    if (!message || (message === '')) {
      return;
    }
    this.snackBar.open(message, '', {
      duration: 10000,
      panelClass: ['snack-error'],
    });

  }

  register() {
    this.isRegistering = true;
    RegisterFormComponent.showModal(this.dialog).then((result) => {
      this.gameMasterContractService.getContract(this.gameMaster).register(
        result.username,
        result.avatar
      ).then(() => {
        console.log('register called');
        this.showSuccess('Player is registered');
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

  getPlayer(address: string): IPlayer {
    return this.gameData?.players.get(address);
  }

  changeZoom(zoom: number) {
    this.zoom = zoom;
    this.board.zoom = zoom;
  }

  shortAddress(address: string, nbChars = 4) {
    return `${address
      .toLowerCase()
      .substring(0, nbChars)}-${address
      .toLowerCase()
      .substring(address.length - nbChars)}`;
  }

  reconnectDiscord() {
    if (this.discordWidget) {
      this.discordWidget.refreshChannel();
    }
  }

}
