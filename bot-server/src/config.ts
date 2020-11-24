import { ApiServer } from './api/api.server';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
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
    80001: [ // mumbai
      { name: 'R1D1', address: '0xf5ed59CE3698eB241dc490217c9FAbEAbE9b045a'},
      { name: 'R2D2', address: '0x4e562B63AbCeb7016B2b825DAC983a69D7701009'},
      { name: 'R3D3', address: '0x2334b578912446D3286c87B81503284632707225'},
      { name: 'R4D4', address: '0xF44F095bFF344f1b3d936b98F167df17256662D9'},
      { name: 'R5D5', address: '0xDC4598452478c44880910eC1ff453f806eC65388'},
    ],
    1337: [ // ganache
      { name: 'R1D1', address: '0x46a9E47B18Efc0655443CEA419e84b82866D76eb'},
      { name: 'R2D2', address: '0xdAFACB0A2b5c8Be978e19F3268dF2305DDC76a08'},
      { name: 'R3D3', address: '0x7F1fc6249c96090Dac9e206bF644ED6793F35229'},
      { name: 'R4D4', address: '0xd0926e3FC3eD92C05527AA732057EDE85fde82B3'},
      { name: 'R5D5', address: '0x2346764D5f5f8C9f2f7A532A80f493B6397a50f1'},
    ]
  },
  gameFactory: {
    80001: '0xb509029889B27bFCa71340f2B8ebF0cbe0295d07', // mumbai
    1337: '0x520A3Fef8C677Be3B1e4a4665cA0355525B50fD9', // ganache
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
  discord: {
    test: {
      GUILD_ID: '780374571689312266',
      GENERAL: '780374571689312271',
      GAME_CHANNELS_CATEGORY_ID: '780376434110758915',
      TEST_USER_ID: 'yvalek#7395'
    },
    prod: {
      GUILD_ID: '773475946597842954',
      GENERAL: '773475946597842956',
      GAME_CHANNELS_CATEGORY_ID: '773477314125758465',
      TEST_USER_ID: 'yvalek#7395'
    }
  }
};
