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
  bots: [
    { name: 'R1D1', address: '0xC3B4546E1De027148B40F2A1efC15E5A69d6a031' },
    { name: 'R2D2', address: '0xC30f79BD67F29A0795f522BCc847e8314caD613c' },
    { name: 'R3D3', address: '0x92954dbe27fA0020b2463960E1b901D01C13B297' },
    { name: 'R4D4', address: '0xcDf09FBc9Ad0C754c5280DceDe2247A6527a17b2' },
    { name: 'R5D5', address: '0x28C847BC633cdCbe5883E1095CbD106345027296' },
  ],
  gameFactory: '0x2dD64d434f96f6e33Df89982F4143CBF83E2e6eD',
  network: {
    chainId: 80001,
    name: 'L2 (Mumbai)',
    // nodeUrl: 'https://rpc-mumbai.maticvigil.com',
    nodeUrl: `https://rpc-mumbai.maticvigil.com/v1/${process.env.MATICVIGIL_API_KEY}`,
    wssUrl: `wss://rpc-mumbai.maticvigil.com/ws/v1/${process.env.MATICVIGIL_API_KEY}`,
    portisId: 'maticMumbai',
  },
  schedule: '0/20 * * * * *', // every 20 seconds
};
