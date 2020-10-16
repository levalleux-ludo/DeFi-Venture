import { GameMaster } from './../_models/contracts/GameMaster';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { SessionStorageService, StorageKeys } from './session-storage.service';
import { Injectable } from '@angular/core';
import { Contract } from 'ethers';
import { EthereumService } from './ethereum.service';

export const GAME_STATUS = [
  'CREATED',
  'STARTED',
  'FROZEN',
  'ENDED'
];

import GameMasterJSON from '../../../../buidler/artifacts/GameMaster.json';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';

export enum eEvent {
  Status,
  Players,
  Positions,
  NextPlayer
}

export enum eAvatar {
  Nobody,
  Camel,
  Microchip,
  Diamond,
  Rocket
}

export interface IPlayer {
  address: string;
  username: string;
  avatar: eAvatar;
}
export interface IGameData {
  status: string;
  players: IPlayer[];
  playersPosition: Map<string, number>;
  nextPlayer: string;
  tokenAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameMasterContractService {
  private _address: string;
  private _contract: Contract;
  private isReady = false;
  private readySubject = new Subject<void>();
  private _events = [];
  private _eventsSubject = new Subject();
  private _onUpdate = new BehaviorSubject<IGameData>(undefined);

  constructor(
    private ethService: EthereumService,
    private sessionStorageService: SessionStorageService,
    private portisL1Service: PortisL1Service
  ) {
    // this.setAddress(sessionStorageService.restore(StorageKeys.contracts.gameMaster));
   }

  public get address() {
    return this._address;
  }

  public get ready(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.readySubject.subscribe(() => {
          resolve();
        });
      }
    });
  }

  public get onUpdate(): Observable<IGameData> {
    return this._onUpdate.asObservable();
  }

  public get gameData(): IGameData {
    return this._onUpdate.value;
  }

  public async setAddress(address: string) {
    this._address = address;
    if ((this._address !== undefined) && (this._address !== null) && (this._address !== '')) {
        await (new Contract(address, GameMasterJSON.abi, this.portisL1Service?.signer())).deployed().then(async (contract) => {
        this._contract = contract;
        this.subscribeToEvents();
        await this.refreshData();
      }).catch(e => {
        console.error(e);
        this._contract = undefined;
      });
    } else {
      this._contract = undefined;
    }
    this.sessionStorageService.storeLocal(StorageKeys.contracts.gameMaster, this._address);
    this.isReady = true;
    this.readySubject.next();
  }

  public get contract(): Contract {
    return this._contract;
  }

  public get events(): any[] {
    return this._events;
  }

  public get onEvent(): Observable<any> {
    return this._eventsSubject.asObservable();
  }

  private async refreshData() {
    let gameData = this.gameData;
    const status = await this._contract.getStatus();
    const nbPlayers = await this._contract.getNbPlayers();
    const nextPlayer = await this._contract.getNextPlayer();
    const tokenAddress = await this._contract.getToken();
    let isChanged = false;
    if (!gameData) {
      const players = await this.getPlayers(nbPlayers);
      gameData = {
        status: GAME_STATUS[status],
        players,
        playersPosition: await this.refreshPositions(players),
        nextPlayer,
        tokenAddress
      };
      isChanged = true;
    } else {
      if (status !== gameData.status) {
        gameData.status = GAME_STATUS[status];
        isChanged = true;
      }
      if (nbPlayers !== gameData.players.length) {
        const players = await this.getPlayers(nbPlayers);
        gameData.players = players;
        await this.refreshPositions(players, gameData.playersPosition);
        isChanged = true;
      }
      if (nextPlayer !== gameData.nextPlayer) {
        gameData.nextPlayer = nextPlayer;
        isChanged = true;
      }
    }
    if (isChanged) {
      this._onUpdate.next(gameData);
    }
  }

  private async refreshPositions(players: IPlayer[], positions = new Map<string, number>()): Promise<Map<string, number>> {
    for (const player of players) {
      await new Promise(resolve => {
        setTimeout(() => {
          positions.set(player.address, 0);
          resolve();
        }, 250);
      });
    }
    return positions;
  }

  private async getPlayers(nbPlayers: number): Promise<IPlayer[]> {
    const players = [];
    for (let i = 0; i < nbPlayers; i++) {
      const playerAddress = await this._contract.getPlayerAtIndex(i);
      players.push({
        address: playerAddress,
        username: '???',
        avatar: eAvatar.Nobody
      });
    }
    return players;
  }

  private subscribeToEvents() {
    this._contract.on('StatusChanged', (newStatus) => {
      this.recordEvent({ type: 'StatusChanged', value: newStatus });
    });
    this._contract.on('PlayerRegistered', (newPlayer) => {
      this.recordEvent({ type: 'PlayerRegistered', value: newPlayer });
    });
    this._contract.on('PlayPerformed', (player) => {
      this.recordEvent({ type: 'PlayPerformed', value: player });
    });
  }

  private recordEvent(event: any) {
    this._events.push(event);
    this._eventsSubject.next(event);
    this.refreshData();
  }

  getContract(game: string) {
    return new GameMaster(game, this.portisL1Service.signer());
  }



}
