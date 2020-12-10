import { IGameFactory } from '../IGameFactory';
import { WebJSContract } from './WebJSContract';

export class GameFactory extends WebJSContract implements IGameFactory {
  public nbGames(): Promise<number> {
    return this.contract.methods.nbGames().call();
  }
  public getGameAt(index: number): Promise<string> {
    return this.contract.methods.getGameAt(index).call();
  }
  protected translateEvent(
    eventName: string,
    eventData: any,
    callback: (...args: any[]) => void
  ) {
    switch (eventName) {
      case 'GameCreated': {
        callback(eventData.gameMasterAddress, eventData.index);
        break;
      }
      default: {
        console.warn('unexpected event', eventName);
        break;
      }
    }
  }
}
