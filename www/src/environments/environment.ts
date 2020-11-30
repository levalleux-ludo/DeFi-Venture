// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export interface INetwork {
  name: string;
  portisId: string;
  chainId: number;
  nodeUrl: string;
  gasPrice: string;
  gasLimit: number;
  explorer: string;
  symbol: string;
}

export interface IContracts {
  gameFactory: string;
  greeter: string;
}

export const environment = {
  production: false,
  // botServerUrl: 'http://localhost:8899',
  botServerUrl: 'https://defibot.levalleux.online',
  defaultNetwork: 'matic',
  networks: {
    l1: { name: 'L1 (Goerli)', portisId: 'goerli', chainId: 5, nodeUrl: `https://goerli.infura.io/v3/833d4fef573b4c429e7f283dac2ba507`,
     gasPrice: '100000000', gasLimit: 400000, explorer: 'https://goerli.etherscan.io/', symbol: 'ETH'  },
    matic: { name: 'MATIC', portisId: 'matic', chainId: 137, nodeUrl: 'https://rpc-mainnet.maticvigil.com/v1/aab3069bd822af86609df80c02f9d0e8642b3b6b',
     gasPrice: '1000000000', gasLimit: 4000000, explorer: 'https://explorer-mainnet.maticvigil.com', symbol: 'MATIC' },
    mumbai: { name: 'Mumbai', portisId: 'maticMumbai', chainId: 80001, nodeUrl: 'https://rpc-mumbai.maticvigil.com/v1/aab3069bd822af86609df80c02f9d0e8642b3b6b',
     gasPrice: '1000000000', gasLimit: 4000000, explorer: 'https://mumbai-explorer.matic.today/', symbol: 'MATIC' },
    local: { name: 'Local (Ganache)', portisId: 'local', chainId: 1337, nodeUrl: 'http://localhost:7545',
    gasPrice: '100000000', gasLimit: 400000, explorer: 'http://localhost:7545/', symbol: 'ETH'}
  },
  contracts: {
    5: { // goerli
      gameFactory: '',
      greeter: '',
      gasRelay: 'tbd'
    },
    137: { // matic
      gameFactory: '0x9a5B2B6D0fDfAE2208ACc9CebE75f4782C5274b6',
      greeter: '',
      gasRelay: 'tbd'
    },
    80001: { // mumbai
      gameFactory: '0x418e73896826Cf3cbeb899BF741b8f16f42219D9',
      greeter: '',
      gasRelay: 'tbd'
    },
    1337: { // ganache
      gameFactory: '0xb2b4f6ff060B2218b260AFA8abAA6761882581E9',
      greeter: '',
      gasRelay: 'tbd'
    }
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
