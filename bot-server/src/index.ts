import botPlayerAbi from '../../buidler/artifacts/BotPlayer.json';
import gameFactoryABI from '../../buidler/artifacts/GameFactory.json';
import gameMasterABI from '../../buidler/artifacts/GameMaster.json';
import { ApiServer } from './api/api.server';
import { BotController } from './bot/bot.controller';
import { BotFactory } from './bot/bot.factory';
import { config } from './config';
import { IGame } from './game/game';
import { GameFactory } from './game/game.factory';
import { Web3Provider } from './web3/web3.provider';

const main = async () => {
  // Initialize web3 provider
  const web3 = new Web3Provider(config.network);
  await web3.signer.getAddress().then(address => {
    console.log('Web3 initialized. Current account', address);
  });
  await web3.provider.getNetwork().then(network => {
    console.log('Web3 initialized. Current network', network);
  });
  // Create GameFactory(provider)
  const gameFactory = new GameFactory(
    web3,
    config.gameFactory,
    gameFactoryABI.abi,
    gameMasterABI.abi
  );
  // call gameFactory.createGames()
  await gameFactory.initialize().then(async () => {
    console.log('GameFactory connected at address', config.gameFactory);
    await gameFactory.createGames().then((games: IGame[]) => {
      console.log('nbGames', games.length);
    });
  });

  // create BotFactory(provider)
  const botFactory = new BotFactory(gameFactory);
  // call botFactory.createBots(gameFactory.getGames)
  await botFactory.createBots(config.bots, web3, botPlayerAbi.abi);
  // create and start apiServer(botFactory)
  const botController = new BotController(botFactory);
  const apiServer = new ApiServer(botController);
  apiServer.start(config.api_port);
  // create and start scheduler(botFactory)
};

main();
