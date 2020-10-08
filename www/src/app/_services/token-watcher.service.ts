import { Observable } from 'rxjs';
import { EthereumService } from './ethereum.service';
import { BigNumber, Contract, Signer } from 'ethers';
import { Injectable } from '@angular/core';

const addresses = {
  goerli: {
    usdc: '0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557'
  }
};

// standard ERC20 abi
const ERC20_abi = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Authenticated Functions
  "function transfer(address to, uint amount) returns (boolean)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

@Injectable({
  providedIn: 'root'
})
export class TokenWatcherService {

  contracts = new Map<string, Contract>();
  signer: Signer = undefined;
  initialized: Observable<boolean>;
  isInitialized = false;

  constructor(
    private ethService: EthereumService
  ) {
    this.initialized = new Observable(observer => {
      ethService.currentAccount.subscribe((accountData) => {
        if (accountData) {
          this.signer = accountData.signer;
          this.isInitialized = true;
          observer.next(true);
        }
      });
    });
  }

  public async getBalance(token: string, network: string, account: string): Promise<BigNumber> {
    await new Promise((resolve) => {
      if (!this.isInitialized) {
        this.initialized.subscribe((init) => {
          resolve();
        });
      } else {
        resolve();
      }
    });
    const contract = this.getContract(token, network);
    const decimals = await contract.decimals();
    const balance = await this.getContract(token, network)?.balanceOf(account);
    return balance.div(Math.pow(10, decimals));
  }

  getContract(token: string, network: string): Contract {
    if (this.contracts.has(token)) {
      return this.contracts.get(token);
    } else {
      try {
        const contract = new Contract(
          addresses[network][token],
          ERC20_abi,
          this.signer
        );
        this.contracts.set(token, contract);
        return contract;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }
  }
}
