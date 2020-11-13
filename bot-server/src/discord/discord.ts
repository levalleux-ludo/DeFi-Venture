import {
  ArgsOf,
  Client,
  Command,
  CommandMessage,
  CommandNotFound,
  Discord,
  On, // Use the Client that are provided by @typeit/discord
} from '@typeit/discord';
// You must import the types from @types/discord.js
import { GuildChannel, Message } from 'discord.js';

const COMMAND_PREFIX = '!';

const GUILD_ID = '773475946597842954';

const GAME_CHANNELS_CATEGORY_ID = '773477314125758465';

const TEST_USER_ID = 'yvalek#7395';

// Decorate the class with the @Discord decorator
@Discord(COMMAND_PREFIX)
export class AppDiscord {
  private _client: Client;
  private _prefix: string = '!';
  private _sayHelloMessage: string = 'hello !';
  private _commandNotFoundMessage: string = 'command not found...';

  public constructor() {
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
    this._client.login(
      process.env.DISCORD_TOKEN as string,
      `${__dirname}/*Discord.ts` // glob string to load the classes
    );
  }

  public async addUserToGuild(userId: string, accessToken) {
    await this._client.guilds.fetch(GUILD_ID).then(async guild => {
      try {
        guild.addMember(userId, { accessToken });
      } catch(e) {
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
  @Command('hello')
  private hello([message]: ArgsOf<'commandMessage'>) {
    message.reply(this._sayHelloMessage);
  }

  @Command('invite')
  private invite([message]: ArgsOf<'commandMessage'>) {
    message.reply(`I'm going to invite the test user to this server`);
    this._client.channels.fetch(GUILD_ID).then(guild => {
      (guild as GuildChannel).createInvite().then(invite => {
        console.log('invite', invite, invite.code, invite.url);
        message.reply(`Here is the invite: ${invite.code}`);
      });
    });
  }

  @Command('create :game')
  private createGame([message]: ArgsOf<'commandMessage'>) {
    message.reply(`I'm gonna create a game for you with ${message.args.game}`);
    this._client.channels
      .fetch(GAME_CHANNELS_CATEGORY_ID)
      .then(parentCategory => {
        message.guild?.channels
          .create('new-channel' + message.args.game, {
            parent: parentCategory,
            type: 'text',
          })
          .then(channel => {
            message.reply(`Link to the game channel: <#${channel.id}>`);
            channel.send('Welcome to the game ' + message.args.game);
          })
          .catch(e => {
            console.error(e);
          });
      })
      .catch(e => {
        console.error(e);
      });
  }

  // !bye
  // !yo
  @CommandNotFound()
  private notFound([message]: ArgsOf<'commandMessage'>) {
    console.warn('command not found');
    message.reply(this._commandNotFoundMessage);
  }
}
