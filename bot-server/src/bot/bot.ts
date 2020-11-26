import { ethers } from 'ethers';
import { Game } from '../game/game';
import { Web3Provider } from '../web3/web3.provider';
import { eGameStatus, eOption, IGame } from './../game/game';

enum ePlayStatus {
  WAITING,
  MUST_PLAY,
  PLAYING,
}

interface IPlayStatus {
  [game: string]: ePlayStatus;
}

export class Bot {
  private _games: IGame[] = [];
  private _playStatus: IPlayStatus = {};
  private _contract: ethers.Contract;
  private _onRolledDices:
    | ((player, dice1, dice2, cardId, newPosition, options) => void)
    | undefined;

  public constructor(
    private _web3: Web3Provider,
    private _address: string,
    abi: ethers.ContractInterface,
    private _username: string,
    private _avatar: number
  ) {
    console.log('created Bot with address', _address);
    this._contract = new ethers.Contract(this._address, abi, _web3.signer);
  }

  public isRegistered(game: IGame) {
    return this._games.includes(game);
  }

  public async checkAllGames() {
    for (const game of this._games) {
      await this.check(game).catch(e => {
        console.error(e);
      });
    }
  }

  public async check(game: IGame) {
    const gameData = await game.getGameData();
    const gameStatus = gameData.status;
    const nextPlayer = gameData.nextPlayer;
    const currentPlayer = gameData.currentPlayer;
    if (
      gameStatus === eGameStatus.CREATED ||
      gameStatus === eGameStatus.FROZEN
    ) {
      // Nothing to do
    } else if (gameStatus === eGameStatus.ENDED) {
      // TODO: cleaning ?
    } else {
      // eGameStatus.STARTED
      console.log(
        'bot',
        this._username,
        'game',
        game.address,
        'play status',
        this._playStatus[game.address]
      );
      if (
        this._address === nextPlayer &&
        this._playStatus[game.address] === ePlayStatus.WAITING
      ) {
        // I'm the next player and I'm not playing yet --> I must roll the dices, then play after the 'RolledDice' event has been received
        this._playStatus[game.address] = ePlayStatus.MUST_PLAY;
        console.log(
          'bot',
          this._username,
          'game',
          game.address,
          'Roll the dices ...'
        );
        await this.rollDices(game)
          .then(async ({ options }) => {
            console.log(
              'bot',
              this._address,
              'game',
              game.address,
              'Dices rolled! options',
              options
            );
            // Now play !
            this._playStatus[game.address] = ePlayStatus.PLAYING;
            console.log('bot', this._username, 'can play now');
            await this.play(game, options)
              .then(() => {
                console.log(
                  'bot',
                  this._username,
                  'game',
                  game.address,
                  'play ended'
                );
                this._playStatus[game.address] = ePlayStatus.WAITING;
              })
              .catch(e => {
                console.error(e);
                this._playStatus[game.address] = ePlayStatus.MUST_PLAY; // retry ?
              });
          })
          .catch(e => {
            console.error(e);
            this._playStatus[game.address] = ePlayStatus.WAITING; // retry ?
          });
      } else if (
        this._address === currentPlayer &&
        this._playStatus[game.address] === ePlayStatus.MUST_PLAY
      ) {
        // I'm the current player and I didn't play yet --> I must send the play transaction with the chosen option
        this._playStatus[game.address] = ePlayStatus.PLAYING;
        console.log('bot', this._username, `must play now`);
        await this.play(game, gameData.currentOptions)
          .then(() => {
            console.log(
              'bot',
              this._username,
              'game',
              game.address,
              'play ended'
            );
            this._playStatus[game.address] = ePlayStatus.WAITING;
          })
          .catch(e => {
            console.error(e);
            this._playStatus[game.address] = ePlayStatus.MUST_PLAY; // retry ?
          });
      }
    }
  }

  public async initialize(allGames: IGame[]) {
    await this._contract.deployed();
    this._games = [];
    for (const game of allGames) {
      const isRegistered = await game
        .isPlayerRegistered(this._address)
        .catch((e: any) => {
          throw e;
        });
      if (isRegistered) {
        await this.addGame(game);
      } else {
        // console.log(
        //   'bot',
        //   this._address,
        //   'is not registered to game',
        //   game.address
        // );
      }
    }
  }

