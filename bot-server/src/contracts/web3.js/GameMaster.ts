import { IGameMaster } from "../IGameMaster";
import { WebJSContract } from "./WebJSContract";

export class GameMaster extends WebJSContract implements IGameMaster {
  isPlayerRegistered(player: any): Promise<boolean> {
    return this.contract.methods.isPlayerRegistered(player).call();
  }
  getGameData(): Promise<any[]> {
    return this.contract.methods.getGameData().call();
  }
  nbPlayers(): Promise<number> {
    return this.contract.methods.nbPlayers().call();
  }
  getPlayersData(indexes: number[]): Promise<any[][]> {
    return this.contract.methods.getPlayersData(indexes).call();
  }
  protected translateEvent(eventName: string, eventData: any, callback: (...args: any[]) => void) {
    console.log('receive event', eventName, 'data', eventData);
    switch (eventName) {
      case 'RolledDices': {
        callback(eventData.player, eventData.dice1, eventData.dice2, eventData.cardId, eventData.newPosition, eventData.options);
        break;
      }
      case 'PlayPerformed': {
        callback(eventData.player, eventData.option, eventData.cardId, eventData.newPosition);
        break;
      }
      case 'StatusChanged': {
        callback(eventData.newStatus);
        break;
      }
      case 'PlayerRegistered': {
        callback(eventData.newPlayer, eventData.nbPlayers);
        break;
      }
      default: {
        console.warn('unexpected event', eventName);
        break;
      }
    }
  }

}
