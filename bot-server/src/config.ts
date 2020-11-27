import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { ApiServer } from './api/api.server';
const res = dotenvConfig({
  debug: true,
  path: resolve(__dirname, './../.env'),
});
if (res.error) {
  throw res.error;
}

console.log('reading config...');
// console.log(process.env);
if (!process.env.MNEMONIC) {
  throw new Error('Please set your MNEMONIC in a .env file');
}

if (!process.env.MATICVIGIL_API_KEY) {
  throw new Error('Please set your MATICVIGIL_API_KEY in a .env file');
}

export const config = {
  api_port: 8899,
  bots: {
    80001: [
      // mumbai
      { name: 'R1D1', address: '0x01A04638569e6D0D454B35a126D7b8c7bE035629' },
      { name: 'R2D2', address: '0xE92F42cf109a7aE902A7BD215d3fe519445e013e' },
      { name: 'R3D3', address: '0x957B28Ead878b4e8b6A74251445891e22F7fb6b4' },
      { name: 'R4D4', address: '0x8f32a03441bEb231Fb0AcA4bdb2fd99e33433254' },
      { name: 'R5D5', address: '0xC136494e1Dc8A6F7c08B17ed40BF42C25B2b6576' },
    ],
    1337: [
      // ganache
      { name: 'R1D1', address: '0x5d6E4324bc2d68C0A57458790e34650d0c1a5d57' },
      { name: 'R2D2', address: '0x7D40DF8D355EaD6CA448DAD47a033CB02323FaE5' },
      { name: 'R3D3', address: '0x7A83Cc69b241e46f76e94F2335BA1fe4390a414B' },
      { name: 'R4D4', address: '0x4A10E1648A76DfFfe5D959F3af834b0c6FD43F26' },
      { name: 'R5D5', address: '0x7C51625d4bBA7AE0dbf9c228477B61895F457Bf4' },
    ],
  },
  discord: {
    prod: {
      GAME_CHANNELS_CATEGORY_ID: '773477314125758465',
      GENERAL: '773475946597842956',
      GUILD_ID: '773475946597842954',
      TEST_USER_ID: 'yvalek#7395',
    },
    test: {
      GAME_CHANNELS_CATEGORY_ID: '780376434110758915',
      GENERAL: '780374571689312271',
      GUILD_ID: '780374571689312266',
      TEST_USER_ID: 'yvalek#7395',
    },
  },
  gameFactory: {
    80001: '0x66C703021aDEa4f908339199cDf1447899C947Ba', // mumbai
    1337: '0x4FF43d90A4Fb973fc025E5B743D0264beb949d5B', // ganache
  },
  networks: {
    ganache: {
      chainId: 1337,
      name: 'local (Ganache)',
      nodeUrl: `http://127.0.0.1:7545`,
      portisId: 'unknown',
      wssUrl: 'unknown',
    },
    ganache_docker: {
      chainId: 1337,
      name: 'local (Ganache)',
      nodeUrl: `http://host.docker.internal:7545`,
      portisId: 'unknown',
      wssUrl: 'unknown',
    },
    mumbai: {
      chainId: 80001,
      name: 'L2 (Mumbai)',
      // nodeUrl: 'https://rpc-mumbai.maticvigil.com',
      nodeUrl: `https://rpc-mumbai.maticvigil.com/v1/${process.env.MATICVIGIL_API_KEY}`,
      portisId: 'maticMumbai',
      wssUrl: `wss://rpc-mumbai.maticvigil.com/ws/v1/${process.env.MATICVIGIL_API_KEY}`,
    },
  },
  schedule: '0/20 * * * * *', // every 20 seconds
};
