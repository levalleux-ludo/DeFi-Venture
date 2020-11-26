import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { Web3Provider } from '../web3/web3.provider';
import { Game, IGame } from './game';

export class GameFactory extends EventEmitter {
  public get games(): IGame[] {
    return this._games;
  }
  private _contract: ethers.Contract;
  private _initialized = false;
  private _games: IGame[] = [];

  public constructor(
    private web3: Web3Provider,
    address: string,
    gameFactoryAbi: ethers.ContractInterface,
    private _gameMasterAbi: ethers.ContractInterface
  ) {
    super();
    this._contract = new ethers.Contract(address, gameFactoryAbi, web3.signer);
    this._contract.on(
      'GameCreated',
      (gameMasterAddress: string, index: ethers.BigNumber) => {
        console.log('New game created! Update data model', gameMasterAddress);
        const game = this.createGame(gameMasterAddress);
        this.emit('GameCreated', game);
      }
    );
  }

  public getGame(gameMasterAddress: string): IGame | undefined {
    return this._games.find(game => game.address === gameMasterAddress);
  }

  public async initialize() {
    return new Promise((resolve, reject) => {
      if (this._initialized) {
        resolve();
      } else {
        this._contract
          .deployed()
          .then(() => {
            this._initialized = true;
            resolve();
          })
          .catch(e => reject(e));
      }
    });
  }

  public async createGames(): Promise<IGame[]> {
    if (!this._initialized) {
      throw new Error('GameFactory shall be initialized first');
    }
    return new Promise((resolve, reject) => {
      this._games = [];
      this._contract
        .nbGames()
        .then(async (nbGames: number) => {
          for (let i = 0; i < nbGames; i++) {
            await this._contract
              .getGameAt(i)
              .then((game: string) => {
                this.createGame(game);
              })
              .catch(e => {
                reject(e);
              });
          }
          resolve(this._games);
        })
        .catch((e: any) => reject(e));
    });
  }

  private createGame(gameMasterAddress: string): Game {
    const game = new Game(this.web3, gameMasterAddress, this._gameMasterAbi);
    this._games.push(game);
    return game;
  }
}
