import {
  CategoryChannel,
  Client,
  GuildChannel,
  Message,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import { config as dotenvConfig } from 'dotenv';
import fetch from 'node-fetch';
import { resolve } from 'path';
const res = dotenvConfig({
  debug: true,
  path: resolve(__dirname, './../.env'),
});
if (res.error) {
  throw res.error;
}

console.log('reading config...');

const GUILD_ID = '773475946597842954';

const GAME_CHANNELS_CATEGORY_ID = '773477314125758465';

const client = new Client();

client.login(process.env.DISCORD_TOKEN as string);

client.guilds.fetch(GUILD_ID).then(guild => {
  client.channels
    .fetch(GAME_CHANNELS_CATEGORY_ID)
    .then(category => {
      if (!category) {
        console.error('Unable to find category channel');
      }
      category
        .fetch()
        .then(channel => {
          const id = channel.id;
          client.channels
            .fetch(id)
            .then(clientChannel => {
              const isEquals = clientChannel === channel;
              console.log('isEquals', isEquals);
              console.log('is Category', channel instanceof CategoryChannel);
              const children = (channel as CategoryChannel).children.array();
              console.log('children', children.length);
              const channels = client.channels.cache.array();
              console.log('channels', channels.length);
              guild.channels.cache.forEach((value, key) => {
                console.log('key', key, 'value', value);
              });
            })
            .catch(e => {
              console.error('Unable to fetch client channel' + e);
            });
        })
        .catch(e => {
          console.error('Unable to fetch category channel' + e);
        });
    })
    .catch(e => {
      console.error('error when fetching category channel' + e);
    });
});

fetch(`https://discord.com/api/guilds/${GUILD_ID}/channels`, {
  headers: {
    Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
  },
  method: 'GET',
}).then(response => {
  if (response.ok) {
    response.json().then(channels => {
      const children = channels.filter(
        channel => channel.parent_id === GAME_CHANNELS_CATEGORY_ID
      );
      console.log('children', children.length);
      children.forEach(element => {
        console.log(element.name);
      });
    });
  }
});
