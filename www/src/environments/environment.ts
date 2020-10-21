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
  networks: {
    l1: { name: 'L1 (Goerli)', portisId: 'goerli', chainId: 5, nodeUrl: `https://goerli.infura.io/v3/833d4fef573b4c429e7f283dac2ba507`,
     gasPrice: '100000000', gasLimit: 400000, explorer: 'https://goerli.etherscan.io/'  },
    l2: { name: 'L2 (Mumbai)', portisId: 'maticMumbai', chainId: 80001, nodeUrl: 'https://rpc-mumbai.matic.today',
     gasPrice: '1000000000', gasLimit: 4000000, explorer: 'https://mumbai-explorer.matic.today/' }
  },
  contracts: {
    5: { // goerli
      gameFactory: '0xe1b3Fa15d00d011F4572Ca92C708EB475DA6b00E',
      greeter: '0x98897Bad75F2Fc3D172F3c52FDb87f69580f01Fa',
      gasRelay: 'tbd'
    },
    80001: { // mumbai
      gameFactory: '0xf417DAF7106BEc2ee19403259340c53336e4CB81',
      greeter: '0x83a4BcdD650f67b7DbC92346B20e97fef660Ee20',
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
