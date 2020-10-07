import { ethers, Signer } from 'ethers';
import { AbstractContract } from './abstract-contract';

import GameMasterJSON from '../../../../buidler/artifacts/GameMaster.json';

export class GameMaster extends AbstractContract {
  contract: ethers.Contract;
  constructor(address: string, signer: Signer) {
    super();
    this.contract = new ethers.Contract(address, GameMasterJSON.abi, signer);
  }
}
