import { ethers } from 'ethers';
import { IGameMaster } from '../contracts/IGameMaster';
import { Web3Provider } from '../web3/web3.provider';

export interface ICallbacks {
  onPlayerRegistered?: (newPlayer: string, nbPlayers: number) => void;
  onPlayPerformed?: (
    player: string,
    option: number,
    cardId: number,
    newPosition: number
  ) => void;
  onRolledDices?: (
    player: string,
    dice1: number,
    dice2: number,
    cardId: number,
    newPosition: number,
    options: number
  ) => void;
  onStatusChanged?: (newStatus: number) => void;
}

export interface IGame {
  address: string;
  registerToEvents(callbacks: ICallbacks);
  // getCurrentOptions();
  getGameData(): Promise<IGameData>;
  isPlayerRegistered(player: string): Promise<boolean>;
  // getNextPlayer(): Promise<string>;
  // getCurrentPlayer(): Promise<string>;
  // getStatus(): Promise<number>;
  getPlayers(): Promise<IPlayer[]>;
  // rollDices(): Promise<{
  //   dice1: number;
  //   dice2: number;
  //   newPosition: number;
  //   options: number;
  // }>;
  // play(option: number): Promise<void>;
}

export interface IPlayer {
  address: string;
  username: string;
  avatar: number;
}

export interface IGameData {
  gameMaster: string;
  status: number;
  nextPlayer: string;
  currentPlayer: string;
  currentOptions: number;
  currentCardId: number;
}

export enum eOption {
  INVALID = 0, // 0 not allowed
  NOTHING = 1, // 1
  BUY_ASSET = 2, // 2
  PAY_BILL = 4, // 4
  CHANCE = 8, // 8
  QUARANTINE = 16, // 16
}

export enum eGameStatus {
  CREATED = 0,
  STARTED = 1,
  FROZEN = 2,
  ENDED = 3,
}

export const GAME_STATUS = {
  0: 'CREATED',
  1: 'STARTED',
  2: 'FROZEN',
  3: 'ENDED',
};

export const USER_DATA_FIELDS = {
  address: 0,
  username: 1,
  // tslint:disable-next-line: object-literal-sort-keys
  avatar: 2,
  position: 3,
  hasLost: 4,
};

export const GAME_DATA_FIELDS = {
  status: 0,
  // tslint:disable-next-line: object-literal-sort-keys
  nbPlayers: 1,
  nbPositions: 2,
  token: 3,
  assets: 4,
  marketplace: 5,
  nextPlayer: 6,
  currentPlayer: 7,
  currentOptions: 8,
  currentCardId: 9,
};

export class Game implements IGame {
  private _contract: IGameMaster;
  private _onRolledDices:
    | ((player, dice1, dice2, cardId, newPosition, options) => void)
    | undefined;

  constructor(
    private _web3: Web3Provider,
    private _address: string,
    abi: ethers.ContractInterface
  ) {
    // this._contract = new ethers.Contract(this._address, abi, _web3.signer);
    this._contract = this._web3.getGameMasterContract(this._address, abi);
    this._contract.on(
      'RolledDices',
      (player, dice1, dice2, cardId, newPosition, options) => {
        if (this._onRolledDices) {
          this._onRolledDices(
            player,
            dice1,
            dice2,
            cardId,
            newPosition,
            options
          );
          this._onRolledDices = undefined;
        }
      }
    );
  }

  get address(): string {
    return this._address;
  }

  public async isPlayerRegistered(player: string): Promise<boolean> {
    return this._contract.isPlayerRegistered(player);
  }

  // public async getNextPlayer(): Promise<string> {
  //   return this._contract.nextPlayer();
  // }

  // public async getCurrentPlayer(): Promise<string> {
  //   return this._contract.currentPlayer();
  // }

  // public async getCurrentOptions(): Promise<number> {
  //   return this._contract.currentOptions();
  // }

  // public async getStatus(): Promise<number> {
  //   return this._contract.status();
  // }

