import { GameMaster } from './../_models/contracts/GameMaster';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { SessionStorageService, StorageKeys } from './session-storage.service';
import { Injectable } from '@angular/core';
import { Contract, ethers } from 'ethers';
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
import { ConnectedPositionStrategy } from '@angular/cdk/overlay';

export enum eEvent {
  Status,
  Players,
  Positions,
  NextPlayer
}

export enum eAvatar {
  INVALID,
  Nobody,
  Camel,
  Microchip,
  Diamond,
  Rocket
}

export enum eOption {
  INVALID = 0, // 0 not allowed
  NOTHING = 1, // 1
  BUY_ASSET = 2, // 2
  PAY_BILL = 4, // 4
  CHANCE = 8, // 8
  QUARANTINE = 16 // 16
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
  assetPrice: number;
  productPrice: number;
  owner: string;
}
export interface IGameData {
  status: string;
  players: IPlayer[];
  playersPosition: Map<string, number>;
  nextPlayer: string;
  currentPlayer: string;
  currentOptions: number;
  chanceCardId: number;
  tokenAddress: string;
  assetsAddress: string;
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
          reject(`Unexpected RolledDices event from another player ${player}`);
        } else {
          resolve({dice1, dice2, newPosition});
        }
      };
      this._contract.estimateGas.rollDices().then((gas) => {
        this._contract.rollDices({gasLimit: gas.mul(2).toString()}).then((response) => {
          response.wait().then(() => {
            console.log('rollDices succeed');
          }).catch(e => reject(e));
          console.log('rollDices called');
        }).catch((e) => {
          reject(e);
        });
      })
    });
   }
  public play(option: number) {
    return new Promise((resolve, reject) => {
      this._contract.play(option).then((response) => {
      response.wait().then(() => {
        console.log('play succeed');
        resolve();
      }).catch(e => reject(e));
      console.log('play called');
  }).catch((e) => {
      reject(e);
    });
  });
}

   protected async refreshData() {
    let gameData = this.data;
    const status = await this._contract.getStatus();
    const nbPlayers = await this._contract.getNbPlayers();
    const nextPlayer = await this._contract.getNextPlayer();
    console.log('Update GameData, nextPlayer:', nextPlayer);
    const currentPlayer = await this._contract.getCurrentPlayer();
    const currentOptions = await this._contract.getCurrentOptions();
    const chanceCardId = await this._contract.getCurrentCardId();
    let isChanged = false;
    if (!gameData) {
      const players = await this.getPlayers(nbPlayers);
      const tokenAddress = await this._contract.getToken();
      const assetsAddress = await this._contract.getAssets();
      const nbSpaces = await this._contract.getNbPositions();
      const playground = await this.buildPlayground(nbSpaces);
      gameData = {
        status: GAME_STATUS[status],
        players,
        playersPosition: (await this.refreshPositions(players)).positions,
        nextPlayer,
        currentPlayer,
        currentOptions,
        chanceCardId,
        tokenAddress,
        assetsAddress,
        playground
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
      } else {
        isChanged
         = (await this.refreshPositions(gameData.players, gameData.playersPosition)).isChanged;
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
      if (chanceCardId !== gameData.chanceCardId) {
        gameData.chanceCardId = chanceCardId;
        isChanged = true;
      }
    }
    if (isChanged) {
      this._onUpdate.next(gameData);
    }
  }

  private async refreshPositions(players: IPlayer[], positions?: Map<string, number>):
   Promise<{positions: Map<string, number>, isChanged: boolean}> {
    let isChanged = false;
    if (!positions) {
      positions = new Map<string, number>();
    }
    for (const player of players) {
      const position = await this._contract.getPositionOf(player.address);
      if (!positions.has(player.address) || (positions.get(player.address) !== position)) {
        isChanged = true;
        positions.set(player.address, position);
      }
    }
    return {positions, isChanged};
  }

  private async getPlayers(nbPlayers: number): Promise<IPlayer[]> {
    const players = [];
    for (let i = 0; i < nbPlayers; i++) {
      const playerAddress = await this._contract.getPlayerAtIndex(i);
      const username = await this._contract.getUsername(playerAddress);
      const avatar = await this._contract.getAvatar(playerAddress);
      players.push({
        address: playerAddress,
        username: ethers.utils.parseBytes32String(username),
        avatar
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
    this._contract.on('PlayPerformed', (player, option, cardId, newPosition) => {
      this.recordEvent({ type: 'PlayPerformed', value: {player, option, newPosition} });
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

  protected async buildPlayground(nbSpaces: number): Promise<ISpace[]> {
    const spaces = [];
    // Optim:
    const playground = await this._contract.getPlayground(); // bytes32 array

    for (let spaceId = 0; spaceId < nbSpaces; spaceId++) {
      const spaceCodeStr = '0x' + playground.slice(2 + 64 - 2 * (spaceId + 1), 2 + 64 - 2 * spaceId);
      const spaceCode = parseInt(spaceCodeStr, 16);
      // tslint:disable-next-line: no-bitwise
      const type = spaceCode & 0x7;
      const isAsset = ((type >= eSpaceType.ASSET_CLASS_1) && (type <= eSpaceType.ASSET_CLASS_4));
      // tslint:disable-next-line: no-bitwise
      const assetId = spaceCode >> 3;
      const assetClass = isAsset ? type - eSpaceType.ASSET_CLASS_1 + 1 : 0;
      const assetPrice = isAsset ? 50 * assetClass : 0;
      const productPrice = isAsset ? assetPrice / 4 : 0;
    //   const spaceDetails = await this._contract.getSpaceDetails(spaceId);
    //   const type = spaceDetails[0];
    //   const assetId = spaceDetails[1];
    //   const assetPrice = spaceDetails[2].toNumber();
    //   const productPrice = spaceDetails[3].toNumber();
      spaces.push({
        type,
        assetId,
        assetPrice,
        productPrice
      });
      console.log('Space', spaceId, eSpaceType[type], assetId, assetPrice);
    }
    return spaces;
  }

}
