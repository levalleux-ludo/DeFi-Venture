import { Observable, Subject, BehaviorSubject } from 'rxjs';
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
  contractsAddresses = new Map<string, string>();
  signer: Signer = undefined;
  initialized: Observable<boolean>;
  isInitialized = false;
  _balanceSubjects: Map<string, Map<string, BehaviorSubject<BigNumber>>> = new Map(); // per token, per account

  constructor(
    private ethService: EthereumService
  ) {
    // this.contractsAddresses.set('usdc', addresses.goerli.usdc);
    this.initialized = new Observable(observer => {
      ethService.currentAccount.subscribe((accountData) => {
        if (accountData) {
          this.signer = accountData.signer;
          this.isInitialized = true;
          observer.next(true);
        }
      });
    });
    setInterval(() => this.updateBalances(), 2000);
  }

  public setContractAddress(token: string, address: string) {
    this.contractsAddresses.set(token, address);
    this.contracts.delete(token);
  }

  public balanceOf(token: string, account: string): Observable<BigNumber> {
    let balancesForToken: Map<string, BehaviorSubject<BigNumber>>;
    if (this._balanceSubjects.has(token)) {
      balancesForToken = this._balanceSubjects.get(token);
    } else {
      balancesForToken = new Map();
      this._balanceSubjects.set(token, balancesForToken);
    }
    if (!balancesForToken.has(account)) {
      balancesForToken.set(account, new BehaviorSubject(BigNumber.from(0)));
    }
    this.updateBalances();
    return balancesForToken.get(account).asObservable();
  }

  private updateBalances() {
    this._balanceSubjects.forEach((balancesForToken, token) => {
      balancesForToken.forEach((subject, account) => {
        this.getBalance(token, account).then((balance) => {
          subject.next(balance);
        }).catch(e => {
          console.error(e);
        });
      });
    });
  }

  public async getBalance(token: string, account: string): Promise<BigNumber> {
    await new Promise((resolve) => {
      if (!this.isInitialized) {
        this.initialized.subscribe((init) => {
          resolve();
        });
      } else {
        resolve();
      }
    });
    const contract = await this.getContract(token);
    if (!contract) {
      return undefined;
    }
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(account);
    return balance.div(BigNumber.from(10).pow(decimals));
  }

  async getContract(token: string): Promise<Contract> {
    if (!this.contractsAddresses.has(token)) {
      return undefined;
    }
    if (this.contracts.has(token)) {
      return this.contracts.get(token);
    } else {
      try {
        const contract = new Contract(
          this.contractsAddresses.get(token),
          ERC20_abi,
          this.signer
        );
        await contract.deployed();
        this.contracts.set(token, contract);
        return contract;
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }
  }
}
