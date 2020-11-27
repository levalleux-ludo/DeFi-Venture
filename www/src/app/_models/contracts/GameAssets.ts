import { ethers } from 'ethers';
import gameAssetsABI from '../../../../../buidler/artifacts/GameAssets.json';


export class GameAssets {
  contract: ethers.Contract;
  constructor(address: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(
      address,
      gameAssetsABI.abi,
      signer
    );
  }

  public async approveForAll(account: string) {
    return new Promise(async (resolve) => {
      const response = await this.contract.setApprovalForAll(account, true);
      await response.wait();
      resolve();
    });
  }
}
