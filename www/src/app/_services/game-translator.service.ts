import { ChancesLibraryService } from './chances-library.service';
import { AssetsLibraryService } from './assets-library.service';
import { Injectable } from '@angular/core';
import { Utils } from '../_utils/utils';
import { IGameData, GameMasterContractService, eOption, IPlayer, eSpaceType } from './game-master-contract.service';

@Injectable({
  providedIn: 'root'
})
export class GameTranslatorService {

  usernames = new Map<string, string>();
  gameData: IGameData;

  constructor(
    private gameMasterContractService: GameMasterContractService,
    private assetsLibrary: AssetsLibraryService,
    private chancesLibrary: ChancesLibraryService
  ) {
    this.gameMasterContractService.onUpdate.subscribe((gameData) => {
      this.gameData = gameData;
      if (gameData) {
        this.refreshUsernames(Array.from(gameData.players.values()));
      }
    });
  }

  refreshUsernames(players: IPlayer[]) {
    players.forEach(player => {
      this.usernames.set(player.address, player.username);
    });
  }

  getUsername(address: string): string {
    if (this.usernames.has(address)) {
      return this.usernames.get(address);
    }
    return address;
  }

  event2message(contract: string, event: any): string {
    switch (contract) {
      case 'gameMaster': {
        switch(event.type) {
          case 'StatusChanged': {
            return `Game status has changed to ${event.value.newStatus}`;
            break;
          }
          case 'PlayerRegistered': {
            return `Player ${this.getUsername(event.value.newPlayer)} has registered to the game`;
            break;
          }
          case 'PlayPerformed': {
            // return `Player ${this.getUsername(event.value.player)} has played with option ${event.value.option}`;
            return this.playPerformed(this.getUsername(event.value.player), event.value.option, event.value.newPosition);
            break;
          }
          case 'RolledDices': {
            const {player, dice1, dice2, newPosition, cardId, options} = event.value;
            return `${this.getUsername(player)} has rolled the dices, got ${dice1}+${dice2} and moved to block ${this.getBlockDescription(newPosition)}\n${this.describeOptions(newPosition, cardId, options)}`;
            break;
          }
          case 'PlayerLost': {
            const {player} = event.value;
            return `${this.getUsername(player)} lost`;
            break;
          }
          case 'PlayerWin': {
            const {player} = event.value;
            return `Congratulations to ${this.getUsername(player)}. He/she wins the game !!!!`;
            break;
          }
          default: {
            return '';
          }
        }
        break;
      }
      case 'token': {
        switch(event.type) {
          case 'Transfer': {
            if (event.value.from === Utils.ADDRESS_ZERO) {
              return `${this.getUsername(event.value.to)} has received ${event.value.value.toString()} tokens`;
            } else if (event.value.to === Utils.ADDRESS_ZERO) {
              return `${this.getUsername(event.value.from)} has spent ${event.value.value.toString()} tokens`;
            } else {
              return `${this.getUsername(event.value.from)} has transferred ${event.value.value.toString()} tokens to ${this.getUsername(event.value.to)}`;
            }
            break;
          }
          // case 'Approval': {
          //   return `Player ${event.value.owner} has approved account ${event.value.spender} for amount ${event.value.value.toString()}`;
          //   break;
          // }
          default: {
            return '';
          }
        }
        break;
      }
      case 'assets': {
        switch(event.type) {
          case 'Transfer': {
            if (event.value.from === Utils.ADDRESS_ZERO) {
              return `Player ${this.getUsername(event.value.to)} has founded startup ${this.getAssetName(event.value.assetId)}`;
            } else if (event.value.to === Utils.ADDRESS_ZERO) {
              return `Player ${this.getUsername(event.value.from)} has released company ${this.getAssetName(event.value.assetId)}`;
            } else {
              return `Player ${this.getUsername(event.value.from)} has transferred company ${this.getAssetName(event.value.assetId)} to ${this.getUsername(event.value.to)}`;
            }
            break;
          }
          // case 'Approval': {
          //   return `Player ${event.value.owner} has approved account ${event.value.spender} for amount ${event.value.value.toString()}`;
          //   break;
          // }
          default: {
            return '';
          }
        }
        break;
      }

      default:
        return '';
    }
  }

  playPerformed(player: string, option: eOption, newPosition: number): string {
    switch (option) {
      case eOption.BUY_ASSET: {
        return `${player} has found the startup at block ${newPosition}`;
        break;
      }
      case eOption.CHANCE: {
        return `${player} has played his/her chance card`;
        break;
      }
      case eOption.NOTHING: {
        return `${player} has played nothing particular`;
        break;
      }
      case eOption.PAY_BILL: {
        return `${player} has paid the bill at block ${newPosition}`;
        break;
      }
      case eOption.QUARANTINE: {
        return `${player} has been put in quarantine`;
        break;
      }
      default: {
        return 'unknown option';
        break;
      }

    }
  }

  getAssetName(assetId: number) {
    const asset = this.assetsLibrary.getAssetFromId(assetId);
    if (asset !== undefined) {
      return asset.name;
    }
    return 'unknown asset';
  }

  getBlockDescription(spaceId: number) {
    let block = '';
    if (this.gameData) {
      const space = this.gameData.playground[spaceId];
      if (space) {
        if (this.assetsLibrary.isAsset(space)) {
          const asset = this.assetsLibrary.getAssetFromId(space.assetId);
          return `startup ${asset?.name}`;
        } else {
          switch (space.type) {
            case eSpaceType.GENESIS: {
              return `Genesis block`;
              break;
            }
            case eSpaceType.CHANCE: {
              return `Chance bloc`;
              break;
            }
            case eSpaceType.QUARANTINE: {
              return 'COVID bloc';
              break;
            }
            case eSpaceType.LIQUIDATION: {
              return 'Liquidation bloc';
              break;
            }
          }
        }
      }
      return '[unknown block]';
    }
    return '[data not available]';
  }

  describeOptions(spaceId, cardId, options) {
    if (this.gameData) {
      const space = this.gameData.playground[spaceId];
      if (space) {
        if (space.type === eSpaceType.CHANCE) {
          return `Chance card: '${this.chancesLibrary.readChance(cardId)}'`;
        }
        if (this.assetsLibrary.isAsset(space)) {
          // tslint:disable-next-line: no-bitwise
          if (options & eOption.BUY_ASSET) {
            return 'Player can decide to found the startup or not';
          }
          // tslint:disable-next-line: no-bitwise
          if (options & eOption.PAY_BILL) {
            return 'Player must buy the startup product to the owner';
          }
        }
        if (space.type === eSpaceType.QUARANTINE) {
          return `Player must be locked down in quarantine and cannot play the next round`;
        }
        return '';
      }
      return '[unknown block]';
    }
    return '[data not available]';
  }

}