  public async register(game: IGame) {
    if (!this._games.includes(game)) {
      return new Promise((resolve, reject) => {
        this._contract
          .register(
            game.address,
            ethers.utils.formatBytes32String(this._username),
            this._avatar
          )
          .then(async response => {
            console.log('Tx sent', response.hash);
            await response
              .wait()
              .then(async receipt => {
                console.log('Tx validated', receipt.transactionHash);
                await this.addGame(game);
                resolve();
              })
              .catch(e => reject(e));
          })
          .catch(e => reject(e));
      });
    }
  }

  private chooseOption(options: number): number {
    // If there is an opportunity to buy and balance is more than the price + 200, then buy it
    // TODO: get balance + get asset price
    const enoughCash = true;
    // tslint:disable-next-line: no-bitwise
    if (options & eOption.BUY_ASSET && enoughCash) {
      return eOption.BUY_ASSET;
    }
    // else choose the first allowed option
    for (const option of Object.values(eOption)) {
      // tslint:disable-next-line: no-bitwise
      if (options & (option as number)) {
        return option as number;
      }
    }
    return eOption.INVALID;
  }

  private async rollDices(
    game: IGame
  ): Promise<{
    dice1: number;
    dice2: number;
    newPosition: number;
    options: number;
  }> {
    return new Promise((resolve, reject) => {
      // wait for the event
      this._onRolledDices = (
        player,
        dice1,
        dice2,
        cardId,
        newPosition,
        options
      ) => {
        console.log(
          'rollDices event',
          player,
          dice1,
          dice2,
          newPosition,
          options
        );
        if (player !== this._address) {
          console.error(
            'Unexpected RolledDices event from another player',
            player
          );
          reject(`Unexpected RolledDices event from another player ${player}`);
        } else {
          resolve({ dice1, dice2, newPosition, options });
        }
      };
      this._contract.estimateGas.rollDices(game.address).then(gas => {
        this._contract
          .rollDices(game.address, { gasLimit: gas.mul(2).toString() })
          .then(response => {
            response
              .wait()
              .then(() => {
                console.log('rollDices succeed');
              })
              .catch(e => reject(e));
            console.log('rollDices called');
          })
          .catch(e => {
            reject(e);
          });
      });
    });
  }

  private async play(game: IGame, options: number) {
    const option = this.chooseOption(options);
    return new Promise((resolve, reject) => {
      this._contract
        .play(game.address, option)
        .then(response => {
          response
            .wait()
            .then(() => {
              console.log('play succeed', 'game', game.address);
              resolve();
            })
            .catch(e => reject(e));
          console.log('play called', 'game', game.address, 'option', option);
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  private async addGame(game: IGame) {
    this._games.push(game);
    const gameData = await game.getGameData();
    const gameStatus = gameData.status;
    const nextPlayer = gameData.nextPlayer;
    const currentPlayer = gameData.currentPlayer;
    this._playStatus[game.address] =
      gameStatus === eGameStatus.STARTED && currentPlayer === this._address
        ? ePlayStatus.MUST_PLAY
        : ePlayStatus.WAITING;
    game.registerToEvents({
      onPlayPerformed: (
        player: string,
        option: number,
        cardId: number,
        newPosition: number
      ) => {
        console.log(
          'bot',
          this._username,
          'received event onPlayPerformed',
          'player',
          player
        );
        if (player !== this._address) {
          this.check(game);
        } else {
          console.log('do not react to my own play event');
        }
      },
      onRolledDices: (
        player: string,
        dice1: number,
        dice2: number,
        cardId: number,
        newPosition: number,
        options: number
      ) => {
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
      },
      onStatusChanged: (newStatus: number) => {
        this.check(game);
      },
    });
    console.log(
      'bot',
      this._username,
      this._address,
      'is registered to game',
      game.address,
      'status',
      this._playStatus[game.address]
    );
    // this.check(game); // first check will be done 'asynchronously'
  }
}
