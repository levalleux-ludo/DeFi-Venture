import { AppDiscord } from './discord';
import { TextChannel } from 'discord.js';
import { IGame, IPlayer, GAME_STATUS, eGameStatus } from './../game/game';
export class GameObserver {
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
    _game.getStatus().then(status => this.onStatusChanged(status));
    _game.getPlayers().then(players => {
      this.listPlayers(players);
      _game.getNextPlayer().then(nextPlayer => {
        this.tellNextPlayer(nextPlayer, players);
      });
    });
  }

  private displayPlayer(address: string): string {
    const userId = this._discord.getUserIdFromAccount(address);
    return `${address}${userId ? '(' + userId + ')' : ''}`;
  }

  private onPlayerRegistered = (newPlayer: string, nbPlayers: number) => {
    this._channel.send(
      `New Player ${this.displayPlayer(newPlayer)} has just joined the game`
    );
  };

  private onPlayPerformed = (
    player: string,
    option: number,
    cardId: number,
    newPosition: number
  ) => {
    this._channel.send(
      `Player with address ${this.displayPlayer(
        player
      )} has just played with option ${option} on position ${newPosition}`
    );
  };

  private onRolledDices = (
    player: string,
    dice1: number,
    dice2: number,
    cardId: number,
    newPosition: number,
    options: number
  ) => {
    this._channel.send(
      `Player with address ${this.displayPlayer(
        player
      )} has just rolled the dices. He's got ${dice1}+${dice2} and move to position ${newPosition} `
    );
  };

  private onStatusChanged = (newStatus: number) => {
    this._channel.send(`The game is now: ${GAME_STATUS[newStatus]}`);
    switch (newStatus) {
      case eGameStatus.CREATED: {
        this._channel.send(
          `***When all players ready, click on 'Start Game'***`
        );
        break;
      }
      default: {
        break;
      }
    }
  };

  private listPlayers = (players: IPlayer[]) => {
    let list = '';
    for (const player of players) {
      list += `\n- **${player.username}** (${this.displayPlayer(
        player.address
      )})`;
    }
    if (list.length > 0) {
      list = list.substring(0, list.length - 2); // remove the last ', '
    }
    this._channel.send(`#Players list:${list}`);
  };

  private tellNextPlayer = (nextPlayer: string, allPlayers?: IPlayer[]) => {
    let message = `Next player is ${this.displayPlayer(nextPlayer)}`;
    if (allPlayers) {
      const player = allPlayers.find(aPlayer => aPlayer.address === nextPlayer);
      if (player) {
        message = `Next player is **${player.username}** (${this.displayPlayer(
          nextPlayer
        )})`;
      }
    }
    this._channel.send(message);
  };
}
