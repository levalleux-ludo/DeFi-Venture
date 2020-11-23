import { exit } from 'process';
import { parse } from 'ts-command-line-args';
import botPlayerAbi from '../../buidler/artifacts/BotPlayer.json';
import gameFactoryABI from '../../buidler/artifacts/GameFactory.json';
import gameMasterABI from '../../buidler/artifacts/GameMaster.json';
import { ApiServer } from './api/api.server';
import { BotController } from './bot/bot.controller';
import { BotFactory } from './bot/bot.factory';
import { config } from './config';
import { AppDiscord } from './discord/discord';
import { DiscordController } from './discord/discord.controller';
import { IGame } from './game/game';
import { GameFactory } from './game/game.factory';
import { Web3Provider } from './web3/web3.provider';

interface ICLArguments {
  network: string;
  // 'unhandled-rejections': string;
}

const args = parse<ICLArguments>({
  network: { type: String, defaultValue: process.env.BLOCKCHAIN_NETWORK || 'mumbai' }
  // 'unhandled-rejections': { type: String, optional: true }
}, {
  partial:true
});

console.log('NODE_ENV', process.env.NODE_ENV);

const main = async () => {
  // Initialize web3 provider
  const web3 = new Web3Provider(config.networks[args.network]);
  const network = await web3.provider.getNetwork();
  await web3.signer.getAddress().then(address => {
    console.log('Web3 initialized', network.name, 'Current account', address);
  });
  console.log('Web3 initialized. Current network', network);
  // Create GameFactory(provider)
  const gameFactoryAddress = config.gameFactory[network.chainId];
  const gameFactory = new GameFactory(
    web3,
    gameFactoryAddress,
    gameFactoryABI.abi,
    gameMasterABI.abi
  );
  // call gameFactory.createGames()
  await gameFactory.initialize().then(async () => {
    console.log('GameFactory connected at address', gameFactoryAddress);
    await gameFactory.createGames().then((games: IGame[]) => {
      console.log('nbGames', games.length);
    });
  });

  // create BotFactory(provider)
  const botFactory = new BotFactory(gameFactory);
  // call botFactory.createBots(gameFactory.getGames)
  await botFactory.createBots(config.bots[network.chainId], web3, botPlayerAbi.abi);
  const botController = new BotController(botFactory);
  const appDiscord = new AppDiscord(gameFactory);
  const discordController = new DiscordController(appDiscord);
  appDiscord.createObservers();
  // create and start apiServer
  const apiServer = new ApiServer(botController, discordController);
  apiServer.start(config.api_port);
  // create and start scheduler(botFactory)
  setImmediate(() => {
    botFactory.check();
  });
};

main();
