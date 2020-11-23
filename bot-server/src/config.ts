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
      { name: 'R1D1', address: '0xC3B4546E1De027148B40F2A1efC15E5A69d6a031' },
      { name: 'R2D2', address: '0xC30f79BD67F29A0795f522BCc847e8314caD613c' },
      { name: 'R3D3', address: '0x92954dbe27fA0020b2463960E1b901D01C13B297' },
      { name: 'R4D4', address: '0xcDf09FBc9Ad0C754c5280DceDe2247A6527a17b2' },
      { name: 'R5D5', address: '0x28C847BC633cdCbe5883E1095CbD106345027296' },
    ],
    1337: [ // ganache
      { name: 'R1D1', address: '0x242a40c862D1311BD21C38933681aA4a95246281'},
      { name: 'R2D2', address: '0x38144D30C304151e52AC7cAf117DF7927ad340BE'},
      { name: 'R3D3', address: '0x771A1385cE601D04D6aD8598B0E657b972BC6d49'},
      { name: 'R4D4', address: '0x78fCB7e9Ddc94aBA69a3b4E280F98A5A01ce8B4C'},
      { name: 'R5D5', address: '0xc26a63ED134340f2452817AfD39Cd94dE24343a6'},
    ]
  },
  gameFactory: {
    80001: '0x780780761Bdb9e26b697A74F631ed33a332faa3c', // mumbai
    1337: '0x201CE6aC40afD5736423537ea0197C8a4DED8937', // ganache
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
