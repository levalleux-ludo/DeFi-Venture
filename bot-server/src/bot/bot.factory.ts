import { ethers } from 'ethers';
import { Web3Provider } from '../web3/web3.provider';
import { GameFactory } from './../game/game.factory';
import { Bot } from './bot';

export interface IBotParams {
  name: string;
  address: string;
}

export class BotFactory {
  private _bots: Bot[] = [];
  public constructor(private _gameFactory: GameFactory) {}

  public get nbBots(): number {
    return this._bots.length;
  }

  public async createBots(
    bots: IBotParams[],
    web3: Web3Provider,
    botPlayerAbi: ethers.ContractInterface
  ) {
    let avatar = 6;
    for (const botParams of bots) {
      const bot = new Bot(
        web3,
        botParams.address,
        botPlayerAbi,
        botParams.name,
        avatar++
      );
      await bot.initialize(this._gameFactory.games);
      this._bots.push(bot);
    }
    if (this._bots.length === 0) {
      throw new Error('no bot deployed !');
    }
  }

  public check() {
    for (const bot of this._bots) {
      setImmediate(aBot => {
        aBot.checkAllGames();
      }, bot);
    }
  }

  public async addBotsToGame(nbBots: number, gameMasterAddress: string) {
    const game = this._gameFactory.getGame(gameMasterAddress);
    if (!game) {
      throw new Error(`No game found with address '${gameMasterAddress}'`);
    }
    let botIdx = 0;
    while (nbBots > 0 && botIdx < this._bots.length) {
      const bot = this._bots[botIdx];
      if (!bot.isRegistered(game)) {
        await bot.register(game);
        nbBots--;
      }
      botIdx++;
    }
    if (nbBots > 0) {
      console.error('Reaching max number of bots per game');
    }
  }
}
