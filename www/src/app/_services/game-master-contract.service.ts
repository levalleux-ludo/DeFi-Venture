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

export const GAME_DATA_FIELDS = {
  status: 0,
  nbPlayers: 1,
  nbPositions: 2,
  token: 3,
  assets: 4,
  marketplace: 5,
  nextPlayer: 6,
  currentPlayer: 7,
  currentOptions: 8,
  currentCardId: 9
};

export const USER_DATA_FIELDS = {
  address: 0,
  username: 1,
  avatar: 2,
  position: 3,
  hasLost: 4
};

import GameMasterJSON from '../../../../buidler/artifacts/GameMaster.json';
import PlaygroundJSON from '../../../../buidler/artifacts/Playground.json';
import GameContractsJSON from '../../../../buidler/artifacts/GameContracts.json';
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
  hasLost: boolean;
  hasWon: boolean;
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
  players: Map<string, IPlayer>;
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
  protected _playgroundContract: ethers.Contract;
  protected _gameContracts: ethers.Contract;

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
    const contractGameData = await this._contract.getGameData();
    const status = contractGameData[GAME_DATA_FIELDS.status];
    const nbPlayers = contractGameData[GAME_DATA_FIELDS.nbPlayers];
    const nextPlayer = contractGameData[GAME_DATA_FIELDS.nextPlayer];
    console.log('Update GameData, nextPlayer:', nextPlayer);
    const currentPlayer = contractGameData[GAME_DATA_FIELDS.currentPlayer];
    const currentOptions = contractGameData[GAME_DATA_FIELDS.currentOptions];
    const chanceCardId = contractGameData[GAME_DATA_FIELDS.currentCardId];
    const {players, positions: playersPosition, isChanged: playersDataChanged}
     = await this.getPlayersData(nbPlayers, status, gameData?.players, gameData?.playersPosition);
    const tokenAddress = contractGameData[GAME_DATA_FIELDS.token];
    const assetsAddress = contractGameData[GAME_DATA_FIELDS.assets];
    const nbSpaces = contractGameData[GAME_DATA_FIELDS.nbPositions];
    let hasChanged = false;
    if (!gameData) {
      const playground = await this.buildPlayground(nbSpaces);
      gameData = {
        gameMaster: this.address,
        status: GAME_STATUS[status],
        players,
        playersPosition,
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
      if ((nbPlayers !== gameData.players.size) || (gameData.gameMaster !== this.address)) {
        gameData.players = players;
        gameData.playersPosition = playersPosition;
        hasChanged = true;
      } else if (playersDataChanged) {
        gameData.players = players;
        gameData.playersPosition = playersPosition;
        hasChanged = true;
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
      const position = await this._contract.positions(player.address);
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

  private async getPlayersData(nbPlayers: number, status: eGameStatus, players?: Map<string, IPlayer>, positions?: Map<string, number>)
  : Promise<{players: Map<string, IPlayer>, positions: Map<string, number>, isChanged: boolean}> {
    const indexes = [];
    for (let i = 0; i < nbPlayers; i++) {
      indexes.push(i);
    }
    const playersData = await this._contract.getPlayersData(indexes);
    let isChanged = false;
    if (!players) {
      players = new Map<string, IPlayer>();
    }
    if (!positions) {
      positions = new Map<string, number>();
    }
    let winner;
    if (status === eGameStatus.ENDED) {
      winner = await this._contract.getWinner();
    }
    const keysToRemove = Array.from(positions.keys());
    for (let i = 0; i < nbPlayers; i++) {
      const playerAddress = playersData[USER_DATA_FIELDS.address][i];
      const username = playersData[USER_DATA_FIELDS.username][i];
      const avatar = playersData[USER_DATA_FIELDS.avatar][i];
      const hasLost = playersData[USER_DATA_FIELDS.hasLost][i];
      console.log('player', username ,'hasLost', hasLost);
      const hasWon = (winner === playerAddress);
      const theplayer = players.get(playerAddress);
      if ((theplayer === undefined)
      || (theplayer.username !== ethers.utils.parseBytes32String(username))
      || (theplayer.avatar !== avatar)
      || (theplayer.hasLost !== hasLost)
      || (theplayer.hasWon !== hasWon)) {
        isChanged = true;
        players.set(
          playerAddress, {
            address: playerAddress,
            username: ethers.utils.parseBytes32String(username),
            avatar,
            hasLost,
            hasWon
          }
        );
      }
      if (positions.has(playerAddress)) {
        keysToRemove.splice(keysToRemove.indexOf(playerAddress), 1);
      }
      const position = playersData[USER_DATA_FIELDS.position][i];
      if (!positions.has(playerAddress) || (positions.get(playerAddress) !== position)) {
        isChanged = true;
        positions.set(playerAddress, position);
      }
    }
    for (const key of keysToRemove) {
      positions.delete(key);
      isChanged = true;
    }
    return {players, positions, isChanged};
  }

  private async getPlayers(nbPlayers: number, status: eGameStatus): Promise<IPlayer[]> {
    const players = [];
    const indexes = [];
    for (let i = 0; i < nbPlayers; i++) {
      indexes.push(i);
    }
    const playersData = await this._contract.getPlayersData(indexes);
    for (let i = 0; i < nbPlayers; i++) {
      const playerAddress = playersData[USER_DATA_FIELDS.address][i];
      const username = playersData[USER_DATA_FIELDS.username][i];
      const avatar = playersData[USER_DATA_FIELDS.avatar][i];
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
    this._contract.on('PlayerLost', (player) => {
      this.recordEvent({ type: 'PlayerLost', value: {player} });
    });
    this._contract.on('PlayerWin', (player) => {
      this.recordEvent({ type: 'PlayerWin', value: {player} });
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
    if (!this._playgroundContract) {
      console.error('Unable to get playground. The contract is not instanciated')
      return spaces;
    }
    // Optim:
    const playground = await this._playgroundContract.playground(); // bytes32 array

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

  protected async createPlaygroundContract(gameMaster: Contract) {
    await this._gameContracts.getPlayground().then(async (playgroundAddress: string) => {
      await (new Contract(playgroundAddress, PlaygroundJSON.abi, this.portisL1Service?.provider)).deployed().then((contract) => {
        this._playgroundContract = contract;
      }).catch(e => {
        console.error('Unable to create playground contract', e);
      });
    });
  }

  protected async createGameContracts(gameMaster: Contract) {
    await gameMaster.contracts().then(async (contractsAddress: string) => {
      await (new Contract(contractsAddress, GameContractsJSON.abi, this.portisL1Service?.provider)).deployed().then((contract) => {
        this._gameContracts = contract;
      }).catch(e => {
        console.error('Unable to create playground contract', e);
      });
    });
  }

  protected async _onContractSet(value: ethers.Contract) {
    if (value) {
      await this.createGameContracts(value);
      await this.createPlaygroundContract(value);
    } else {
      this._playgroundContract = undefined;
    }
  }

}
