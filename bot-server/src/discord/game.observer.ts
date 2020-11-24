import { TextChannel } from 'discord.js';
import {
  eGameStatus,
  GAME_STATUS,
  IGame,
  IPlayer,
  IGameData,
} from './../game/game';
import { AppDiscord, shortAddress } from './discord';
export class GameObserver {
  private players: Map<string, IPlayer> = new Map();
  private status: number;
  private timer: NodeJS.Timeout;
  private topic: string;

  public constructor(
    private _game: IGame,
    private _channel: TextChannel,
    private _discord: AppDiscord
  ) {
    _game.registerToEvents({
      onPlayPerformed: this.onPlayPerformed,
      onPlayerRegistered: this.onPlayerRegistered,
      onRolledDices: this.onRolledDices,
      onStatusChanged: this.onStatusChanged,
    });
    this.refreshData().then(gameData => {
      this.displayStatus(this.status);
      this.tellNextPlayer(gameData.nextPlayer);
      this.setTopic(gameData);
    });
    this.timer = setInterval(() => {
      this._discord.sendMessages(this._channel);
    }, 5000);
  }

  private async refreshData(): Promise<IGameData> {
    return new Promise(async (resolve, reject) => {
      await this._game.getGameData().then(async gameData => {
        console.log('refreshData: nextPlayer', gameData.nextPlayer);
        if (this.status !== gameData.status) {
          this.status = gameData.status;
        }
        await this._game.getPlayers().then(async players => {
          for (const player of players) {
            this.players.set(player.address, player);
          }
        });
        resolve(gameData);
      });
    });
  }

  private displayPlayerFromAddress(address: string): string {
    const player = this.players.get(address);
    if (player) {
      return this.displayPlayer(player);
    } else {
      console.error('Unable to find player with address ' + address);
      return shortAddress(address);
    }
  }
  private displayPlayer(player: IPlayer): string {
    const userIdInTopic = (userId: string) => `<@!${userId}>`;
    const discordId = this.getDiscordId(player.address);
    let text = `${player.username}`;
    if (discordId) {
      text += `(${userIdInTopic(discordId)})`;
    }
    return text;
  }

  private getDiscordId(address: string): string | undefined {
    return this._discord.getUserIdFromAccount(address)?.userId;
  }

  private onPlayerRegistered = (newPlayer: string, nbPlayers: number) => {
    this.refreshData().then(gameData => {
      this._discord.sendMessageToChannel(
        this._channel,
        `New Player ${this.displayPlayerFromAddress(
          newPlayer
        )} has just joined the game`
      );
      this.setTopic(gameData);
    });
  };

  private displayPlayedOption(
    player: string,
    option: number,
    newPosition: number
  ) {
    this._discord.sendMessageToChannel(
      this._channel,
      `Player ${this.displayPlayerFromAddress(
        player
      )} has just played with option ${option} on position ${newPosition}`
    );
  }

  private onPlayPerformed = (
    player: string,
    option: number,
    cardId: number,
    newPosition: number
  ) => {
    this.refreshData().then(gameData => {
      this.displayPlayedOption(player, option, newPosition);
      this.tellNextPlayer(gameData.nextPlayer);
      this.setTopic(gameData);
    });
  };

  private displayRolledDices(
    player: string,
    dice1: number,
    dice2: number,
    newPosition: number
  ) {
    // TODO get position description
    this._discord.sendMessageToChannel(
      this._channel,
      `Player ${this.displayPlayerFromAddress(
        player
      )} has just rolled the dices. He's got ${dice1}+${dice2} and move to position ${newPosition} `
    );
  }

  private displayChance(player, cardId) {
    // TODO get chance description
    this._discord.sendMessageToChannel(
      this._channel,
      `Player ${this.displayPlayerFromAddress(
        player
      )} picked the following Chance: ${cardId}`
    );
  }

  private displayOptions(player, options) {
    // TODO get options description
    this._discord.sendMessageToChannel(
      this._channel,
      `Player ${this.displayPlayerFromAddress(
        player
      )} has the following options: ${options}`
    );
  }

  private onRolledDices = (
    player: string,
    dice1: number,
    dice2: number,
    cardId: number,
    newPosition: number,
    options: number
  ) => {
    this.refreshData().then(gameData => {
      this.displayRolledDices(player, dice1, dice2, newPosition);
      if (this.isChance(newPosition)) {
        this.displayChance(player, cardId);
      }
      this.displayOptions(player, options);
    });
  };

  private isChance(position: number): boolean {
    // TODO check if position is chance block
    return false;
  }

  private displayStatus(status: number) {
    this._discord.sendMessageToChannel(
      this._channel,
      `The game is now: ${GAME_STATUS[status]}`
    );
    switch (status) {
      case eGameStatus.CREATED: {
        this._discord.sendMessageToChannel(
          this._channel,
          `***When all players ready, click on 'Start Game'***`
        );
        break;
      }
      default: {
        break;
      }
    }
  }

  private onStatusChanged = (newStatus: number) => {
    this.refreshData().then(gameData => {
      this.tellNextPlayer(gameData.nextPlayer);
    });
  };

  private async setTopic(gameData: IGameData) {
    let topic = `[status: ${GAME_STATUS[gameData.status]}]`;
    let list = '';
    for (const player of this.players.values()) {
      list += `${this.displayPlayer(player)}, `;
    }
    if (list.length > 0) {
      list = list.substring(0, list.length - 2); // remove the last ', '
    }
    topic += `[players: ${list}]`;
    // if (gameData.status === eGameStatus.STARTED) {
    //   topic += `[current player: ${this.displayPlayerFromAddress(
    //     gameData.nextPlayer
    //   )}]`;
    // }
    if (topic !== this.topic) {
      this.topic = topic;
      console.log('refresh channel topic:', topic);
      await this._discord.setChannelTopic(this._channel.id, topic);
    }
    // await this._channel
    //   .setTopic(topic)
    // .then(newChannel => {
    //   console.log(`Channel's new topic is ${newChannel.topic}`);
    // })
    // .catch(e => {
    //   console.error(e);
    // });
  }

  private tellNextPlayer = (nextPlayer: string) => {
    const message = `${this.displayPlayerFromAddress(
      nextPlayer
    )} it's your turn to play!`;
    this._discord.sendMessageToChannel(this._channel, message);
  };
}
