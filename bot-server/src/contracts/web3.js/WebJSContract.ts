import { WebJSWeb3Provider } from '../../web3/web3.provider';
import { IContract } from '../IContract';
import {AbiItem} from 'web3-utils';
import Web3 from 'web3';
import { Contract as EthContract } from 'web3-eth-contract';

export abstract class WebJSContract implements IContract {
  protected contract: EthContract;
  constructor(address: string, abi: AbiItem[], protected web3: Web3, protected account?: string) {
    this.contract = new web3.eth.Contract(abi, address);
  }
  public on(eventName: string, callback: (...args: any[]) => void) {
    this.contract.events[eventName]((error, event)  => {
      if (!error) {
        // console.log('received event', event);
        this.translateEvent(event.event, event.returnValues, callback);
      } else {
        console.error(error);
      }
    })
  }

  protected abstract translateEvent(eventName: string, eventData: any, callback: (...args: any[]) => void);
  public async deployed(): Promise<IContract> {
    return this;
  }

}
