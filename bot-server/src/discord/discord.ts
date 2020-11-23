import { config } from './../config';
// import {
//   ArgsOf,
//   Client,
//   Command,
//   CommandMessage,
//   CommandNotFound,
//   Discord,
//   On, // Use the Client that are provided by @typeit/discord
// } from '@typeit/discord';
// You must import the types from @types/discord.js
import {
  CategoryChannel,
  Channel,
  Client,
  Guild,
  GuildChannel,
  Message,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import fetch from 'node-fetch';
import { REPL_MODE_SLOPPY } from 'repl';
import { GameFactory } from '../game/game.factory';
import { IGame } from './../game/game';
import { GameObserver } from './game.observer';

const COMMAND_PREFIX = '!';

const discord_config = config.discord[(process.env.NODE_ENV === "production") ? 'prod' : 'test'];

export const GUILD_ID = discord_config.GUILD_ID;

export const GAME_CHANNELS_CATEGORY_ID = discord_config.GAME_CHANNELS_CATEGORY_ID;

export const GENERAL_CHANNEL_ID = discord_config.GENERAL;

export const TEST_USER_ID = discord_config.TEST_USER_ID;

// Decorate the class with the @Discord decorator
// @Discord(COMMAND_PREFIX)
export class AppDiscord {
  private _client: Client;
  private _prefix: string = '!';
  private _sayHelloMessage: string = 'hello !';
  private _commandNotFoundMessage: string = 'command not found...';
  private _userAccounts = new Map<
    string,
    { userId: string; username: string }
  >();
  private _channelGames = new Map<string, TextChannel>();
  private _gameObservers = new Map<string, GameObserver>();
  private isReady = false;
  private _readyWaiters: Array<() => void> = [];

  public constructor(private _gameFactory: GameFactory) {
    console.log('process.env.DISCORD_TOKEN', process.env.DISCORD_TOKEN);
    if (
      process.env.DISCORD_TOKEN === undefined ||
      process.env.DISCORD_TOKEN === ''
    ) {
      throw new Error(
        "You must specify a 'DISCORD_TOKEN' environment variable"
      );
    }
    this._client = new Client();
    // In the login method, you must specify the glob string to load your classes (for the framework).
    // In this case that's not necessary because the entry point of your application is this file.
    this._client
      .login(
        process.env.DISCORD_TOKEN as string
        //, `${__dirname}/*Discord.ts` // glob string to load the classes
      )
      .then(() => {
        this.isReady = true;
        this._readyWaiters.forEach(callback => {
          callback();
        });
        this._readyWaiters = [];
      })
      .catch(e => console.error(e));
  }

  public async waitReady() {
    return new Promise((resolve, reject) => {
      if (this.isReady) {
        resolve();
      } else {
        this._readyWaiters.push(() => {
          resolve();
        });
      }
    });
  }

  public async deleteAll() {
    await this.waitReady();
    await this.getAllGameChannels(GUILD_ID, GAME_CHANNELS_CATEGORY_ID).then(
      async channels => {
        console.log('Delete all game channels:', channels.length);
        for (const channel of channels) {await channel.delete();}
        // throw new Error('STOP');
      }
    );
  }

  public async createObservers() {
    await this.waitReady();
    await this.getGameChannelsCategory(GAME_CHANNELS_CATEGORY_ID);
    await this.getAllGameChannels(GUILD_ID, GAME_CHANNELS_CATEGORY_ID).then(
      async channels => {
        console.log('game channels:', channels.length);
        // for (const channel of channels) {await channel.delete();}
        // throw new Error('STOP');
      }
    );
    for (const game of this._gameFactory.games) {
      const channel = await this.createChannelForGame(game);
      const observer = new GameObserver(game, channel, this);
      this._gameObservers.set(game.address, observer);
    }
    this._gameFactory.on('GameCreated', async (game: IGame) => {
      const channel = await this.createChannelForGame(game);
      const observer = new GameObserver(game, channel, this);
      this._gameObservers.set(game.address, observer);
    });
  }

  public resolveUserAccount(userId: string, username: string, account: string) {
    if (!this.isReady) {
      throw new Error('Instance nor ready');
    }
    this._userAccounts.set(account, { userId, username });
  }

  public async createChannelForGame(game: IGame): Promise<TextChannel> {
    await this.waitReady();
    const channelName = `game-${this.shortAddress(game.address)}`;
    let channel = await this.findTextChannel(
      channelName,
      GAME_CHANNELS_CATEGORY_ID
    );
    if (!channel) {
      channel = await this.createTextChannel(
        channelName,
        GAME_CHANNELS_CATEGORY_ID
      );
    }
    this._channelGames.set(game.address, channel);
    return channel;
  }

  public async getGuild(): Promise<string> {
    return GUILD_ID;
  }

  public async getGeneralChannel(): Promise<TextChannel> {
    await this.waitReady();
    return new Promise((resolve, reject) => {
      this._client.channels.fetch(GENERAL_CHANNEL_ID).then((channel) => {
        resolve(channel as TextChannel);
      }).catch (e => reject(e));
    });
  }

  public async getChannelFromGame(gameAddress: string): Promise<TextChannel | undefined> {
    await this.waitReady();
    return this._channelGames.get(gameAddress);
  }

  public getUserIdFromAccount(
    account: string
  ): { userId: string; username: string } | undefined {
    if (!this.isReady) {
      throw new Error('Instance nor ready');
    }
    return this._userAccounts.get(account);
  }

  public async addUserToGuild(userId: string, accessToken) {
    await this.waitReady();
    await this._client.guilds.fetch(GUILD_ID).then(async guild => {
      try {
        guild.addMember(userId, { accessToken }).catch(e => {
          // do not complain, it happens when the member is already in the guild
        })
      } catch (e) {
        // do not complain, it happens when the member is already in the guild
      }
    });
  }
  // When the "message" event is triggered, this method is called with a specific payload (related to the event)
  // @On('message')
  // private async onMessage([message]: ArgsOf<"message">, client: Client) {
  //   // Your logic...
  //   try {
  //     if (AppDiscord._client?.user?.id !== message.author.id) {
  //       if (message.content[0] === this._prefix) {
  //         const cmd = message.content.replace(this._prefix, '').toLowerCase();
  //         switch (cmd) {
  //           case 'hello':
  //             message.reply(this._sayHelloMessage);
  //             break;
  //           default:
  //             message.reply(this._commandNotFoundMessage);
  //             break;
  //         }
  //       }
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }

  // Reachable with the command: !hello
  // @Command('hello')
  // private hello([message]: ArgsOf<'commandMessage'>) {
  //   message.reply(this._sayHelloMessage);
  // }

  // @Command('invite')
  // private invite([message]: ArgsOf<'commandMessage'>) {
  //   message.reply(`I'm going to invite the test user to this server`);
  //   this._client.channels.fetch(GUILD_ID).then(guild => {
  //     (guild as GuildChannel).createInvite().then(invite => {
  //       console.log('invite', invite, invite.code, invite.url);
  //       message.reply(`Here is the invite: ${invite.code}`);
  //     });
  //   });
  // }

  // @Command('create :game')
  // private createGame([message]: ArgsOf<'commandMessage'>) {
  //   message.reply(`I'm gonna create a game for you with ${message.args.game}`);
  //   this._client.channels
  //     .fetch(GAME_CHANNELS_CATEGORY_ID)
  //     .then(parentCategory => {
  //       message.guild?.channels
  //         .create('new-channel' + message.args.game, {
  //           parent: parentCategory,
  //           type: 'text',
  //         })
  //         .then(channel => {
  //           message.reply(`Link to the game channel: <#${channel.id}>`);
  //           channel.send('Welcome to the game ' + message.args.game);
  //         })
  //         .catch(e => {
  //           console.error(e);
  //         });
  //     })
  //     .catch(e => {
  //       console.error(e);
  //     });
  // }

  private async createTextChannel(
    name: string,
    parentCategoryId
  ): Promise<TextChannel> {
    const parentCategory = await this._client.channels.fetch(parentCategoryId);
    const guild = await this._client.guilds.fetch(GUILD_ID);
    return guild.channels.create(name, {
      parent: parentCategory,
      type: 'text',
    });
  }

  private async findTextChannel(
    channelName,
    parentCategoryId
  ): Promise<TextChannel> {
    return new Promise((resolve, reject) => {
      // console.log('find channel with name', channelName);
      // console.log(
      //   'nb channels in cache:',
      //   this._client.channels.cache.array().length
      // );
      const found = this._client.channels.cache
        .array()
        .find(
          child => (child as TextChannel).name === channelName
        ) as TextChannel;
      console.log(channelName, 'found', found !== undefined);
      resolve(found);
    });
    // const parentCategory = await this._client.channels.fetch(parentCategoryId);
    // const guild = await this._client.guilds.fetch(GUILD_ID);
    // return (parentCategory as CategoryChannel).children.find(
    //   child => child.name === channelName
    // ) as TextChannel;
  }

  // !bye
  // !yo
  // @CommandNotFound()
  // private notFound([message]: ArgsOf<'commandMessage'>) {
  //   console.warn('command not found');
  //   message.reply(this._commandNotFoundMessage);
  // }

  private async getGameChannelsCategory(
    channelId: string
  ): Promise<CategoryChannel> {
    const channel = await this._client.channels.fetch(channelId);
    return channel as CategoryChannel;
  }

  private async getAllGameChannels(
    guildId: string,
    parentId: string
  ): Promise<Channel[]> {
    const gameChannels: Channel[] = [];
    return new Promise((resolve, reject) => {
      fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: 'GET',
      }).then(response => {
        if (response.ok) {
          response
            .json()
            .then(async channels => {
              // console.log('channels', channels.length);
              const children = channels.filter(
                channel => channel.parent_id === parentId
              );
              // console.log('children', children.length);
              for (const child of children) {
                // console.log('child', child);
                const channel = await this._client.channels.fetch(child.id);
                if (channel !== undefined && channel !== null) {
                  gameChannels.push(channel);
                } else {
                  console.error('channel is null', channel);
                }
              }
              resolve(gameChannels);
            })
            .catch(e => reject(e));
        } else {
          reject(response.text);
        }
      });
    });
  }

  private shortAddress(address: string, nbChars = 4) {
    return `${address
      .toLowerCase()
      .substring(0, nbChars)}-${address
      .toLowerCase()
      .substring(address.length - nbChars)}`;
  }
}
