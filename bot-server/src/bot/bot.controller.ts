import express from 'express';
import { BotFactory } from './bot.factory';

export class BotController {
  public _router = express.Router();

  // TODO:
  public constructor(private _botFactory: BotFactory) {
    this._router.get('/', this.getBots);
    this._router.put('/add', this.addBotToGame);
  }

  public get router(): express.Router {
    return this._router;
  }

  private getBots = (req: express.Request, res: express.Response) => {
    res.send('OK');
  };

  private addBotToGame = (req: express.Request, res: express.Response) => {
    const gameMasterAddress = req.query.game as string;
    const nbBots = parseInt(req.query.nbBots as string, 10) || 1;
    if (!gameMasterAddress) {
      res
        .status(400)
        .send('Please specify a game address in request query parameters');
      return;
    }
    if (nbBots > this._botFactory.nbBots) {
      res
        .status(400)
        .send(
          'Too much bots required. Max allowed: ' + this._botFactory.nbBots
        );
      return;
    }
    try {
      this._botFactory.addBotsToGame(nbBots, gameMasterAddress).then(() => {
        res.send({
          message: `Request: add ${nbBots} bot(s) to the game ${gameMasterAddress}`,
        });
      });
    } catch (e) {
      res.status(400).send(e);
      return;
    }
  };
}
