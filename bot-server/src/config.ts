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
    1337: [
      { name: 'R1D1', address: '0x0C32239339ad7FE0Bd4ED891082bEECbF9e96a49'},
      { name: 'R2D2', address: '0x3b86a58C6D665423CF38aC54C06127254F929BF0'},
      { name: 'R3D3', address: '0x253866f4baC67B45c2E7A1d5c0D8959A6277f836'},
      { name: 'R4D4', address: '0x4171f3147e150eC5549996eAaeeaBcdB4eE776c0'},
      { name: 'R5D5', address: '0x1094c5146D39Cb59955bB8cB58c6255487143e3E'},
    ]
  },
  gameFactory: {
    80001: '0x780780761Bdb9e26b697A74F631ed33a332faa3c', // mumbai
    1337: '0x37242Ddb89511f1Eaef07Eb2e5383A877b66BEF8', // ganache
  },
  networks: {
    ganache: {
      chainId: 1337,
      name: 'local (Ganache)',
      nodeUrl: `http://127.0.0.1:7545`,
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
