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
    137: [
      // matic
      { name: 'R1D1', address: '0x81309778Ff320c113D206a61f8b8C2C64305BBEf' },
      { name: 'R2D2', address: '0xE053E117d372Cd7C4a42DeC0F60B59f2d524f147' },
      { name: 'R3D3', address: '0x52106f096Cae1b0cD3BD0486b380392853497f47' },
      { name: 'R4D4', address: '0x0B09e8dfdB6342C4590B09362e464961bbD22d4e' },
      { name: 'R5D5', address: '0x3CcBbdda90317562Bf57fa90D8751296D2e4cc0D' },
    ],
    80001: [
      // mumbai
      { name: 'R1D1', address: '0x2Fef88fa213BB229506a573ca58D0D1D16bb1306' },
      { name: 'R2D2', address: '0xbdcC0c77C8A772f679c9808396e112F1Ac290020' },
      { name: 'R3D3', address: '0xe1b1DD04ef13CA5E60ED8ffe72BED2d1293c4858' },
      { name: 'R4D4', address: '0xA6452f2226f23F3b7a69eE347760F871dEe78Fbc' },
      { name: 'R5D5', address: '0xfB564B658CF8de9657371B5bD025C0CFfF4cdF2E' },
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
    137: '0x9a5B2B6D0fDfAE2208ACc9CebE75f4782C5274b6', // matic
    80001: '0x418e73896826Cf3cbeb899BF741b8f16f42219D9', // mumbai
    1337: '0xb2b4f6ff060B2218b260AFA8abAA6761882581E9', // ganache
  },
  networks: {
    ganache: {
      chainId: 1337,
      name: 'local (Ganache)',
      nodeUrl: `http://127.0.0.1:7545`,
      portisId: 'unknown',
      wssUrl: 'ws://127.0.0.1:7545',
    },
    ganache_docker: {
      chainId: 1337,
      name: 'local (Ganache)',
      nodeUrl: `http://host.docker.internal:7545`,
      portisId: 'unknown',
      wssUrl: 'unknown',
    },
    matic: {
      chainId: 137,
      name: 'MATIC',
      // nodeUrl: 'https://rpc-mumbai.maticvigil.com',
      nodeUrl: `https://rpc-mainnet.maticvigil.com/v1/${process.env.MATICVIGIL_API_KEY}`,
      portisId: 'matic',
      wssUrl: `wss://rpc-mainnet.maticvigil.com/ws/v1/${process.env.MATICVIGIL_API_KEY}`,
    },
    mumbai: {
      chainId: 80001,
      name: 'Mumbai',
      // nodeUrl: 'https://rpc-mumbai.maticvigil.com',
      nodeUrl: `https://rpc-mumbai.maticvigil.com/v1/${process.env.MATICVIGIL_API_KEY}`,
      portisId: 'maticMumbai',
      wssUrl: `wss://rpc-mumbai.maticvigil.com/ws/v1/${process.env.MATICVIGIL_API_KEY}`,
    },
  },
  schedule: '0/20 * * * * *', // every 20 seconds
};
