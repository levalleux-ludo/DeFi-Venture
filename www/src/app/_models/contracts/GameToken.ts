import { ethers } from 'ethers';
import gameTokenABI from '../../../../../buidler/artifacts/GameToken.json';


export class GameToken {
  contract: ethers.Contract;
  constructor(address: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(
      address,
      gameTokenABI.abi,
      signer
    );
  }

  public async approveMax(account: string) {
    return new Promise(async (resolve) => {
      const response = await this.contract.approveMax(account);
      await response.wait();
      resolve();
    });
  }
}
