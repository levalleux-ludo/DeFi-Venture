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
      { name: 'R1D1', address: '0x01A04638569e6D0D454B35a126D7b8c7bE035629'},
      { name: 'R2D2', address: '0xE92F42cf109a7aE902A7BD215d3fe519445e013e'},
      { name: 'R3D3', address: '0x957B28Ead878b4e8b6A74251445891e22F7fb6b4'},
      { name: 'R4D4', address: '0x8f32a03441bEb231Fb0AcA4bdb2fd99e33433254'},
      { name: 'R5D5', address: '0xC136494e1Dc8A6F7c08B17ed40BF42C25B2b6576'},
    ],
    1337: [
      // ganache
      { name: 'R1D1', address: '0xBeBA8C47eCe2b13B04496E6BC15d67beafB44002' },
      { name: 'R2D2', address: '0xE2454CEE72Dc085c92b41E97cAcaFec7D1a0492A' },
      { name: 'R3D3', address: '0x61b9d9e22E886A075E1d7613f9e912FDBEa18386' },
      { name: 'R4D4', address: '0x0a5ba96354C00CAe6623a53612084Bb0826d614D' },
      { name: 'R5D5', address: '0xA60D19c5BA9d98DF4e4f704fA7Ada7B7b0D08990' },
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
    1337: '0xF016cAd5fDbD3DA3D15a5f15cC5998b40Fa7DA45', // ganache
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