  public async getGameData(): Promise<IGameData> {
    const contractGameData = await this._contract.getGameData();
    const status = +contractGameData[GAME_DATA_FIELDS.status];
    const nbPlayers = +contractGameData[GAME_DATA_FIELDS.nbPlayers];
    const nextPlayer = contractGameData[GAME_DATA_FIELDS.nextPlayer];
    const currentPlayer = contractGameData[GAME_DATA_FIELDS.currentPlayer];
    const currentOptions = +contractGameData[GAME_DATA_FIELDS.currentOptions];
    const currentCardId = +contractGameData[GAME_DATA_FIELDS.currentCardId];
    return {
      currentCardId,
      currentOptions,
      currentPlayer,
      gameMaster: this.address,
      nextPlayer,
      status,
    };
  }

  public async getPlayers(): Promise<IPlayer[]> {
    return new Promise<IPlayer[]>(async (resolve, reject) => {
      try {
        const players: IPlayer[] = [];
        const indexes: number[] = [];
        const nbPlayers = await this._contract
          .nbPlayers()
          .catch(e => console.error(e));
        for (let i = 0; i < nbPlayers; i++) {
          indexes.push(i);
        }
        const playersData = await this._contract.getPlayersData(indexes);
        for (let i = 0; i < nbPlayers; i++) {
          const playerAddress = playersData[USER_DATA_FIELDS.address][i];
          const username = playersData[USER_DATA_FIELDS.username][i];
          const avatar = +playersData[USER_DATA_FIELDS.avatar][i];
          players.push({
            address: playerAddress,
            avatar,
            username: ethers.utils.parseBytes32String(username),
          });
        }
        resolve(players);
      } catch (e) {
        reject(e);
      }
    });
  }

  // public async rollDices(): Promise<{
  //   dice1: number;
  //   dice2: number;
  //   newPosition: number;
  //   options: number;
  // }> {
  //   return new Promise((resolve, reject) => {
  //     // wait for the event
  //     this._onRolledDices = (
  //       player,
  //       dice1,
  //       dice2,
  //       cardId,
  //       newPosition,
  //       options
  //     ) => {
  //       console.log(
  //         'rollDices event',
  //         player,
  //         dice1,
  //         dice2,
  //         newPosition,
  //         options
  //       );
  //       if (player !== this._web3.currentAccount) {
  //         console.error(
  //           'Unexpected RolledDices event from another player',
  //           player
  //         );
  //         reject(`Unexpected RolledDices event from another player ${player}`);
  //       } else {
  //         resolve({ dice1, dice2, newPosition, options });
  //       }
  //     };
  //     this._contract.estimateGas.rollDices().then(gas => {
  //       this._contract
  //         .rollDices({ gasLimit: gas.mul(2).toString() })
  //         .then(response => {
  //           response
  //             .wait()
  //             .then(() => {
  //               console.log('rollDices succeed');
  //             })
  //             .catch(e => reject(e));
  //           console.log('rollDices called');
  //         })
  //         .catch(e => {
  //           reject(e);
  //         });
  //     });
  //   });
  // }

  // public play(option: number): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this._contract
  //       .play(option)
  //       .then(response => {
  //         response
  //           .wait()
  //           .then(() => {
  //             console.log('play succeed');
  //             resolve();
  //           })
  //           .catch(e => reject(e));
  //         console.log('play called');
  //       })
  //       .catch(e => {
  //         reject(e);
  //       });
  //   });
  // }

  public registerToEvents(callbacks: ICallbacks) {
    if (callbacks.onRolledDices) {
      this._contract.on('RolledDices', callbacks.onRolledDices);
    }
    if (callbacks.onPlayPerformed) {
      this._contract.on('PlayPerformed', callbacks.onPlayPerformed);
    }
    if (callbacks.onStatusChanged) {
      this._contract.on('StatusChanged', callbacks.onStatusChanged);
    }
    if (callbacks.onPlayerRegistered) {
      this._contract.on('PlayerRegistered', callbacks.onPlayerRegistered);
    }
  }
}
