import { AppDiscord } from './discord';
import { btoa } from 'abab';
import express from 'express';
import fetch from 'node-fetch';

const DISCORD_AUTHORIZE = 'https://discordapp.com/api/oauth2/authorize';
const DISCORD_GRANT = 'https://discordapp.com/api/oauth2/token';
const DISCORD_PROFILE = 'http://discordapp.com/api/users/@me';
if (
  process.env.DISCORD_CLIENT_ID === undefined ||
  process.env.DISCORD_CLIENT_ID === ''
) {
  throw new Error('Environment variable DISCORD_CLIENT_ID is not defined');
}
if (
  process.env.DISCORD_CLIENT_SECRET === undefined ||
  process.env.DISCORD_CLIENT_SECRET === ''
) {
  throw new Error('Environment variable DISCORD_CLIENT_SECRET is not defined');
}
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
// TODO: use a dynamic URL (coming from the client)
const redirect = encodeURIComponent('http://localhost:8899/discord/callback');

export class DiscordController {
  private _router = express.Router();
  public constructor(private appDiscord: AppDiscord) {
    this._router.get('/', this.get);
    this._router.get('/login', this.login);
    this._router.get('/callback', this.callback);
  }

  public get router(): express.Router {
    return this._router;
  }

  private login = (req: express.Request, res: express.Response) => {
    // TODO get from client:
    // -  original front-end URL to redirect after discord authentication
    // -  backend URL (myself) to give to Discord in callback parameter
    // -  ETH account to be associated to Discord user
    res.redirect(
      `${DISCORD_AUTHORIZE}?client_id=${CLIENT_ID}&scope=${encodeURIComponent(
        'identify guilds.join'
      )}&response_type=code&redirect_uri=${redirect}`
    );
  };

  private get = (req: express.Request, res: express.Response) => {
    res.send('OK');
  };

  private callback = (req: express.Request, res: express.Response) => {
    console.log('callback from discord received');
    if (!req.query.code) {
      throw new Error('NoCodeProvided');
    }
    const code = req.query.code;
    console.log('code', code);
    const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const body = {
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:8899/discord/callback',
    };
    console.log('body', JSON.stringify(body));
    fetch(DISCORD_GRANT, {
      body: this._encode(body),
      // body: JSON.stringify(body),
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    })
      .then(response => {
        response
          .json()
          .then(json => {
            console.log('json', JSON.stringify(json));
            if (json.error) {
              res.status(400).send(json.error);
            } else {
              fetch(DISCORD_PROFILE, {
                headers: {
                  Authorization: `Bearer ${json.access_token}`,
                },
              })
                .then(response2 => {
                  response2
                    .json()
                    .then(profile => {
                      this.appDiscord.addUserToGuild(
                        profile.id,
                        json.access_token
                      );
                      // res.send(`Hello ${profile.username} id ${profile.id}`);
                      /// TODO: redirect to the original URL given by the client at login request

                      res.redirect(
                        `https://discord.com/channels/773475946597842954`
                      );
                    })
                    .catch(e => {
                      console.error(e);
                      res.status(400).send(e);
                    });
                })
                .catch(e => {
                  console.error(e);
                  res.status(400).send(e);
                });
            }
          })
          .catch(e => {
            console.error(e);
            res.status(400).send(e);
          });
      })
      .catch(e => {
        console.error(e);
        res.status(400).send(e);
      });
  };

  private _encode(obj) {
    let string = '';

    for (const [key, value] of Object.entries(obj)) {
      if (!value) continue;
      string += `&${encodeURIComponent(key)}=${encodeURIComponent(
        value as string
      )}`;
    }

    return string.substring(1);
  }
}
