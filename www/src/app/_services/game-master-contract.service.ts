import { GameMaster, eGameStatus } from './../_models/contracts/GameMaster';
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
  gameMaster: string;
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
  protected contracts = new Map<string, GameMaster>();

  constructor(
    protected sessionStorageService: SessionStorageService,
    protected portisL1Service: PortisL1Service
  ) {
    super(GameMasterJSON, portisL1Service);
   }

   callWithSigner<T>(
     contractMethodName: string,
     contractMethod: Promise<ethers.providers.TransactionResponse>,
     eventName: string,
     eventHandler: (...args: any[]) => Promise<T>
     ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const pollingInterval1 = this.portisL1Service.provider.pollingInterval;
      const pollingInterval2 = (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval;
      // wait for the event
      const waitEvent = new Promise<T>((resolve2, reject2) => {
        const onEvent = (...args) => {
          console.log(`event ${eventName} received`, args);
          this.portisL1Service.provider.pollingInterval = pollingInterval1;
          (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
          eventHandler(...args).then((result: T) => {
            this._contractWithSigner.off(eventName, onEvent);
            resolve2(result);
          }).catch(reject2);
        };
        this._contract.on(eventName, onEvent);
      });
      this.portisL1Service.provider.pollingInterval = 1000;
      (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = 1000;
      contractMethod.then((response) => {
        response.wait().then((receipt) => {
          console.log(`${contractMethodName} call succeed`, receipt.transactionHash);
          waitEvent.then((result: T) => {
            this.portisL1Service.provider.pollingInterval = pollingInterval1;
            (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
            resolve(result);
          }).catch(reject);
        }).catch(e => reject(e));
      }).catch(e => {
        console.error(`Error while calling method ${contractMethodName}`);
        this.portisL1Service.provider.pollingInterval = pollingInterval1;
        (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
        reject(e);
      });
    });
   }

   public async start(): Promise<void> {
     return this.callWithSigner<void>(
       'start',
      this._contractWithSigner.start(),
      'StatusChanged',
      (newStatus: eGameStatus) => {
        return new Promise<void>((resolve, reject) => {
          if (newStatus === eGameStatus.STARTED) {
            resolve();
          } else {
            reject(new Error(`Unexpected game status changed to ${GAME_STATUS[newStatus]}`));
          }
        });
      }
     );
   }

   public async rollDices(): Promise<{dice1: number, dice2: number, newPosition: number}> {
    return this.callWithSigner<{dice1: number, dice2: number, newPosition: number}>(
      'rollDices',
     new Promise<ethers.providers.TransactionResponse>((resolve, reject) => {
      this._contractWithSigner.estimateGas.rollDices().then((gas) => {
        resolve(this._contractWithSigner.rollDices({gasLimit: gas.mul(2).toString()}));
      });
     }),
     'RolledDices',
     (player: string, dice1: number, dice2: number, cardId: number, newPosition: number, options: number) => {
       return new Promise<{dice1: number, dice2: number, newPosition: number}>((resolve, reject) => {
        if (player === this.portisL1Service.accounts[0]) {
          resolve({dice1, dice2, newPosition});
        } else {
          reject(new Error(`Unexpected PlayPerformed event from player ${player}`));
        }
      });
    });
   }

   public async rollDices_old(): Promise<{dice1: number, dice2: number, newPosition: number}> {
     return new Promise((resolve, reject) => {
      // let interval;
      const pollingInterval1 = this.portisL1Service.provider.pollingInterval;
      const pollingInterval2 = (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval;
      // wait for the event
      this.onRolledDices = (player, dice1, dice2, cardId, newPosition, options) => {
        console.log('rollDices event', player, dice1, dice2, newPosition);
        // if (interval) {
        //   console.log('clear interval');
        //   clearInterval(interval);
        // }
        this.portisL1Service.provider.pollingInterval = pollingInterval1;
        (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
        if (player !== this.portisL1Service.accounts[0]) {
          console.error('Unexpected RolledDices event from another player', player);
          reject(`Unexpected RolledDices event from another player ${player}`);
        } else {
          this.refreshData();
          resolve({dice1, dice2, newPosition});
        }
      };
      this._contractWithSigner.estimateGas.rollDices().then((gas) => {
        this._contractWithSigner.rollDices({gasLimit: gas.mul(2).toString()}).then((response) => {
          response.wait().then(() => {
            console.log('rollDices succeed');
          }).catch(e => reject(e));
          console.log('rollDices called');
          this.portisL1Service.provider.pollingInterval = 1000;
          (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = 1000;
          // interval = setInterval(() => {
          //   (this._contractWithSigner.provider as ethers.providers.Web3Provider).poll();
          //   this.portisL1Service.provider.poll();
          // }, 1000);
      }).catch((e) => {
          reject(e);
        });
      });
    });
   }


   public async play(option: number): Promise<void> {
    return this.callWithSigner<void>(
      'play',
     this._contractWithSigner.play(option),
     'PlayPerformed',
     (player: string, option2: number, cardId: number, newPosition: number) => {
       return new Promise<void>((resolve, reject) => {
         if (player === this.portisL1Service.accounts[0]) {
           resolve();
         } else {
           reject(new Error(`Unexpected PlayPerformed event from player ${player}`));
         }
       });
     }
    );
  }


  public play_old(option: number) {
    return new Promise((resolve, reject) => {
      // let interval;
      const pollingInterval1 = this.portisL1Service.provider.pollingInterval;
      const pollingInterval2 = (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval;
      this._contractWithSigner.play(option).then((response) => {
      response.wait().then(() => {
        console.log('play succeed');
        // if (interval) {
        //   clearInterval(interval);
        // }
        this.portisL1Service.provider.pollingInterval = pollingInterval1;
        (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
        this.refreshData();
        resolve();
      }).catch(e => {
        // if (interval) {
        //   clearInterval(interval);
        // }
        this.portisL1Service.provider.pollingInterval = pollingInterval1;
        (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = pollingInterval2;
        reject(e);
      });
      console.log('play called');
      this.portisL1Service.provider.pollingInterval = 1000;
      (this._contractWithSigner.provider as ethers.providers.Web3Provider).pollingInterval = 1000;
      // interval = setInterval(() => {
      //   (this._contractWithSigner.provider as ethers.providers.Web3Provider).poll();
      //   this.portisL1Service.provider.poll();
      // }, 1000);
    }).catch((e) => {
        reject(e);
      });
    });
  }

  protected async resetData() {
  }
  protected async refreshData(): Promise<{data: IGameData, hasChanged: boolean}> {
    let gameData = this.data;
    const status = await this._contract.getStatus();
    const nbPlayers = await this._contract.getNbPlayers();
    const nextPlayer = await this._contract.getNextPlayer();
    console.log('Update GameData, nextPlayer:', nextPlayer);
    const currentPlayer = await this._contract.getCurrentPlayer();
    const currentOptions = await this._contract.getCurrentOptions();
    const chanceCardId = await this._contract.getCurrentCardId();
    const players = await this.getPlayers(nbPlayers);
    let hasChanged = false;
    if (!gameData) {
      const tokenAddress = await this._contract.getToken();
      const assetsAddress = await this._contract.getAssets();
      const nbSpaces = await this._contract.getNbPositions();
      const playground = await this.buildPlayground(nbSpaces);
      gameData = {
        gameMaster: this.address,
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
      hasChanged = true;
    } else {

      if (status !== gameData.status) {
        gameData.status = GAME_STATUS[status];
        hasChanged = true;
      }
      if ((nbPlayers !== gameData.players.length) || (gameData.gameMaster !== this.address)) {
        gameData.players = players;
        await this.refreshPositions(players, gameData.playersPosition);
        hasChanged = true;
      } else {
        hasChanged
         = (await this.refreshPositions(gameData.players, gameData.playersPosition)).isChanged;
      }
      if (nextPlayer !== gameData.nextPlayer) {
        gameData.nextPlayer = nextPlayer;
        hasChanged = true;
      }
      if (currentPlayer !== gameData.currentPlayer) {
        gameData.currentPlayer = currentPlayer;
        hasChanged = true;
      }
      if (currentOptions !== gameData.currentOptions) {
        gameData.currentOptions = currentOptions;
        hasChanged = true;
      }
      if (chanceCardId !== gameData.chanceCardId) {
        gameData.chanceCardId = chanceCardId;
        hasChanged = true;
      }
      if (gameData.gameMaster !== this.address) {
        const tokenAddress = await this._contract.getToken();
        const assetsAddress = await this._contract.getAssets();
        const nbSpaces = await this._contract.getNbPositions();
        const playground = await this.buildPlayground(nbSpaces);
        gameData.gameMaster = this.address;
        gameData.tokenAddress = tokenAddress;
        gameData.assetsAddress = assetsAddress;
        gameData.playground = playground;
        hasChanged = true;
      }
    }
    return {data: gameData, hasChanged};
  }

  private async refreshPositions(players: IPlayer[], positions?: Map<string, number>):
   Promise<{positions: Map<string, number>, isChanged: boolean}> {
    let isChanged = false;
    if (!positions) {
      positions = new Map<string, number>();
    }
    const keysToRemove = Array.from(positions.keys());
    for (const player of players) {
      if (positions.has(player.address)) {
        keysToRemove.splice(keysToRemove.indexOf(player.address), 1);
      }
      const position = await this._contract.getPositionOf(player.address);
      if (!positions.has(player.address) || (positions.get(player.address) !== position)) {
        isChanged = true;
        positions.set(player.address, position);
      }
    }
    for (const key of keysToRemove) {
      positions.delete(key);
      isChanged = true;
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

  protected unsubscribeToEvents() {
    this._contract.removeAllListeners({topics: ['StatusChanged', 'PlayerRegistered', 'PlayPerformed', 'RolledDices']});
  }

  getContract(game: string) {
    let contract = this.contracts.get(game);
    if (!contract) {
      contract = new GameMaster(game, this.portisL1Service.provider, this.portisL1Service.signer);
      this.contracts.set(game, contract);
    }
    return contract;
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
