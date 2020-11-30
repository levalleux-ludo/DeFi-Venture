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
}

export interface IContracts {
  gameFactory: string;
  greeter: string;
}

export const environment = {
  production: false,
  // botServerUrl: 'http://localhost:8899',
  botServerUrl: 'https://defibot.levalleux.online',
  defaultNetwork: 'l2',
  networks: {
    l1: { name: 'L1 (Goerli)', portisId: 'goerli', chainId: 5, nodeUrl: `https://goerli.infura.io/v3/833d4fef573b4c429e7f283dac2ba507`,
     gasPrice: '100000000', gasLimit: 400000, explorer: 'https://goerli.etherscan.io/'  },
    l2: { name: 'L2 (Mumbai)', portisId: 'maticMumbai', chainId: 80001, nodeUrl: 'https://rpc-mumbai.maticvigil.com/v1/aab3069bd822af86609df80c02f9d0e8642b3b6b',
     gasPrice: '1000000000', gasLimit: 4000000, explorer: 'https://mumbai-explorer.matic.today/' },
    local: { name: 'Local (Ganache)', portisId: 'local', chainId: 1337, nodeUrl: 'http://localhost:7545',
    gasPrice: '100000000', gasLimit: 400000, explorer: 'http://localhost:7545/'}
  },
  contracts: {
    5: { // goerli
      gameFactory: '',
      greeter: '',
      gasRelay: 'tbd'
    },
    80001: { // mumbai
      gameFactory: '0x287993768c3Af8A91a04ABD724247430246F34b9',
      greeter: '',
      gasRelay: 'tbd'
    },
    1337: { // ganache
      gameFactory: '0xBdF22b5230C7Dd9e23F97e4906E94aC1d92970Ea',
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
