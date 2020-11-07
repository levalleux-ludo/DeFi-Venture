import * as bodyParser from "body-parser"; // pull information from HTML POST (express4)
import cors from 'cors';
import express from 'express';
import { BotController } from './../bot/bot.controller';

export class ApiServer {
  private _app: express.Express;

  public constructor(botController: BotController) {
    this._app = express();
    // options for cors middleware
    const options: cors.CorsOptions = {
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'X-Access-Token',
      ],
      credentials: true,
      methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
      origin: true,
      preflightContinue: false,
    };
    this._app.use(cors(options));
    this._app.use(bodyParser.urlencoded({'extended':true})); // parse application/x-www-form-urlencoded
    this._app.use(bodyParser.json()); // parse application/json
    this._app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

    /**
     * Setting routes
     */
    this._app.use('/bot', botController.router);

    this._app.options('*', cors(options));

  }

  public start(port?: number) {
    if (!port) {
      port = +(process.env.PORT || 8080);
    }
    /**
     * START the server
     */
    this._app.listen(port, () => {
      console.log('The server is running in port localhost: ', port);
    });
  }


}
