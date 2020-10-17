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
import { AbstractContractService } from './AbstractContractService';

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

export enum eSpaceType {
    GENESIS= 0,
    QUARANTINE= 1,
    LIQUIDATION= 2,
    CHANCE= 3,
    ASSET_CLASS_1= 4,
    ASSET_CLASS_2= 5,
    ASSET_CLASS_3= 6,
    ASSET_CLASS_4= 7
}

type SpaceTypeStrings = keyof typeof eSpaceType;

export enum eChanceType {
  PAY= 0,
  RECEIVE= 1,
  MOVE_N_SPACES_FWD= 2,
  MOVE_N_SPACES_BCK= 3,
  GOTO_SPACE= 4,
  IMMUNITY= 5,
  PAY_PER_ASSET= 6,
  RECEIVE_PER_ASSET= 7
}

type ChanceTypeStrings = keyof typeof eChanceType;

export interface ISpace {
  type: eSpaceType;
  assetId: number;
}
export interface IGameData {
  status: string;
  players: IPlayer[];
  playersPosition: Map<string, number>;
  nextPlayer: string;
  currentPlayer: string;
  currentOptions: number;
  tokenAddress: string;
  playground: ISpace[];
}

@Injectable({
  providedIn: 'root'
})
export class GameMasterContractService extends AbstractContractService<IGameData> {

  onRolledDices: (player, dice1, dice2, cardId, newPosition, options) => void;

  constructor(
    protected sessionStorageService: SessionStorageService,
    protected portisL1Service: PortisL1Service
  ) {
    super(GameMasterJSON, portisL1Service);
   }

   public async rollDices(): Promise<{dice1: number, dice2: number, newPosition: number}> {
     return new Promise((resolve, reject) => {
      // wait for the event
      this.onRolledDices = (player, dice1, dice2, cardId, newPosition, options) => {
        console.log('rollDices event', player, dice1, dice2, newPosition);
        if (player !== this.portisL1Service.accounts[0]) {
          console.error('Unexpected RolledDices event from another player', player);
        } else {
          resolve({dice1, dice2, newPosition});
        }
      };
      this._contract.rollDices().then(() => {
        console.log('rollDices called');
      });
     });
   }
  public play(option: number) {
    return new Promise((resolve, reject) => {
      this._contract.play(option).then(() => {
      console.log('play called');
      resolve();
    }).catch((e) => {
      console.error(e);
    });
  });
}

   protected async refreshData() {
    let gameData = this.data;
    const status = await this._contract.getStatus();
    const nbPlayers = await this._contract.getNbPlayers();
    const nextPlayer = await this._contract.getNextPlayer();
    const currentPlayer = await this._contract.getCurrentPlayer();
    const currentOptions = await this._contract.getCurrentOptions();
    let isChanged = false;
    if (!gameData) {
      const players = await this.getPlayers(nbPlayers);
      const tokenAddress = await this._contract.getToken();
      const nbSpaces = await this._contract.getNbPositions();
      const playground = await this._contract.getPlayground();
      gameData = {
        status: GAME_STATUS[status],
        players,
        playersPosition: await this.refreshPositions(players),
        nextPlayer,
        currentPlayer,
        currentOptions,
        tokenAddress,
        playground: this.buildPlayground(nbSpaces, playground)
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
      if (currentPlayer !== gameData.currentPlayer) {
        gameData.currentPlayer = currentPlayer;
        isChanged = true;
      }
      if (currentOptions !== gameData.currentOptions) {
        gameData.currentOptions = currentOptions;
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

  protected subscribeToEvents() {
    this._contract.on('StatusChanged', (newStatus) => {
      this.recordEvent({ type: 'StatusChanged', value: newStatus });
    });
    this._contract.on('PlayerRegistered', (newPlayer) => {
      this.recordEvent({ type: 'PlayerRegistered', value: newPlayer });
    });
    this._contract.on('PlayPerformed', (player) => {
      this.recordEvent({ type: 'PlayPerformed', value: player });
    });
    this._contract.on('RolledDices', (player, dice1, dice2, cardId, newPosition, options) => {
      if (this.onRolledDices) {
        this.onRolledDices(player, dice1, dice2, cardId, newPosition, options);
        this.onRolledDices = undefined;
      }
      this.recordEvent({ type: 'RolledDices', value: {player, dice1, dice2, cardId, newPosition, options} });
    });
  }

  getContract(game: string) {
    return new GameMaster(game, this.portisL1Service.signer());
  }

  protected buildPlayground(nbSpaces: number, playground: string): ISpace[] {
    const spaces = [];
    for (let spaceId = 0; spaceId < nbSpaces; spaceId++) {
      const idxStart = playground.length - 2 * (spaceId);
      const spaceCode = parseInt(playground.slice(idxStart - 2, idxStart), 16);
      // tslint:disable-next-line: no-bitwise
      const type = spaceCode & 0x7;
      // tslint:disable-next-line: no-bitwise
      const assetId = spaceCode >> 3;
      spaces.push({
        type,
        assetId
      });
      console.log('Space', spaceId, eSpaceType[type], assetId);
    }
    return spaces;
  }

}
